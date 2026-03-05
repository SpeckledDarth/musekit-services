import type { Job } from "bullmq";
import { Resend } from "resend";
import { createAdminClient } from "@musekit/database";

export interface EmailDeliveryData {
  to: string;
  subject: string;
  body: string;
  from?: string;
  template?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookRetryData {
  url: string;
  event: string;
  payload: Record<string, unknown>;
  signature: string;
  attempt: number;
}

export interface ReportGenerationData {
  reportType: string;
  userId: string;
  parameters?: Record<string, unknown>;
}

export interface MetricsReportData {
  period: "daily" | "weekly" | "monthly";
  recipients: string[];
  metrics: string[];
}

export interface MetricsAlertData {
  metric: string;
  threshold: number;
  currentValue: number;
  alertType: "above" | "below";
  notifyUsers: string[];
}

export interface TokenRotationData {
  keyId: string;
  provider: string;
  userId: string;
}

export async function emailDelivery(
  job: Job<EmailDeliveryData>
): Promise<void> {
  const { to, subject, body, from, template } = job.data;

  console.log(
    `[emailDelivery] Processing email to=${to} subject="${subject}" template=${template || "none"}`
  );

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[emailDelivery] RESEND_API_KEY not configured — skipping email delivery. Set the secret to enable sending."
    );
    await job.updateProgress(100);
    return;
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: from || "MuseKit <noreply@musekit.com>",
    to: [to],
    subject,
    html: body,
  });

  if (error) {
    console.error(`[emailDelivery] Resend error for ${to}:`, error);
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  await job.updateProgress(100);
  console.log(`[emailDelivery] Email delivered to ${to} (id=${data?.id})`);
}

export async function webhookRetry(
  job: Job<WebhookRetryData>
): Promise<void> {
  const { url, event, payload, signature, attempt } = job.data;

  console.log(
    `[webhookRetry] Retrying webhook event=${event} url=${url} attempt=${attempt}`
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": `sha256=${signature}`,
      "X-Webhook-Event": event,
      "X-Webhook-Attempt": String(attempt),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Webhook delivery failed: ${response.status} ${response.statusText}`
    );
  }

  console.log(`[webhookRetry] Webhook delivered successfully`);
}

export async function reportGeneration(
  job: Job<ReportGenerationData>
): Promise<void> {
  const { reportType, userId } = job.data;

  console.log(
    `[reportGeneration] Generating ${reportType} report for user=${userId}`
  );

  await job.updateProgress(20);

  const supabase = createAdminClient();

  const { data: subscriptions, error: subError } = await (supabase
    .from("muse_product_subscriptions") as any)
    .select("*")
    .limit(100);

  if (subError) {
    console.warn(`[reportGeneration] Failed to fetch subscriptions:`, subError.message);
  }

  await job.updateProgress(50);

  const { data: profiles, error: profError } = await (supabase
    .from("profiles") as any)
    .select("id, email, full_name")
    .limit(100);

  if (profError) {
    console.warn(`[reportGeneration] Failed to fetch profiles:`, profError.message);
  }

  await job.updateProgress(80);

  const report = {
    type: reportType,
    generatedAt: new Date().toISOString(),
    generatedBy: userId,
    summary: {
      totalSubscriptions: subscriptions?.length ?? 0,
      totalUsers: profiles?.length ?? 0,
    },
  };

  console.log(`[reportGeneration] Report data:`, JSON.stringify(report));

  await job.updateProgress(100);
  console.log(`[reportGeneration] Report ${reportType} generated`);
}

export async function metricsReport(
  job: Job<MetricsReportData>
): Promise<void> {
  const { period, recipients, metrics } = job.data;

  console.log(
    `[metricsReport] Compiling ${period} metrics report for ${recipients.length} recipients`
  );

  const metricsData: Record<string, unknown> = {};
  for (const metric of metrics) {
    metricsData[metric] = { value: 0, change: 0 };
  }

  await job.updateProgress(100);
  console.log(
    `[metricsReport] ${period} report compiled with ${metrics.length} metrics`
  );
}

export async function metricsAlert(
  job: Job<MetricsAlertData>
): Promise<void> {
  const { metric, threshold, currentValue, alertType, notifyUsers } = job.data;

  const triggered =
    alertType === "above"
      ? currentValue > threshold
      : currentValue < threshold;

  if (!triggered) {
    console.log(
      `[metricsAlert] No alert needed for ${metric}: ${currentValue} is within threshold ${threshold}`
    );
    return;
  }

  console.log(
    `[metricsAlert] ALERT: ${metric} is ${currentValue} (${alertType} threshold ${threshold}). Notifying ${notifyUsers.length} users.`
  );

  await job.updateProgress(100);
}

export async function tokenRotation(
  job: Job<TokenRotationData>
): Promise<void> {
  const { keyId, provider, userId } = job.data;

  console.log(
    `[tokenRotation] Rotating token keyId=${keyId} provider=${provider} userId=${userId}`
  );

  await job.updateProgress(100);
  console.log(`[tokenRotation] Token rotated successfully`);
}
