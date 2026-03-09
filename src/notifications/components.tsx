import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, MessageSquare } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
  pollInterval?: number;
  fetchUnreadCount: (userId: string) => Promise<number>;
  fetchNotifications: (userId: string) => Promise<{ data: NotificationItem[] }>;
  onMarkAllRead: (userId: string) => Promise<void>;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  message: <MessageSquare className="h-4 w-4 text-purple-500" />,
};

function getIcon(type: string): React.ReactNode {
  return typeIcons[type] || <Info className="h-4 w-4 text-muted-foreground" />;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function NotificationBell({
  userId,
  pollInterval = 30000,
  fetchUnreadCount,
  fetchNotifications,
  onMarkAllRead,
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const count = await fetchUnreadCount(userId);
        if (mounted) setUnreadCount(count);
      } catch {
        // silently continue polling
      }
    };

    poll();
    const interval = setInterval(poll, pollInterval);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userId, pollInterval, fetchUnreadCount]);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-[20px] px-1 text-xs font-bold text-primary-foreground bg-primary rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPopover
          userId={userId}
          fetchNotifications={fetchNotifications}
          onMarkAllRead={async () => {
            await onMarkAllRead(userId);
            setUnreadCount(0);
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

interface NotificationPopoverProps {
  userId: string;
  fetchNotifications: (userId: string) => Promise<{ data: NotificationItem[] }>;
  onMarkAllRead: () => Promise<void>;
  onClose: () => void;
}

function NotificationPopover({
  userId,
  fetchNotifications,
  onMarkAllRead,
  onClose,
}: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const result = await fetchNotifications(userId);
        if (mounted) setNotifications(result.data);
      } catch {
        // handle silently
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [userId, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMarkAllRead = async () => {
    try {
      await onMarkAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // handle silently
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 w-80 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
        >
          <Check className="h-3 w-3" />
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 border-b border-border hover:bg-accent transition-colors ${
                !notification.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
