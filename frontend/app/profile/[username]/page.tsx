"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredUser, setStoredUser, fetchProfile, mediaUrl, type User, type UserProfile } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Post from "@/components/Post";
import FollowButton from "@/components/FollowButton";
import Avatar from "@/components/Avatar";
import Timestamp from "@/components/Timestamp";
import { useToast } from "@/components/ToastProvider";

const SESSION_CACHE_KEY = "profile_session_cache";

function getSessionCache(): Record<string, { data: any; timestamp: number }> {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_CACHE_KEY) || "{}");
  } catch { return {}; }
}

function setSessionCache(key: string, data: any) {
  const cache = getSessionCache();
  cache[key] = { data, timestamp: Date.now() };
  sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
}

interface ApiPost {
  id: number;
  content: string;
  media: { id: number; url: string; type: string }[];
  upvotes: number;
  user_vote?: number;
  comment_count: number;
  created_at: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<ApiPost[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Posts");
  
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  const lastItemRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect();
    if (!node) return;
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreRef.current) {
        setSkip((prev) => prev + 20);
      }
    });
    observer.current.observe(node);
  }, []);

  const [bannerError, setBannerError] = useState(false);
  const bannerInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
  }, [activeTab]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/users/me/banner", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setBannerError(false);
        setProfile((prev) => prev ? { ...prev, banner_url: data.banner_url } : prev);
        addToast("Banner updated", "success");
      } else {
        addToast("Failed to update banner", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : prev);
        const storedUser = getStoredUser();
        if (storedUser) {
          setStoredUser({ ...storedUser, avatar_url: data.avatar_url });
        }
        addToast("Avatar updated", "success");
      } else {
        addToast("Failed to update avatar", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    async function load() {
      if (!username) return;
      try {
        const profileData = await fetchProfile(username);
        setProfile(profileData);
        document.title = `${profileData.display_name ?? profileData.username} (@${profileData.username}) | Gridhub`;

        const cacheKey = `profile_${username}`;
        const cached = getSessionCache()[cacheKey];
        if (cached) {
          setPosts(cached.data);
        }

        const token = localStorage.getItem("access_token");
        const postsRes = await fetch(`/api/posts?user_id=${profileData.id}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (postsRes.ok) {
          const postsData: ApiPost[] = await postsRes.json();
          setPosts(postsData);
          setHasMore(postsData.length >= 20);
          setSessionCache(cacheKey, postsData);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [username, user]);

  useEffect(() => {
    if (!user || !profile || !profile.id || skip > 0) return;
    const tok = localStorage.getItem("access_token");
    if (!tok) return;
    async function loadTab() {
      setLoadingTab(true);
      try {
        if (activeTab === "Comments") {
          const res = await fetch(`/api/comments?user_id=${profile!.id}&limit=20`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (res.ok) {
            const data = await res.json();
            setComments(data);
            setHasMore(data.length >= 20);
          }
        } else if (activeTab === "Saved") {
          const res = await fetch(`/api/posts/saved?limit=20`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (res.ok) {
            const data = await res.json();
            setSavedPosts(data);
            setHasMore(data.length >= 20);
          }
        }
      } catch {}
      setLoadingTab(false);
    }
    loadTab();
  }, [activeTab, profile, user]); // Note: intentionally omitted skip here

  useEffect(() => {
    if (skip === 0 || !profile || !profile.id) return;
    const tok = localStorage.getItem("access_token");
    if (!tok) return;

    async function fetchMore() {
      setLoadingMore(true);
      try {
        if (activeTab === "Posts") {
          const res = await fetch(`/api/posts?user_id=${profile!.id}&limit=20&skip=${skip}`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.length < 20) setHasMore(false);
            setPosts((prev) => [...prev, ...data.filter((p: any) => !prev.some((ex) => ex.id === p.id))]);
          }
        } else if (activeTab === "Comments") {
          const res = await fetch(`/api/comments?user_id=${profile!.id}&limit=20&skip=${skip}`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.length < 20) setHasMore(false);
            setComments((prev) => [...prev, ...data.filter((c: any) => !prev.some((ex) => ex.id === c.id))]);
          }
        } else if (activeTab === "Saved") {
          const res = await fetch(`/api/posts/saved?limit=20&skip=${skip}`, {
            headers: { Authorization: `Bearer ${tok}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.length < 20) setHasMore(false);
            setSavedPosts((prev) => [...prev, ...data.filter((p: any) => !prev.some((ex) => ex.id === p.id))]);
          }
        }
      } catch {}
      setLoadingMore(false);
    }
    fetchMore();
  }, [skip, activeTab, profile]);

  if (!user) return null;

  const isOwn = profile?.is_own_profile ?? false;
  const displayName = profile?.display_name ?? profile?.username ?? username;
  const avatarUrl = profile?.avatar_url ?? null;
  const bannerUrl = profile?.banner_url ?? null;
  const bio = profile?.bio ?? null;
  const isVerified = profile?.is_verified ?? false;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="md:ml-[250px] min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <h2 className="text-[24px] font-bold text-white">User not found</h2>
            <p className="text-white/40 text-[15px]">@{username} doesn&apos;t exist on Gridhub</p>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            <div className="relative w-full h-[200px] md:h-[280px] bg-white/5 overflow-hidden group">
              {bannerUrl && !bannerError ? (
                <img
                  src={mediaUrl(bannerUrl)}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  onError={() => setBannerError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.05)">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </div>
              )}
              {isOwn && (
                <button
                  onClick={() => bannerInput.current?.click()}
                  className="absolute top-4 right-4 px-4 h-8 rounded-full bg-black/60 text-white text-[13px] font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
                >
                  Change Banner
                </button>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#12110f] via-[#12110f]/30 to-transparent" />
              <input type="file" ref={bannerInput} className="hidden" accept="image/*" onChange={handleBannerUpload} />
            </div>

            <div className="max-w-[960px] mx-auto w-full px-4 md:px-8">
              <div className="relative flex justify-between items-end -mt-14 md:-mt-20 z-10 mb-5">
                <div className="relative">
                  <div className="rounded-full border-4 border-[#12110f] bg-[#12110f] overflow-hidden inline-block group">
                    <Avatar
                      src={avatarUrl}
                      username={profile.username}
                      displayName={displayName}
                      className="w-20 h-20 md:w-28 md:h-28"
                    />
                    {isOwn && (
                      <button
                        onClick={() => avatarInput.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </button>
                    )}
                    <input type="file" ref={avatarInput} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                  {isVerified && (
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#FFD190] border-2 border-[#12110f] flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#12110f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pb-2">
                  {isOwn ? (
                    <button
                      onClick={() => router.push("/settings")}
                      className="px-4 h-9 rounded-full border border-white/15 text-white/70 text-[13px] font-medium hover:bg-white/5 transition-all"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <FollowButton userId={profile.id} isFollowing={profile.is_following} />
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div className="flex-1 max-w-[600px]">
                  <div className="flex items-center gap-2">
                    <h1 className="text-[24px] font-bold text-white tracking-tight">
                      {displayName}
                    </h1>
                  </div>
                  <p className="text-white/40 text-[15px] mb-3">@{profile.username}</p>
                  {bio && (
                    <p className="text-white/70 text-[15px] leading-relaxed mb-4">{bio}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/40 font-medium">
                    <div className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 md:px-4 py-2 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-bold text-white">{profile.follower_count}</span>
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase mt-1">Followers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-bold text-white">{profile.following_count}</span>
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase mt-1">Following</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-bold text-[#FFD190]">{profile.post_count}</span>
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase mt-1">Posts</span>
                  </div>
                </div>
              </div>

              <div className="flex border-b border-white/[0.06] mb-6">
                {["Posts", "Comments", "Saved"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-6 text-[14px] font-bold transition-all relative ${
                      activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#FFD190]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pb-10">
                {activeTab === "Posts" && (
                  posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30 text-[15px]">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}>
                        <path d="M11 19H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" />
                        <path d="M18 21l-3-3 3-3" />
                        <path d="M21 18h-6" />
                      </svg>
                      <p>No posts yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {posts.map((p, idx) => {
                        const isLast = idx === posts.length - 1;
                        return (
                          <div key={p.id} ref={isLast ? lastItemRef : null}>
                            <Post
                              id={p.id}
                              author={{
                                username: p.author?.username ?? profile.username,
                                display_name: p.author?.display_name ?? null,
                                avatar_url: p.author?.avatar_url ?? null,
                                is_verified: p.author?.is_verified ?? false,
                              }}
                              content={p.content}
                              media={p.media}
                              created_at={p.created_at}
                              upvotes={p.upvotes}
                              user_vote={p.user_vote}
                              comments_count={p.comment_count}
                              compact
                            />
                          </div>
                        );
                      })}
                      {loadingMore && (
                        <div className="flex justify-center py-4">
                          <div className="w-6 h-6 border-2 border-white/20 border-t-[#FFD190] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  )
                )}

                {activeTab === "Comments" && (
                  loadingTab ? (
                    <div className="flex justify-center py-20">
                      <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30 text-[15px]">
                      <p>No comments yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {comments.map((c, idx) => {
                        const isLast = idx === comments.length - 1;
                        return (
                          <Link key={c.id} href={`/post/${c.post_id}`} className="block">
                            <div ref={isLast ? lastItemRef : null} className="p-4 rounded-[16px] border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white text-[14px] font-bold">@{profile.username}</span>
                                <span className="text-white/40 text-[12px]">commented on post #{c.post_id}</span>
                                <span className="text-white/20 text-[12px]">•</span>
                                <Timestamp date={c.created_at} className="text-white/40 text-[12px]" />
                              </div>
                              <p className="text-white/80 text-[14px] leading-relaxed break-words">{c.content}</p>
                            </div>
                          </Link>
                        );
                      })}
                      {loadingMore && (
                        <div className="flex justify-center py-4">
                          <div className="w-6 h-6 border-2 border-white/20 border-t-[#FFD190] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  )
                )}

                {activeTab === "Saved" && (
                  loadingTab ? (
                    <div className="flex justify-center py-20">
                      <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
                    </div>
                  ) : savedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30 text-[15px]">
                      <p>No saved posts</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {savedPosts.map((p: any, i) => {
                        const isLast = i === savedPosts.length - 1;
                        return (
                          <div key={p.id + "-" + i} ref={isLast ? lastItemRef : null}>
                            <Post
                              id={p.id}
                              author={{
                                username: p.author?.username ?? profile.username,
                                display_name: p.author?.display_name ?? null,
                                avatar_url: p.author?.avatar_url ?? null,
                                is_verified: p.author?.is_verified ?? false,
                              }}
                              content={p.content}
                              media={p.media?.map((m: any) => ({ url: m.url })) ?? []}
                              created_at={p.created_at}
                              upvotes={p.upvotes}
                              user_vote={p.user_vote ?? 0}
                              comments_count={p.comment_count}
                              compact
                            />
                          </div>
                        );
                      })}
                      {loadingMore && (
                        <div className="flex justify-center py-4">
                          <div className="w-6 h-6 border-2 border-white/20 border-t-[#FFD190] rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="block md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
