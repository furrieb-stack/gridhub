"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getStoredUser, fetchSubgrids, fetchSubgrid, toggleSubscribe,
  fetchModerators, addModerator, removeModerator, mediaUrl, type User, type Subgrid,
} from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Post from "@/components/Post";
import NewPostModal from "@/components/NewPostModal";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

const SESSION_CACHE_KEY = "subgrid_session_cache";

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
  comment_count: number;
  created_at: string;
  author: { username: string; display_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
}

export default function SubgridPage() {
  const params = useParams();
  const router = useRouter();
  const name = params.name as string;
  const [user, setUser] = useState<User | null>(null);
  const [subgrid, setSubgrid] = useState<Subgrid | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [mods, setMods] = useState<User[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modInput, setModInput] = useState("");
  const [modError, setModError] = useState("");
  const [newPostOpen, setNewPostOpen] = useState(false);

  const isOwner = user && subgrid && user.id === subgrid.owner_id;
  const isMod = user && mods.some((m) => m.id === user.id);
  const canEdit = isOwner || isMod;

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  const load = useCallback(async () => {
    if (!name || !user) return;
    try {
      const list = await fetchSubgrids(name);
      const match = list.find((s) => s.name === name);
      if (!match) { setLoading(false); return; }
      const cacheKey = `subgrid_${name}`;
      const cached = getSessionCache()[cacheKey];
      if (cached) {
        setPosts(cached.data);
      }
      const [detail, postsRes, modsList] = await Promise.all([
        fetchSubgrid(match.id),
        fetch(`/api/posts?subgrid_id=${match.id}&sort=new&limit=20`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        }),
        fetchModerators(match.id),
      ]);
      setSubgrid(detail);
      setSubscribed(detail.is_subscribed ?? false);
      setMods(modsList);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
        setSessionCache(cacheKey, postsData);
      }
    } catch {
      setSubgrid(null);
    } finally {
      setLoading(false);
    }
  }, [name, user]);

  useEffect(() => { load(); }, [load]);

  async function handleSubscribe() {
    if (!subgrid) return;
    const res = await toggleSubscribe(subgrid.id);
    if (res.deleted) {
      router.push("/explore");
      return;
    }
    setSubscribed(res.subscribed);
    setSubgrid((prev) => prev ? { ...prev, subscriber_count: prev.subscriber_count + (res.subscribed ? 1 : -1) } : prev);
  }

  async function handleAddMod() {
    if (!subgrid || !modInput.trim()) return;
    setModError("");
    try {
      const searchRes = await fetch(`/api/users/by-username/${modInput.trim()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (!searchRes.ok) { setModError("User not found"); return; }
      const found: User = await searchRes.json();
      await addModerator(subgrid.id, found.id);
      setMods((prev) => [...prev, found]);
      setModInput("");
    } catch (err: unknown) {
      setModError(err instanceof Error ? err.message : "Failed to add moderator");
    }
  }

  async function handleRemoveMod(userId: number) {
    if (!subgrid) return;
    try {
      await removeModerator(subgrid.id, userId);
      setMods((prev) => prev.filter((m) => m.id !== userId));
    } catch {}
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
            </div>
          ) : !subgrid ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <h2 className="text-[24px] font-bold text-white">Community not found</h2>
              <p className="text-white/40 text-[15px]">c/{name} doesn&apos;t exist</p>
              <button onClick={() => router.push("/subgrids")} className="px-4 h-9 rounded-full bg-white/10 text-white text-[13px] font-medium hover:bg-white/15 transition-all">
                Browse communities
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-[24px] border border-white/[0.04] overflow-hidden mb-4" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                {subgrid.banner_url ? (
                  <div className="w-full h-32 md:h-40 overflow-hidden">
                    <img src={mediaUrl(subgrid.banner_url)} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-16 md:h-20" style={{ background: "linear-gradient(135deg, rgba(255,209,144,0.15), rgba(255,209,144,0.05))" }} />
                )}

                <div className="px-5 pb-5">
                  <div className="flex items-end justify-between -mt-8 mb-3">
                    <div className="w-16 h-16 rounded-full border-4 border-[#12110f] overflow-hidden bg-white/10 relative">
                      <Avatar
                        src={subgrid.avatar_url}
                        username={subgrid.name}
                        displayName={subgrid.display_name}
                        size={64}
                      />
                    </div>
                    <button
                      onClick={handleSubscribe}
                      className={`px-5 h-9 rounded-full text-[13px] font-bold transition-all ${
                        subscribed
                          ? "border border-white/20 text-white/70 hover:border-red-500/30 hover:text-red-400 bg-transparent"
                          : "bg-[#FFD190] text-[#12110f] hover:bg-[#ffe3bc]"
                      }`}
                    >
                      {subscribed ? "Joined" : "Join"}
                    </button>
                  </div>

                  <h1 className="text-[22px] font-bold text-white flex items-center gap-2">
                    c/{subgrid.display_name ?? subgrid.name}
                    {subgrid.is_verified && <VerifiedBadge size={20} />}
                  </h1>
                  {subgrid.description && (
                    <p className="text-white/60 text-[14px] mt-1 leading-relaxed">{subgrid.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[13px] text-white/40">
                    <span>{subgrid.subscriber_count} members</span>
                    <span>{subgrid.moderator_count} mods</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-[16px] font-bold text-white">Posts</h2>
                  {canEdit && (
                    <button
                      onClick={() => router.push(`/subgrids/${subgrid.name}/settings`)}
                      className="px-3 h-8 rounded-full border border-white/20 text-white text-[12px] font-medium hover:bg-white/5 transition-colors"
                    >
                      Settings
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setNewPostOpen(true)}
                  className="px-4 h-9 rounded-full bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all"
                >
                  + New Post
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30 text-[15px]">
                  <p>No posts in this community yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-8">
                  {posts.map((p) => (
                    <Post
                      key={p.id}
                      id={p.id}
                      author={{
                        username: p.author?.username ?? "unknown",
                        display_name: p.author?.display_name ?? null,
                        avatar_url: p.author?.avatar_url ?? null,
                        is_verified: p.author?.is_verified ?? false,
                      }}
                      content={p.content}
                      media={p.media?.map((m) => ({ url: m.url })) ?? []}
                      created_at={p.created_at}
                      upvotes={p.upvotes}
                      comments_count={p.comment_count}
                    />
                  ))}
                </div>
              )}

              {isOwner && (
                <div className="rounded-[24px] border border-white/[0.04] p-5 mb-6" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <h3 className="text-white text-[16px] font-bold mb-4">Moderators</h3>

                  <div className="flex flex-col gap-2 mb-4">
                    {mods.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white/40 text-[12px] font-bold">
                              {(m.display_name ?? m.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-[14px] font-medium">{m.display_name ?? m.username}</p>
                            <p className="text-white/30 text-[12px]">@{m.username}</p>
                          </div>
                        </div>
                        {m.id !== subgrid.owner_id && (
                          <button
                            onClick={() => handleRemoveMod(m.id)}
                            className="text-red-400 text-[12px] font-medium hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add moderator by username"
                      value={modInput}
                      onChange={(e) => { setModInput(e.target.value); setModError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMod()}
                      className="flex-1 h-10 px-4 rounded-[12px] border border-white/[0.06] text-white text-[14px] outline-none placeholder:text-white/20"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    />
                    <button
                      onClick={handleAddMod}
                      disabled={!modInput.trim()}
                      className="px-4 h-10 rounded-[12px] bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                  {modError && <p className="text-red-400 text-[12px] mt-2">{modError}</p>}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
      {newPostOpen && <NewPostModal subgridId={subgrid?.id} onClose={() => setNewPostOpen(false)} />}
    </div>
  );
}
