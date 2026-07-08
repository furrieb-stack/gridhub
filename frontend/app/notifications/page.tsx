"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Timestamp from "@/components/Timestamp";
import { useToast } from "@/components/ToastProvider";

interface NotificationData {
  id: number;
  type: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

function NotificationIcon({ type }: { type: string }) {
  const c = "rgba(255,255,255,0.5)";
  const props = { width: 16, height: 16, fill: c, viewBox: "0 0 24 24" };

  if (type === "upvote" || type === "like") {
    return (
      <svg {...props}>
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }
  if (type === "comment") {
    return (
      <svg {...props}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (type === "follow") {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    </svg>
  );
}

function getNotificationLabel(type: string): string {
  switch (type) {
    case "upvote": return "Upvote";
    case "comment": return "Comment";
    case "follow": return "Follow";
    case "subgrid_moderator": return "Moderator";
    default: return type;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Notifications | Gridhub";
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  async function load() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleMarkAsRead = useCallback(async (id: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  async function handleMarkAllAsRead() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        addToast("All notifications marked as read", "success");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFD190]/15 text-[#FFD190] text-[12px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[#FFD190] text-[14px] font-semibold hover:underline transition-all hover:brightness-110"
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.04]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                </svg>
              </div>
              <p className="text-white/30 text-[15px]">No notifications yet</p>
              <p className="text-white/20 text-[13px] text-center max-w-xs">
                When someone upvotes your post, comments, or follows you, it&apos;ll show up here
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((n, i) => (
                <div
                  key={n.id}
                  className="group flex items-start gap-3 px-4 py-4 rounded-[16px] transition-all duration-300 border border-transparent hover:border-white/[0.04]"
                  style={{
                    backgroundColor: n.read ? "transparent" : "rgba(255, 209, 144, 0.05)",
                    animation: `fadeIn 0.3s ease-out ${i * 0.03}s both`,
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    n.read ? "bg-white/[0.04]" : "bg-[#FFD190]/10"
                  }`}>
                    <NotificationIcon type={n.type} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] leading-relaxed ${
                      n.read ? "text-white/50" : "text-white/80"
                    }`}>
                      {n.data?.message as string ?? getNotificationLabel(n.type)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/25 text-[12px]">
                        <Timestamp date={n.created_at} />
                      </span>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD190]" />
                      )}
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-[#FFD190] hover:bg-[#FFD190]/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}