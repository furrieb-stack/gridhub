"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStoredUser, mediaUrl, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Post from "@/components/Post";
import Timestamp from "@/components/Timestamp";
import Avatar from "@/components/Avatar";
import CommentThread from "@/components/CommentThread";

interface CommentData {
  id: number;
  content: string;
  user_id: number;
  created_at: string;
  author: { username: string; display_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
  replies?: CommentData[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<{
    id: number; content: string; media: { url: string }[]; upvotes: number; user_vote?: number; comment_count: number; created_at: string;
    author: { username: string; display_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
  } | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    async function load() {
      if (!postId || !token) return;
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/comments/post/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (postRes.ok) {
          const data = await postRes.json();
          setPost({
            id: data.id,
            content: data.content,
            media: data.media?.map((m: { url: string }) => ({ url: m.url })) ?? [],
            upvotes: data.upvotes,
            user_vote: data.user_vote ?? 0,
            comment_count: data.comment_count,
            created_at: data.created_at,
            author: data.author ? {
              username: data.author.username,
              display_name: data.author.display_name,
              avatar_url: data.author.avatar_url,
              is_verified: data.author.is_verified,
            } : null,
          });
        }
        if (commentsRes.ok) {
          setComments(await commentsRes.json());
        }
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId, token]);

  async function handleComment() {
    if (!newComment.trim() || sending || !token || !postId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment.trim(), post_id: parseInt(postId) }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setNewComment("");
      }
    } catch {}
    setSending(false);
  }

  const addReplyToTree = (list: CommentData[], reply: CommentData, parentId: number): CommentData[] => {
    return list.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      if (c.replies) {
        return { ...c, replies: addReplyToTree(c.replies, reply, parentId) };
      }
      return c;
    });
  };

  const handleReplySuccess = (newReply: CommentData, parentId: number) => {
    setComments(prev => addReplyToTree(prev, newReply, parentId));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[14px] mb-4 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
            </div>
          ) : !post ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <h2 className="text-[24px] font-bold text-white">Post not found</h2>
              <p className="text-white/40 text-[15px]">This post doesn&apos;t exist or was deleted</p>
            </div>
          ) : (
            <>
              <Post
                id={post.id}
                author={post.author ?? { username: "unknown", display_name: null, avatar_url: null, is_verified: false }}
                content={post.content}
                media={post.media}
                created_at={post.created_at}
                upvotes={post.upvotes}
                user_vote={post.user_vote ?? 0}
                comments_count={post.comment_count}
              />

              <div className="mt-6 rounded-[24px] border border-white/[0.04] p-5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <h3 className="text-white text-[16px] font-bold mb-4">Comments</h3>

                <div className="flex gap-3 mb-6">
                  <div className="w-9 h-9 shrink-0">
                    <Avatar
                      src={user.avatar_url}
                      username={user.username}
                      displayName={user.display_name}
                      size={36}
                    />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleComment()}
                      className="flex-1 h-10 px-4 rounded-[12px] border border-white/[0.06] text-white text-[14px] outline-none placeholder:text-white/20"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    />
                    <button
                      onClick={handleComment}
                      disabled={!newComment.trim() || sending}
                      className="px-4 h-10 rounded-[12px] bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sending ? "..." : "Send"}
                    </button>
                  </div>
                </div>

                {comments.length === 0 ? (
                  <p className="text-white/30 text-[14px] text-center py-8">No comments yet</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {comments.map((c) => (
                      <CommentThread
                        key={c.id}
                        comment={c}
                        user={user}
                        postId={postId}
                        token={token}
                        onReplySuccess={handleReplySuccess}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
