import { createAdminClient } from "@musekit/database";

export { WEBHOOK_EVENTS } from "./events";
export type { WebhookEvent } from "./events";
import type { WebhookEvent } from "./events";

export interface WebhookConfigData {
  url: string;
  secret?: string | null;
  enabled: boolean;
  events?: WebhookEvent[];
}

export interface WebhookConfigUpdate {
  url?: string;
  secret?: string | null;
  enabled?: boolean;
  events?: WebhookEvent[];
}

export async function getWebhookConfig(): Promise<WebhookConfigData | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase
      .from("settings") as any)
      .select("*")
      .eq("key", "webhook.config")
      .single();

    if (error || !data) return null;

    const row = data as Record<string, unknown>;
    const value = row.value as string | null;
    if (!value) return null;

    try {
      return JSON.parse(value) as WebhookConfigData;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export async function updateWebhookConfig(
  config: WebhookConfigUpdate
): Promise<WebhookConfigData> {
  const supabase = createAdminClient();
  const existing = await getWebhookConfig();

  const merged: WebhookConfigData = {
    url: config.url ?? existing?.url ?? "",
    secret: config.secret !== undefined ? config.secret : (existing?.secret ?? null),
    enabled: config.enabled ?? existing?.enabled ?? false,
    events: config.events ?? existing?.events,
  };

  const { error } = await (supabase
    .from("settings") as any)
    .upsert(
      { key: "webhook.config", value: JSON.stringify(merged) },
      { onConflict: "key" }
    );

  if (error) {
    throw new Error(`Failed to update webhook config: ${error.message}`);
  }

  return merged;
}

export async function validateWebhookUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok || response.status < 500;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  } catch {
    return false;
  }
}
