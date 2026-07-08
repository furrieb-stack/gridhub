"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Stories from "@/components/Stories";
import Post from "@/components/Post";

type SortMode = "new" | "hot" | "top";

const FILTERS: { label: string; sort: SortMode }[] = [
  { label: "For You", sort: "new" },
  { label: "Following", sort: "new" },
  { label: "New", sort: "new" },
  { label: "Top", sort: "top" },
];

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIndex, setFilterIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const feedRef = useRef<(skip: number, append: boolean) => Promise<void>>(null!);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setSkip((prev) => prev + 20);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchPosts = useCallback(async (currentSkip: number, append: boolean = false) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const sort = FILTERS[filterIndex].sort;
    const subgridParam = filterIndex === 1 && user ? `&user_id=${user.id}` : "";

    try {
      setLoading(true);
      let res;
      if (search.trim() !== "") {
        res = await fetch(
          `/api/search?q=${search}&type=posts&skip=${currentSkip}&limit=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await fetch(
          `/api/posts?sort=${sort}&limit=20&skip=${currentSkip}${subgridParam}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const items = search.trim() !== "" ? data.posts || [] : data;

      const mapped = items.map((p: any) => ({
        id: p.id,
        author: {
          username: p.author?.username ?? p.user?.username ?? "unknown",
          display_name: p.author?.display_name ?? p.user?.display_name ?? null,
          avatar_url: p.author?.avatar_url ?? p.user?.avatar_url ?? null,
          is_verified: p.author?.is_verified ?? p.user?.is_verified ?? false,
        },
        content: p.content,
        media: p.media?.map((m: any) => ({ url: m.url })) ?? [],
        created_at: p.created_at,
        upvotes: p.upvotes,
        user_vote: p.user_vote ?? 0,
        comments_count: p.comment_count ?? 0,
        subgrid: p.subgrid ?? null,
      }));

      if (items.length < 20) {
        setHasMore(false);
      }

      setPosts((prev) => (append ? [...prev, ...mapped] : mapped));
    } catch (err) {
      if (!append) setPosts([]);
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, [filterIndex, user, search]);

  useEffect(() => { feedRef.current = fetchPosts; }, [fetchPosts]);

  useEffect(() => {
    document.title = "Feed | Gridhub";
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    if (user && skip > 0) {
      fetchPosts(skip, true);
    }
  }, [skip, user]);

  useEffect(() => {
    function handleCreated() {
      setRefreshKey((k) => k + 1);
    }
    function handleDeleted(e: Event) {
      const { id } = (e as CustomEvent).detail;
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
    window.addEventListener("post-created", handleCreated);
    window.addEventListener("post-deleted", handleDeleted);
    return () => {
      window.removeEventListener("post-created", handleCreated);
      window.removeEventListener("post-deleted", handleDeleted);
    };
  }, []);

  useEffect(() => {
    if (user && skip === 0) {
      feedRef.current(0, false);
    }
  }, [filterIndex, search, user, refreshKey]);

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full border-none text-white text-[14px] outline-none transition-all duration-200 placeholder:text-white/25"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          </div>

          <Stories />

          <div className="flex items-center gap-2 mt-4 mb-4 overflow-x-auto no-scrollbar">
            {FILTERS.map((f, i) => (
              <button
                key={f.label}
                onClick={() => setFilterIndex(i)}
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-colors ${
                  i === filterIndex
                    ? "bg-[#FFD190] text-[#12110f]"
                    : "text-white/40 hover:text-white/70"
                }`}
                style={i !== filterIndex ? { backgroundColor: "rgba(255,255,255,0.04)" } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {posts.map((post, i) => {
              if (posts.length === i + 1) {
                return <div ref={lastPostRef} key={post.id + "-" + i}><Post {...post} /></div>;
              } else {
                return <Post key={post.id + "-" + i} {...post} />;
              }
            })}
            
            {loading && (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
              </div>
            )}
            
            {!loading && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/40 text-[15px]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <p>No posts found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="block md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
