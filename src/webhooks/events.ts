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
