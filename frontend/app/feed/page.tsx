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
  { label: "For You", sort: "hot" },
  { label: "Following", sort: "new" },
  { label: "New", sort: "new" },
  { label: "Top", sort: "top" },
];

const SESSION_CACHE_KEY = "feed_session_cache";

function getSessionCache(): Record<string, { posts: any[]; timestamp: number }> {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_CACHE_KEY) || "{}");
  } catch { return {}; }
}

function setSessionCache(key: string, data: any[]) {
  const cache = getSessionCache();
  cache[key] = { posts: data, timestamp: Date.now() };
  sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
}

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIndex, setFilterIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const feedRef = useRef<(skip: number, append: boolean) => Promise<void>>(null!);
  const initialLoadDone = useRef(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  const lastPostRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      if (!node) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setSkip((prev) => prev + 5);
        }
      });
      observer.current.observe(node);
    },
    [hasMore]
  );

  const mapPost = useCallback((p: any) => ({
    id: p.id,
    author: {
      username: p.author?.username ?? p.user?.username ?? "unknown",
      display_name: p.author?.display_name ?? p.user?.display_name ?? null,
      avatar_url: p.author?.avatar_url ?? p.user?.avatar_url ?? null,
      is_verified: p.author?.is_verified ?? p.user?.is_verified ?? false,
    },
    content: p.content,
    media: p.media?.map((m: any) => ({ url: m.url, type: m.type })) ?? [],
    created_at: p.created_at,
    upvotes: p.upvotes,
    downvotes: p.downvotes ?? 0,
    score: p.score ?? 0,
    user_vote: p.user_vote ?? 0,
    share_count: p.share_count ?? 0,
    comments_count: p.comment_count ?? 0,
    subgrid: p.subgrid ?? null,
    title: p.title ?? null,
  }), []);

  const fetchPosts = useCallback(async (currentSkip: number, append: boolean = false) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const sort = FILTERS[filterIndex].sort;
    let extraParam = "";
    if (filterIndex === 1 && user) {
      extraParam = "&following=true";
    }

    const cacheKey = `${sort}_${filterIndex}_${user?.id}_${search}`;

    if (currentSkip === 0 && !append) {
      const cached = getSessionCache()[cacheKey];
      if (cached && initialLoadDone.current) {
        setPosts(cached.posts);
        setHasMore(cached.posts.length >= 5);
        return;
      }
    }

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
          `/api/posts?sort=${sort}&limit=5&skip=${currentSkip}${extraParam}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const items = search.trim() !== "" ? data.posts || [] : data;

      const mapped = items.map(mapPost);

      if (items.length < 5) {
        setHasMore(false);
      }

      setPosts((prev) => {
        const newPosts = append ? [...prev, ...mapped] : mapped;
        if (currentSkip === 0) {
          setSessionCache(cacheKey, newPosts);
        }
        return newPosts;
      });
    } catch (err) {
      if (!append) setPosts([]);
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, [filterIndex, user, search, mapPost]);

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
    function handleCreated(e: Event) {
      const { post } = (e as CustomEvent).detail;
      if (post) {
        const mapped = mapPost(post);
        setPosts((prev) => [mapped, ...prev]);
      }
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
  }, [mapPost]);

  useEffect(() => {
    if (user && skip === 0) {
      initialLoadDone.current = true;
      feedRef.current(0, false);
    }
  }, [filterIndex, search, user]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="md:ml-[250px] flex justify-center px-4 md:px-6 py-4 md:py-6">
        <div className="w-full max-w-[600px]">

          <div className="relative mb-2">
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
              className="w-full h-11 pl-11 pr-4 rounded-full border-none text-white text-[14px] outline-none transition-all duration-200 placeholder:text-white/30 focus:bg-white/[0.08]"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          </div>

          <Stories />

          <div className="sticky top-0 z-30 py-3 -mx-4 px-4 md:mx-0 md:px-0 bg-[#12110f]/95 backdrop-blur-xl transition-all">
            <div className="flex items-center w-full gap-1 p-1 bg-white/[0.04] border border-white/[0.04] rounded-[12px]">
              {FILTERS.map((f, i) => (
                <button
                  key={f.label}
                  onClick={() => {
                    if (i === filterIndex) return;
                    setFilterIndex(i);
                    setSkip(0);
                    setHasMore(true);
                  }}
                  className={`flex-1 py-2 rounded-[8px] text-[13px] font-bold transition-all duration-200 ${
                    i === filterIndex
                      ? "bg-[#FFD190] text-[#12110f] shadow-[0_2px_10px_rgba(255,209,144,0.15)]"
                      : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {posts.length > 0 && (
              <div className="text-[11px] text-white/20 font-medium px-1 mb-1">
                {posts.length} post{posts.length !== 1 ? 's' : ''}
              </div>
            )}
            {posts.map((post, i) => {
              if (posts.length === i + 1) {
                return <div ref={lastPostRef} key={post.id + "-" + i}><Post {...post} compact /></div>;
              } else {
                return <Post key={post.id + "-" + i} {...post} compact />;
              }
            })}

            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-[3px] border-[#FFD190] border-t-transparent animate-spin" />
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/40 text-[15px]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <p className="font-medium">No posts found</p>
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