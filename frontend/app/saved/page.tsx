"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Post from "@/components/Post";

export default function SavedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/posts/saved?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const mapped = data.map((p: any) => ({
        id: p.id,
        author: {
          username: p.author?.username ?? "unknown",
          display_name: p.author?.display_name ?? null,
          avatar_url: p.author?.avatar_url ?? null,
          is_verified: p.author?.is_verified ?? false,
        },
        content: p.content,
        media: p.media?.map((m: any) => ({ url: m.url })) ?? [],
        created_at: p.created_at,
        upvotes: p.upvotes,
        comments_count: p.comment_count ?? 0,
        subgrid: p.subgrid ?? null,
      }));
      setPosts(mapped);
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Saved Posts | Gridhub";
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else {
      setUser(stored);
      fetchPosts();
    }
  }, [router, fetchPosts]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          <h1 className="text-[20px] font-bold text-white mb-8">Saved Posts</h1>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                </svg>
              </div>
              <p className="text-white/30 text-[15px]">No saved posts yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((post, i) => (
                <Post key={post.id + "-" + i} {...post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
