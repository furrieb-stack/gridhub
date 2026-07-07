"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Stories from "@/components/Stories";
import Post from "@/components/Post";

const DEMO_POSTS = [
  {
    author: { username: "johndoe", display_name: "John Doe", avatar_url: null, is_verified: true },
    content: "Just shipped a new feature! 🔥 The team crushed it this sprint. Feeling really proud of what we built together.\n\nCheck out the demo in the link below 👇",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    upvotes: 342,
    comments_count: 28,
  },
  {
    author: { username: "ann_dev", display_name: "Ann Developer", avatar_url: null, is_verified: false },
    content: "Hot take: FastAPI is the best thing that happened to Python backend development since... ever? The automatic OpenAPI docs alone save me hours of work every week.",
    images: ["https://picsum.photos/seed/pyth/640/360"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    upvotes: 89,
    comments_count: 12,
  },
  {
    author: { username: "gridhub", display_name: "Gridhub", avatar_url: null, is_verified: true },
    content: "Welcome to Gridhub — a new social network for developers. Build your community, share knowledge, and connect with fellow devs around the world.\n\nWhat would you like to see here first?",
    images: [
      "https://picsum.photos/seed/grid1/640/360",
      "https://picsum.photos/seed/grid2/640/360",
      "https://picsum.photos/seed/grid3/640/360",
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    upvotes: 1204,
    comments_count: 156,
  },
  {
    author: { username: "rustacean", display_name: "🦀 Rust Dev", avatar_url: null, is_verified: false },
    content: "Been rewriting our Python microservice in Rust over the weekend... 10x performance improvement and zero memory leaks so far. This language is something else.",
    images: ["https://picsum.photos/seed/rust/640/360"],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    upvotes: 567,
    comments_count: 43,
  },
  {
    author: { username: "photo_dump", display_name: "Photo Dump", avatar_url: null, is_verified: false },
    content: "Some shots from today's hike 🏔️",
    images: [
      "https://picsum.photos/seed/hike1/640/360",
      "https://picsum.photos/seed/hike2/640/360",
      "https://picsum.photos/seed/hike3/640/360",
      "https://picsum.photos/seed/hike4/640/360",
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    upvotes: 891,
    comments_count: 67,
  },
];

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="md:ml-[250px] flex justify-center px-4 md:px-6 py-4 md:py-6">
        <div className="w-full max-w-[600px]">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2"
              width="18" height="18" viewBox="0 0 24 24" fill="none"
            >
              <circle cx={11} cy={11} r={8} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search Gridhub"
              className="w-full h-11 pl-11 pr-4 rounded-full border-none text-white text-[14px] outline-none transition-all duration-200 placeholder:text-white/25"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          </div>

          <Stories />

          <div className="flex items-center justify-between mt-2 mb-4">
            <h1 className="text-[20px] font-bold text-white">For You</h1>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-white/40 hover:text-white text-[13px] transition-colors duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Filter
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {DEMO_POSTS.map((post, i) => (
              <Post key={i} {...post} />
            ))}
          </div>
        </div>
      </div>

      <div className="block md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
