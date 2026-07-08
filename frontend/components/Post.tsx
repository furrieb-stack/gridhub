"use client";

import { useState, useRef } from "react";
import { useEffect } from "react";
import { mediaUrl, getStoredUser, type User } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageViewer from "@/components/ImageViewer";
import Timestamp from "@/components/Timestamp";
import VerifiedBadge from "@/components/VerifiedBadge";
import Avatar from "@/components/Avatar";
import { useToast } from "@/components/ToastProvider";

interface PostAuthor {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export interface PostData {
  id: number;
  author: PostAuthor;
  content: string;
  media?: { url: string }[];
  created_at: string;
  upvotes: number;
  comments_count: number;
  subgrid?: { name: string; display_name: string | null } | null;
  user_vote?: number;
  share_count?: number;
}

export default function Post({ id, author, content, media, created_at, upvotes, comments_count, subgrid, user_vote = 0, share_count = 0 }: PostData) {
  const router = useRouter();
  const [voteState, setVoteState] = useState<1 | -1 | 0>(user_vote as 1 | -1 | 0);
  const [voteCount, setVoteCount] = useState(upvotes);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [displayContent, setDisplayContent] = useState(content);

  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  const { addToast } = useToast();

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const images = media?.map((m) => m.url) ?? [];
  const hasMultiple = images.length > 1;
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  const [isSaved, setIsSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleImgError(i: number) {
    setImgErrors((prev) => new Set(prev).add(i));
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollProgress(max > 0 ? el.scrollLeft / max : 0);
  }

  function scrollTo(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  }

  async function handleVote(value: 1 | -1) {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const next = voteState === value ? 0 : value;
    setVoteState(next);
    setVoteCount((prev) => prev + (next === 1 ? 1 : next === -1 ? -1 : voteState === 1 ? -1 : 1));
    try {
      const res = await fetch(`/api/posts/${id}/vote?value=${value}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setVoteState(voteState);
        setVoteCount(upvotes);
      } else {
        const data = await res.json();
        setVoteState(data.value);
        setVoteCount(data.upvotes);
      }
    } catch {
      setVoteState(voteState);
      setVoteCount(upvotes);
    }
  }

  async function handleSave() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const method = isSaved ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/posts/${id}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setIsSaved(!isSaved);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReport() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const reason = prompt("Reason for reporting:");
    if (!reason) return;
    try {
      const res = await fetch(`/api/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ post_id: id, reason, description: "" })
      });
      if (res.ok) addToast("Report submitted", "success");
      else addToast("Could not submit report", "error");
    } catch (e) {
      console.error(e);
    }
  }

  async function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
    
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch(`/api/posts/${id}/share`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
    
    addToast("Link copied to clipboard!", "success");
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("post-deleted", { detail: { id } }));
      } else {
        addToast("Failed to delete post", "error");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleEditSubmit() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        setIsEditing(false);
        setDisplayContent(editContent);
      } else {
        addToast("Failed to edit post", "error");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const isAuthor = currentUser?.username === author.username;

  return (
    <div
      className="rounded-[24px] border overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.04)",
      }}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href={`/@${author.username}`} className="relative shrink-0">
              <div className="w-[42px] h-[42px] rounded-full overflow-hidden bg-white/10">
                <Avatar
                  src={author.avatar_url}
                  username={author.username}
                  displayName={author.display_name}
                  size={42}
                />
              </div>
              {author.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FFD190] flex items-center justify-center border-2 border-[#151515]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#12110f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </Link>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <Link href={`/@${author.username}`} className="text-white text-[15px] font-bold truncate tracking-wide hover:underline">
                  {author.display_name ?? author.username}
                </Link>
                {subgrid && (
                  <Link href={`/subgrids/${subgrid.name}`} className="text-[13px] font-semibold text-[#FFD190] hover:underline">
                    c/{subgrid.name}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1 text-[13px] text-white/40">
                <Link href={`/@${author.username}`} className="truncate hover:underline">@{author.username}</Link>
                <span>·</span>
                <Timestamp date={created_at} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/[0.08]"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-[#FFD190]" : "text-white/40"}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/[0.08]"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/40">
                  <circle cx={12} cy={5} r={1.5} />
                  <circle cx={12} cy={12} r={1.5} />
                  <circle cx={12} cy={19} r={1.5} />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-40 rounded-2xl border overflow-hidden shadow-xl"
                    style={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    {isAuthor ? (
                      <>
                        <button onClick={() => { setIsEditing(true); setMenuOpen(false); }} className="w-full px-4 py-3 text-left text-[14px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                          Edit Post
                        </button>
                        <div className="h-px bg-white/[0.06]" />
                        <button onClick={() => { handleDelete(); setMenuOpen(false); }} className="w-full px-4 py-3 text-left text-[14px] text-red-400 hover:bg-white/[0.06] transition-colors">
                          Delete Post
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { handleShare(); setMenuOpen(false); }} className="w-full px-4 py-3 text-left text-[14px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                          Share via...
                        </button>
                        <div className="h-px bg-white/[0.06]" />
                        <button onClick={() => { handleReport(); setMenuOpen(false); }} className="w-full px-4 py-3 text-left text-[14px] text-red-400 hover:bg-white/[0.06] transition-colors">
                          Report Post
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-4">
            <textarea
              className="w-full bg-[#12110f] border border-white/10 rounded-xl p-3 text-white text-[15px] focus:outline-none focus:border-[#FFD190]"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors text-[14px]">
                Cancel
              </button>
              <button onClick={handleEditSubmit} className="px-4 py-2 rounded-full bg-[#FFD190] text-[#12110f] font-bold text-[14px] hover:bg-[#ffe3bc] transition-colors">
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white/80 text-[15px] mt-4 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
        )}
      </div>

      {images.length > 0 && (
        <div className="relative border-y border-white/[0.02] group">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative w-full shrink-0 snap-start aspect-video cursor-pointer group"
                  onClick={() => setViewerIndex(i)}
                >
                  {imgErrors.has(i) ? (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={mediaUrl(src)}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={() => handleImgError(i)}
                    />
                  )}
                </div>
              ))}
          </div>

          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); scrollTo(-1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); scrollTo(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {images.map((_, i) => {
                  const count = images.length;
                  const pos = i / (count - 1);
                  const diff = Math.abs(scrollProgress - pos);
                  const active = diff < 0.5 / count;
                  return (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        active ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
                      }`}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {viewerIndex !== null && images.length > 0 && (
        <ImageViewer
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href={`/post/${id}`}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors duration-200 group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <span className="text-[14px] font-medium">{comments_count}</span>
          </Link>

          <button onClick={handleShare} className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors duration-200 group">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="text-[14px] font-medium">{share_count > 0 ? share_count : ''}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white/[0.03] rounded-full px-1 py-1">
          <button
            onClick={() => handleVote(1)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white/[0.06] group ${
              voteState === 1 ? "text-[#FFD190]" : "text-white/40 hover:text-[#FFD190]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={voteState === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-0.5 transition-transform">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
          <span className="text-[13px] font-bold text-white/70 min-w-[20px] text-center">{voteCount}</span>
          <button
            onClick={() => handleVote(-1)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white/[0.06] group ${
              voteState === -1 ? "text-red-400" : "text-white/40 hover:text-red-400"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={voteState === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}