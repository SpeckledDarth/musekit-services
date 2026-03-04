import { createAdminClient } from "@musekit/database";
import type { Notification, NotificationInsert } from "@musekit/database";

export interface GetNotificationsOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  hasMore: boolean;
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string
): Promise<Notification> {
  const supabase = createAdminClient();
  const insertData: NotificationInsert = {
    user_id: userId,
    type,
    title,
    message,
    read: false,
  };

  const { data, error } = await (supabase
    .from("notifications") as any)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return data as Notification;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }

  return count ?? 0;
}

export async function markAllRead(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await (supabase
    .from("notifications") as any)
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
}

export async function getNotifications(
  userId: string,
  options: GetNotificationsOptions = {}
): Promise<PaginatedNotifications> {
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  const supabase = createAdminClient();
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to get notifications: ${error.message}`);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as Notification[],
    total,
    hasMore: offset + limit < total,
  };
}
