"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import Timestamp from "./Timestamp";
import type { User } from "@/lib/api";

interface CommentData {
  id: number;
  content: string;
  user_id: number;
  created_at: string;
  author: { username: string; display_name: string | null; avatar_url: string | null; is_verified: boolean } | null;
  replies?: CommentData[];
}

interface CommentThreadProps {
  comment: CommentData;
  user: User | null;
  postId: string;
  token: string | null;
  onReplySuccess: (newReply: CommentData, parentId: number) => void;
}

export default function CommentThread({ comment, user, postId, token, onReplySuccess }: CommentThreadProps) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(`@${comment.author?.username} `);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;

  async function handleReply() {
    if (!replyText.trim() || sending || !token) return;
    setSending(true);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyText.trim(), post_id: parseInt(postId), parent_id: comment.id }),
      });
      if (res.ok) {
        const created = await res.json();
        setReplying(false);
        setExpanded(true);
        onReplySuccess(created, comment.id);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-3 mt-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 shrink-0">
          <Avatar
            src={comment.author?.avatar_url}
            username={comment.author?.username ?? ""}
            displayName={comment.author?.display_name}
            size={32}
          />
        </div>
        {expanded && hasReplies && (
          <div className="w-[2px] flex-1 bg-white/[0.06] mt-2 mb-1 rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-white text-[13px] font-bold">
            {comment.author?.display_name ?? comment.author?.username ?? "Unknown"}
          </span>
          <span className="text-white/30 text-[11px]">
            <Timestamp date={comment.created_at} />
          </span>
        </div>
        <p className="text-white/80 text-[14px] mt-0.5 whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </p>

        <div className="flex items-center gap-4 mt-1.5">
          {user && (
            <button
              onClick={() => {
                if (!replying) {
                  setReplyText(`@${comment.author?.username} `);
                }
                setReplying(!replying);
              }}
              className="text-white/40 hover:text-white text-[12px] font-medium transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {replying && (
          <div className="flex gap-2 mt-3 mb-2">
            <input
              type="text"
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              className="flex-1 h-9 px-3 rounded-full border border-white/[0.08] text-white text-[13px] outline-none placeholder:text-white/20 focus:border-[#FFD190]/50 transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || sending}
              className="px-4 h-9 rounded-full bg-[#FFD190] text-[#12110f] text-[12px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {sending ? "..." : "Reply"}
            </button>
          </div>
        )}

        {hasReplies && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 mt-2.5 text-[#FFD190] hover:text-[#ffe3bc] text-[12px] font-bold transition-colors group"
          >
            <div className="w-6 h-[2px] bg-[#FFD190]/30 group-hover:bg-[#FFD190]/60 transition-colors rounded-full" />
            Show replies ({comment.replies!.length})
          </button>
        )}

        {hasReplies && expanded && (
          <div className="flex flex-col gap-1 mt-2">
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-2 mt-1 mb-1 text-white/40 hover:text-white/70 text-[12px] font-medium transition-colors group"
            >
              <div className="w-6 h-[2px] bg-white/20 group-hover:bg-white/40 transition-colors rounded-full" />
              Hide replies
            </button>
            {comment.replies!.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                user={user}
                postId={postId}
                token={token}
                onReplySuccess={onReplySuccess}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}