import * as crypto from "crypto";
import { createAdminClient } from "@musekit/database";
import type { AuditLogInsert } from "@musekit/database";
import { getWebhookConfig, type WebhookEvent } from "./config";
import { createQueue, addJob } from "../jobs/queue";
import type { WebhookRetryData } from "../jobs/processors";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

const webhookRetryQueue = createQueue("webhookRetry");

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

async function attemptDelivery(
  url: string,
  payload: WebhookPayload,
  signature: string
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
        "X-Webhook-Attempt": "1",
      },
      body,
    });

    return response.ok;
  } catch {
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

  const success = await attemptDelivery(url, payload, signature);

  if (success) {
    await logWebhookDispatch(event, true, { url });
    return;
  }

  try {
    const retryData: WebhookRetryData = {
      url,
      event,
      payload: payload as unknown as Record<string, unknown>,
      signature,
      attempt: 2,
    };

    await addJob(webhookRetryQueue, retryData as unknown as Record<string, unknown>, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });

    console.log(`[dispatchWebhook] Queued retry for failed webhook event=${event} url=${url}`);
  } catch (e) {
    console.error(`[dispatchWebhook] Failed to queue webhook retry:`, e);
  }

  await logWebhookDispatch(event, false, { url, queued_for_retry: true });
}
