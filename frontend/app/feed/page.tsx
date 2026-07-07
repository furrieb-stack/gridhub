"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, clearTokens, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Stories from "@/components/Stories";
import Post from "@/components/Post";
import FeedRightSidebar from "@/components/FeedRightSidebar";

const DEMO_POSTS = [
  {
    author: { username: "johndoe", display_name: "John Doe", avatar_url: null, is_verified: true },
    subgrid: "react",
    title: "Introducing React 19: What's New",
    content: "React 19 brings a host of new features including Server Components, improved Suspense, and better performance out of the box. Here's a quick overview of everything you need to know to get started.",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    upvotes: 342,
    comments_count: 28,
  },
  {
    author: { username: "ann_dev", display_name: "Ann Developer", avatar_url: null, is_verified: false },
    subgrid: "python",
    content: "Just deployed my first FastAPI app to production! 🚀 The automatic OpenAPI docs are a game changer for API development.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    upvotes: 89,
    comments_count: 12,
  },
  {
    author: { username: "gridhub", display_name: "Gridhub", avatar_url: null, is_verified: true },
    subgrid: "meta",
    title: "Welcome to Gridhub",
    content: "A new social network for developers. Build your community, share knowledge, and connect with fellow devs.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    upvotes: 1204,
    comments_count: 156,
  },
];

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
      <Navbar />

      <div className="ml-[240px] flex justify-center gap-6 px-6 py-6">
        <main className="w-full max-w-[640px]">
          <Stories />

          <div className="mt-2 flex flex-col gap-3">
            {DEMO_POSTS.map((post, i) => (
              <Post key={i} {...post} />
            ))}
          </div>
        </main>

        <FeedRightSidebar />
      </div>
    </div>
  );
}
