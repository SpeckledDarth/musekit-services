import * as crypto from "crypto";
import { createAdminClient } from "@musekit/database";
import type { AuditLogInsert } from "@musekit/database";
import { getWebhookConfig, type WebhookEvent } from "./config";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  signature: string,
  attempt: number = 1,
  maxAttempts: number = 4
): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": payload.event,
        "X-Webhook-Timestamp": payload.timestamp,
        "X-Webhook-Attempt": String(attempt),
      },
      body,
    });

    if (response.ok) return true;

    if (attempt < maxAttempts && response.status >= 500) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return deliverWebhook(url, payload, signature, attempt + 1, maxAttempts);
    }

    return false;
  } catch {
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return deliverWebhook(url, payload, signature, attempt + 1, maxAttempts);
    }
    return false;
  }
}

async function logWebhookDispatch(
  event: WebhookEvent,
  success: boolean,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const entry: AuditLogInsert = {
      action: "webhook_dispatched",
      resource_type: "webhook",
      resource_id: event,
      metadata: { event, success, ...metadata },
    };
    await (supabase.from("audit_logs") as any).insert(entry);
  } catch {
    // audit logging should not break the main flow
  }
}

export async function dispatchWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const config = await getWebhookConfig();

  if (!config || !config.enabled) return;

  if (config.events && !config.events.includes(event)) return;

  const url = config.url;
  const secret = config.secret;
  if (!url) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const body = JSON.stringify(payload);
  const signature = secret ? signPayload(body, secret) : "";

  deliverWebhook(url, payload, signature)
    .then((success) => {
      logWebhookDispatch(event, success, { url });
    })
    .catch(() => {
      logWebhookDispatch(event, false, { url, error: "delivery_failed" });
    });
}
