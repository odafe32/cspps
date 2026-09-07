"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, TrendingDown, TrendingUp, Info, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatTimeAgo } from "@/lib/utils/format";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  const fetchNotifications = useCallback(async (silent: boolean) => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const newNotifications: Notification[] = data.notifications || [];

      // Show toast for new notifications (not on first load)
      if (!silent && lastFetchRef.current) {
        const prevIds = new Set(lastFetchRef.current.split(","));
        const fresh = newNotifications.filter((n) => !prevIds.has(n.id));
        fresh.forEach((n) => {
          if (n.type === "HIGH_RISK") {
            toast.error(n.title, { description: n.message });
          } else if (n.type === "PERFORMANCE_DROP") {
            toast.warning(n.title, { description: n.message });
          } else if (n.type === "PREDICTION_READY") {
            toast.success(n.title, { description: n.message });
          } else {
            toast.info(n.title, { description: n.message });
          }
        });
      }

      lastFetchRef.current = newNotifications.map((n) => n.id).join(",");
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter((n) => !n.isRead).length);
    } catch {
      // silent fail
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch (silent = true, no toasts)
    // fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 15000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  // Mark single as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silent
    }
  }, [notifications]);

  const iconForType = (type: string) => {
    switch (type) {
      case "HIGH_RISK":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "PERFORMANCE_DROP":
        return <TrendingDown className="h-4 w-4 text-amber-500" />;
      case "PREDICTION_READY":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  function handleNotificationClick() {
    setOpen(false);
    const basePath = window.location.pathname.split("/")[1];
    router.push(`/${basePath}/notifications`);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  onClick={handleNotificationClick}
                  className={`group flex w-full cursor-pointer items-start gap-3 border-b border-zinc-100 px-4 py-3 text-left transition-colors hover:bg-muted/50 dark:border-zinc-800/50 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{iconForType(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatTimeAgo(new Date(n.createdAt))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {!n.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-green-600 group-hover:opacity-100"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-red-600 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!n.isRead && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <button
              onClick={handleNotificationClick}
              className="w-full border-t border-zinc-200 px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/50 dark:border-zinc-800"
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}
