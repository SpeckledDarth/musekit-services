import { createAdminClient } from "@musekit/database";
import type { FeatureToggleInsert } from "@musekit/database";

export interface AIConfig {
  provider: "xai" | "openai" | "anthropic";
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: "xai",
  model: "grok-3",
  temperature: 0.7,
  max_tokens: 2048,
  system_prompt: "You are a helpful assistant.",
};

export async function getAIConfig(): Promise<AIConfig> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("feature_toggles")
      .select("*")
      .eq("key", "ai_config")
      .single();

    if (error || !data) return DEFAULT_AI_CONFIG;

    const row = data as Record<string, unknown>;
    const description = row.description as string | null;

    if (!description) return DEFAULT_AI_CONFIG;

    try {
      const parsed = JSON.parse(description) as Record<string, unknown>;
      return {
        provider: (parsed.provider as AIConfig["provider"]) || DEFAULT_AI_CONFIG.provider,
        model: (parsed.model as string) || DEFAULT_AI_CONFIG.model,
        temperature: (parsed.temperature as number) ?? DEFAULT_AI_CONFIG.temperature,
        max_tokens: (parsed.max_tokens as number) ?? DEFAULT_AI_CONFIG.max_tokens,
        system_prompt: (parsed.system_prompt as string) || DEFAULT_AI_CONFIG.system_prompt,
      };
    } catch {
      return DEFAULT_AI_CONFIG;
    }
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export async function updateAIConfig(
  config: Partial<AIConfig>
): Promise<AIConfig> {
  const supabase = createAdminClient();
  const current = await getAIConfig();
  const merged = { ...current, ...config };

  const upsertData: FeatureToggleInsert = {
    key: "ai_config",
    label: "AI Configuration",
    description: JSON.stringify(merged),
    enabled: true,
  };

  const { error } = await (supabase
    .from("feature_toggles") as any)
    .upsert(upsertData, { onConflict: "key" });

  if (error) {
    throw new Error(`Failed to update AI config: ${error.message}`);
  }

  return merged;
}

export async function getAIApiKey(provider: AIConfig["provider"]): Promise<string> {
  const envKeys: Record<string, string | undefined> = {
    xai: process.env.XAI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };

  console.log(`[getAIApiKey] Checking env var for provider "${provider}": ${!!envKeys[provider]}`);

  const envKey = envKeys[provider];
  if (envKey) return envKey;

  console.warn(`[getAIApiKey] No env var found for provider "${provider}", trying database fallback...`);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("key_encrypted")
      .eq("service", provider)
      .single();

    if (!error && data) {
      console.log(`[getAIApiKey] Found key in database for provider "${provider}"`);
      return (data as { key_encrypted: string }).key_encrypted;
    }

    if (error) {
      console.warn(`[getAIApiKey] Database query error for provider "${provider}":`, error.message);
    }
  } catch (e) {
    console.warn(`[getAIApiKey] Database lookup failed for provider "${provider}":`, e);
  }

  throw new Error(
    `No API key found for provider "${provider}". Set the ${provider.toUpperCase()}_API_KEY env var or add it to the api_keys database table.`
  );
}
