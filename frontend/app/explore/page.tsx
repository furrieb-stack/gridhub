"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

const EXPLORE_CATEGORIES = [
  { label: "Trending", active: true },
  { label: "Recent", active: false },
  { label: "People", active: false },
  { label: "Media", active: false },
];

const TRENDING_POSTS = [
  { user: "rustacean", content: "Rust 2026 edition is going to be massive. The borrow checker improvements alone...", likes: "2.3k" },
  { user: "ann_dev", content: "Just hit 1000 contributions on GitHub this year! Open source is life 🚀", likes: "1.8k" },
  { user: "gridhub", content: "We're hiring! Looking for a senior frontend engineer to join the team.", likes: "1.2k" },
  { user: "photo_dump", content: "Golden hour through the trees 🌅", likes: "3.4k", image: true },
];

export default function ExplorePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [catIndex, setCatIndex] = useState(0);

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
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx={11} cy={11} r={8} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search Gridhub"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full border-none text-white text-[14px] outline-none transition-all duration-200 placeholder:text-white/25"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          </div>

          <div className="flex gap-2 mb-6">
            {EXPLORE_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => setCatIndex(i)}
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors ${
                  i === catIndex ? "bg-[#FFD190] text-[#12110f]" : "text-white/40 hover:text-white/70 bg-white/[0.04]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {TRENDING_POSTS.map((post, i) => (
              <div key={i} className="rounded-[24px] border p-5 transition-all duration-200"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", borderColor: "rgba(255, 255, 255, 0.04)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/40 text-[10px] font-bold">{post.user[0].toUpperCase()}</span>
                  </div>
                  <span className="text-white/50 text-[13px]">@{post.user}</span>
                </div>
                <p className="text-white/80 text-[14px] leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-1.5 mt-3 text-white/30 text-[12px]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{post.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
