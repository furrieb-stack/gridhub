"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getStoredUser, clearTokens, type User } from "@/lib/api";

export default function FeedPage() {
  const router = useRouter();
  const [user] = useState<User | null>(() => {
    if (typeof window !== "undefined") return getStoredUser();
    return null;
  });

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Image src="/favicon.svg" alt="" width={24} height={24} />
          <h1 className="text-xl font-bold">
            <span className="text-yellow">Grid</span>
            <span className="text-white">hub</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted text-[14px]">
            {user.display_name ?? user.username}
          </span>
          <button
            onClick={handleLogout}
            className="text-[14px] text-muted hover:text-white transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-muted text-center text-[15px]">
          Feed coming soon.
        </p>
      </main>
    </div>
  );
}
