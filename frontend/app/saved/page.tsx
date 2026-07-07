"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

export default function SavedPage() {
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
          <h1 className="text-[20px] font-bold text-white mb-8">Saved</h1>
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
            </div>
            <p className="text-white/30 text-[15px]">No saved posts yet</p>
          </div>
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
