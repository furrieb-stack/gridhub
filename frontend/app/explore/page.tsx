"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Post, { type PostData } from "@/components/Post";

const EXPLORE_CATEGORIES = [
  { label: "Trending", value: "hot" },
  { label: "Top", value: "top" },
  { label: "Rising", value: "rising" },
  { label: "New", value: "new" },
];

export default function ExplorePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [catIndex, setCatIndex] = useState(0);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Explore | Gridhub";
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    async function fetchExplore() {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const sort = EXPLORE_CATEGORIES[catIndex].value;
        const res = await fetch(`/api/posts?sort=${sort}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchExplore();
  }, [user, catIndex]);

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
            {loading ? (
              <div className="text-center text-white/50 py-10 text-[14px]">Loading...</div>
            ) : posts.length > 0 ? (
              posts.map((post, i) => (
                <Post key={post.id + "-" + i} {...post} />
              ))
            ) : (
              <div className="text-center text-white/50 py-10 text-[14px]">No posts found</div>
            )}
          </div>
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
