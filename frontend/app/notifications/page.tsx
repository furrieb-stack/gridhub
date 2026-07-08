"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Timestamp from "@/components/Timestamp";

interface NotificationData {
  id: number;
  type: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
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
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[20px] font-bold text-white">Notifications</h1>
            {notifications.some(n => !n.read) && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[#FFD190] text-[14px] font-semibold hover:underline"
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
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5}>
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
              </div>
              <p className="text-white/30 text-[15px]">No notifications yet</p>
              <p className="text-white/20 text-[13px]">When someone interacts with your content, it&apos;ll show up here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-4 rounded-[16px] transition-colors hover:bg-white/[0.02] cursor-pointer"
                  style={{ backgroundColor: n.read ? "transparent" : "rgba(255, 209, 144, 0.04)" }}
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
                      {n.type === "like" || n.type === "upvote" ? (
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      ) : n.type === "comment" ? (
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                      ) : n.type === "follow" ? (
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      ) : (
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-[14px]">
                      {n.data?.message as string ?? n.type}
                    </p>
                  </div>
                  <span className="text-white/25 text-[12px] shrink-0">
                    <Timestamp date={n.created_at} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
