"use client";

import { useState, useEffect } from "react";
import { getStoredUser, type User } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Timestamp from "@/components/Timestamp";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import ImageViewer from "@/components/ImageViewer";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";

export interface PostAuthor {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export interface PostMedia {
  url: string;
  type?: string;
}

export interface PostSubgrid {
  name: string;
  display_name: string | null;
  is_verified?: boolean;
}

export interface PostData {
  id: number;
  author: PostAuthor;
  content: string;
  media?: PostMedia[];
  created_at: string;
  upvotes: number;
  downvotes?: number;
  score?: number;
  comments_count: number;
  subgrid?: PostSubgrid | null;
  user_vote?: number;
  share_count?: number;
  title?: string | null;
}

export default function Post({
  id,
  author,
  content,
  media,
  created_at,
  upvotes,
  downvotes = 0,
  score,
  comments_count,
  subgrid,
  user_vote = 0,
  share_count = 0,
  compact = false,
  title,
}: PostData & { compact?: boolean }) {
  const router = useRouter();
  const [voteState, setVoteState] = useState<1 | -1 | 0>(user_vote as 1 | -1 | 0);
  const [currentScore, setCurrentScore] = useState(score ?? (upvotes - downvotes));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [displayContent, setDisplayContent] = useState(content);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { addToast } = useToast();
  const isFullPage = !compact;

  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  async function handleVote(value: 1 | -1) {
    const token = localStorage.getItem("access_token");
    if (!token) {
      addToast("You must be logged in to vote", "error");
      return;
    }
    const next = voteState === value ? 0 : value;
    
    let diff = 0;
    if (voteState === 1 && next === 0) diff = -1;
    else if (voteState === -1 && next === 0) diff = 1;
    else if (voteState === 1 && next === -1) diff = -2;
    else if (voteState === -1 && next === 1) diff = 2;
    else if (voteState === 0 && next === 1) diff = 1;
    else if (voteState === 0 && next === -1) diff = -1;

    setVoteState(next);
    setCurrentScore((prev) => prev + diff);

    try {
      const res = await fetch(`/api/posts/${id}/vote?value=${value}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setVoteState(voteState);
        setCurrentScore((prev) => prev - diff);
      } else {
        const data = await res.json();
        setVoteState(data.value);
        setCurrentScore(data.score ?? (data.upvotes - data.downvotes));
      }
    } catch {
      setVoteState(voteState);
      setCurrentScore((prev) => prev - diff);
    }
  }

  async function handleSave() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      addToast("You must be logged in to save posts", "error");
      return;
    }
    const method = isSaved ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/posts/${id}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsSaved(!isSaved);
        addToast(isSaved ? "Post removed from saves" : "Post saved successfully!", "success");
      }
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
    if (typeof window !== "undefined") {
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
  }

  async function handleDelete() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Post deleted", "success");
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
        addToast("Post updated successfully", "success");
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
      <div className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 px-5">
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
                  <div className="flex items-center gap-1">
                    <Link href={`/subgrids/${subgrid.name}`} className="text-[13px] font-semibold text-[#FFD190] hover:underline">
                      c/{subgrid.name}
                    </Link>
                    {subgrid.is_verified && <VerifiedBadge size={14} />}
                  </div>
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
                        <button onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }} className="w-full px-4 py-3 text-left text-[14px] text-red-400 hover:bg-white/[0.06] transition-colors">
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
          <div className="mt-4 px-5">
            <textarea
              className="w-full bg-[#12110f] border border-white/10 rounded-xl p-3 text-white text-[15px] focus:outline-none focus:border-[#FFD190] resize-none"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ maxHeight: "160px", overflowY: "auto" }}
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
          <div>
            <div
              className={`text-white/80 text-[15px] mt-4 leading-relaxed whitespace-pre-wrap break-words px-5 ${
                !isFullPage ? "line-clamp-2" : ""
              }`}
              style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
            >
              {displayContent}
            </div>
            
            {media && media.length > 0 && (
              <div className="mt-4 w-full overflow-hidden relative max-h-[500px] bg-black/20">
                {media.map((m, idx) => (
                  <img 
                    key={idx} 
                    src={m.url} 
                    alt="Post media" 
                    className="w-full h-auto object-cover max-h-[500px] cursor-pointer hover:opacity-95 transition-opacity" 
                    onClick={() => {
                      setViewerIndex(idx);
                      setViewerOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {!isFullPage && (
              <div className="px-5">
                <Link
                  href={`/post/${id}`}
                  className="inline-block mt-2 text-[#FFD190] text-[13px] font-bold hover:underline transition-colors"
                >
                  Read more
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

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
          <span className="text-[13px] font-bold text-white/70 min-w-[20px] text-center">{currentScore}</span>
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
      {viewerOpen && media && media.length > 0 && (
        <ImageViewer
          images={media.map((m) => m.url)}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmText="Delete"
          danger={true}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            handleDelete();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}