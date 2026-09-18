import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import * as ns from "../services/notificationService.js";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await ns.getMyNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.error("Could not load notifications:", e);
    }
  };

  useEffect(() => {
    loadNotifications();

    const timer = setInterval(loadNotifications, 10000);

    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = async () => {
    setOpen((prev) => !prev);

    if (!open) {
      try {
        const unread = notifications.filter((n) => !n.read);

        await Promise.all(unread.map((n) => ns.markNotificationRead(n._id)));

        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            read: true,
          })),
        );
      } catch (e) {
        console.error("Could not mark notifications as read:", e);
      }
    }
  };

  const clearOne = async (id) => {
    try {
      await ns.clearNotification(id);

      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not clear notification.");
    }
  };

  const clearAll = async () => {
    try {
      await ns.clearAllNotifications();
      setNotifications([]);
      toast.success("Notifications cleared");
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not clear notifications.");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-full border border-black/10 bg-white flex items-center justify-center text-lg hover:border-brand transition"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[320px] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-black/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink">Notifications</h3>
              <p className="text-xs text-ink-soft">
                Latest updates from NutriSphere
              </p>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-brand font-semibold"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {!notifications.length ? (
              <div className="p-8 text-center text-sm text-ink-soft">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className="p-4 border-b border-black/5 last:border-0"
                >
                  <div className="flex gap-3">
                    <div className="text-lg">
                      {n.type === "ORDER"
                        ? "🛒"
                        : n.type === "PRODUCT"
                          ? "🥝"
                          : n.type === "PLAN"
                            ? "📦"
                            : n.type === "DELIVERY"
                              ? "🚚"
                              : "🔔"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink">
                        {n.title}
                      </p>

                      <p className="text-xs text-ink-soft mt-1 leading-5">
                        {n.message}
                      </p>

                      <button
                        type="button"
                        onClick={() => clearOne(n._id)}
                        className="text-[11px] text-brand font-semibold mt-2"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
