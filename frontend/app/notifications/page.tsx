"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

const DEMO_NOTIFICATIONS = [
  { id: 1, type: "like", user: "ann_dev", content: "liked your post", time: "2m", read: false },
  { id: 2, type: "follow", user: "rustacean", content: "followed you", time: "15m", read: false },
  { id: 3, type: "comment", user: "johndoe", content: "commented on your post", time: "1h", read: false },
  { id: 4, type: "mention", user: "gridhub", content: "mentioned you in a comment", time: "3h", read: true },
  { id: 5, type: "like", user: "photo_dump", content: "liked your post", time: "5h", read: true },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          <h1 className="text-[20px] font-bold text-white mb-6">Notifications</h1>
          <div className="flex flex-col gap-1">
            {DEMO_NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-4 rounded-[16px] transition-colors hover:bg-white/[0.02] cursor-pointer"
                style={{ backgroundColor: n.read ? "transparent" : "rgba(255, 209, 144, 0.04)" }}
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-white/40 text-[14px] font-bold">{n.user[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-[14px]">
                    <span className="font-bold text-white">@{n.user}</span> {n.content}
                  </p>
                </div>
                <span className="text-white/25 text-[12px] shrink-0">{n.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
