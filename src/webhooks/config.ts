import { createAdminClient } from "@musekit/database";
import type { WebhookConfig, WebhookConfigInsert } from "@musekit/database";

export const WEBHOOK_EVENTS = [
  "feedback_submitted",
  "waitlist_entry",
  "subscription_created",
  "subscription_updated",
  "subscription_canceled",
  "team_invitation_sent",
  "team_member_joined",
  "contact_form_submitted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookConfigUpdate {
  url?: string;
  secret?: string | null;
  enabled?: boolean;
  events?: WebhookEvent[];
}

export async function getWebhookConfig(): Promise<WebhookConfig | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("webhook_configs")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get webhook config: ${error.message}`);
  }

  return data as WebhookConfig;
}

export async function updateWebhookConfig(
  config: WebhookConfigUpdate
): Promise<WebhookConfig> {
  const supabase = createAdminClient();
  const existing = await getWebhookConfig();

  const updatePayload: Partial<WebhookConfigInsert> = {};
  if (config.url !== undefined) updatePayload.url = config.url;
  if (config.secret !== undefined) updatePayload.secret = config.secret;
  if (config.enabled !== undefined) updatePayload.enabled = config.enabled;
  if (config.events !== undefined) updatePayload.events = config.events;

  if (existing) {
    const { data, error } = await (supabase
      .from("webhook_configs") as any)
      .update(updatePayload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update webhook config: ${error.message}`);
    }
    return data as WebhookConfig;
  }

  const insertPayload: WebhookConfigInsert = {
    url: config.url || "",
    secret: config.secret,
    enabled: config.enabled,
    events: config.events,
  };

  const { data, error } = await (supabase
    .from("webhook_configs") as any)
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create webhook config: ${error.message}`);
  }
  return data as WebhookConfig;
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
