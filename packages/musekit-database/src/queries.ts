import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AuditLogInsert } from "./schema";

type Client = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

export async function getUserById(client: Client, id: string) {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Tables["profiles"]["Row"];
}

export async function getUserByEmail(client: Client, email: string) {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw error;
  return data as Tables["profiles"]["Row"];
}

export async function getOrganization(client: Client, id: string) {
  const { data, error } = await client
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Tables["organizations"]["Row"];
}

export async function getOrgMembers(client: Client, orgId: string) {
  const { data: members, error: membersError } = await client
    .from("team_members")
    .select("*")
    .eq("org_id", orgId);
  if (membersError) throw membersError;

  const userIds = (members as Tables["team_members"]["Row"][]).map((m) => m.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select("*")
    .in("id", userIds);
  if (profilesError) throw profilesError;

  const profileMap = new Map(
    (profiles as Tables["profiles"]["Row"][]).map((p) => [p.id, p])
  );

  return (members as Tables["team_members"]["Row"][]).map((member) => ({
    ...member,
    profile: profileMap.get(member.user_id) ?? null,
  }));
}

export async function getSubscription(client: Client, userId: string) {
  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data as Tables["subscriptions"]["Row"];
}

export async function getNotifications(
  client: Client,
  userId: string,
  unreadOnly = false
) {
  let query = client
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Tables["notifications"]["Row"][];
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(client: Client, filters: AuditLogFilters = {}) {
  let query = client
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.resourceType) query = query.eq("resource_type", filters.resourceType);
  if (filters.resourceId) query = query.eq("resource_id", filters.resourceId);
  if (filters.limit !== undefined) query = query.limit(filters.limit);
  if (filters.offset !== undefined) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data as Tables["audit_logs"]["Row"][];
}

export async function createAuditLog(
  client: Client,
  entry: AuditLogInsert
) {
  const { data, error } = await (client as SupabaseClient)
    .from("audit_logs")
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as Tables["audit_logs"]["Row"];
}

export async function getBrandSettings(client: Client) {
  const { data, error } = await client
    .from("brand_settings")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return data as Tables["brand_settings"]["Row"];
}

export async function updateBrandSettings(
  client: Client,
  settings: Partial<Tables["brand_settings"]["Insert"]>
) {
  const existing = await getBrandSettings(client);
  const { data, error } = await (client as SupabaseClient)
    .from("brand_settings")
    .update(settings)
    .eq("id", existing.id)
    .select()
    .single();
  if (error) throw error;
  return data as Tables["brand_settings"]["Row"];
}

export async function getFeatureToggles(client: Client) {
  const { data, error } = await client
    .from("feature_toggles")
    .select("*")
    .order("key", { ascending: true });
  if (error) throw error;
  return data as Tables["feature_toggles"]["Row"][];
}

export async function updateFeatureToggle(
  client: Client,
  key: string,
  enabled: boolean
) {
  const { data, error } = await (client as SupabaseClient)
    .from("feature_toggles")
    .update({ enabled })
    .eq("key", key)
    .select()
    .single();
  if (error) throw error;
  return data as Tables["feature_toggles"]["Row"];
}
