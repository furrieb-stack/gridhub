"use client";

import { useState } from "react";

interface PostAuthor {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface PostProps {
  author: PostAuthor;
  subgrid?: string;
  title?: string;
  content: string;
  created_at: string;
  upvotes: number;
  comments_count: number;
  saved?: boolean;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
}

export default function Post({ author, subgrid, title, content, created_at, upvotes, comments_count, saved: initSaved }: PostProps) {
  const [saved, setSaved] = useState(initSaved ?? false);
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = (author.display_name ?? author.username).charAt(0).toUpperCase();

  return (
    <div className="rounded-[16px] border p-4 transition-all duration-200 hover:bg-white/[0.01]"
      style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-[12px] bg-yellow/20 flex items-center justify-center">
            <span className="text-[16px] font-bold text-yellow">{initial}</span>
          </div>
          {author.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1d9bf0] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-[14px] font-medium truncate">
              {author.display_name ?? author.username}
            </span>
            <span className="text-muted-dark text-[13px]">@{author.username}</span>
            {subgrid && (
              <>
                <span className="text-muted-dark text-[13px]">·</span>
                <span className="text-yellow text-[13px]">g/{subgrid}</span>
              </>
            )}
            <span className="text-muted-dark text-[13px] ml-auto">
              {formatTime(created_at)}
            </span>
          </div>

          {title && (
            <h3 className="text-white text-[15px] font-bold mt-1.5 leading-snug">
              {title}
            </h3>
          )}

          <p className="text-white/80 text-[14px] mt-1 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>

          <div className="flex items-center gap-1 mt-3 -ml-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-muted hover:text-yellow hover:bg-yellow/5 transition-all duration-200 text-[13px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 10v12M7 10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3m0 6h7a3 3 0 0 0 3-3V5a2 2 0 0 0-2-2h-3.5M7 10v12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {upvotes}
            </button>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-muted hover:text-yellow hover:bg-yellow/5 transition-all duration-200 text-[13px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {comments_count}
            </button>

            <button
              onClick={() => setSaved(!saved)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-muted hover:text-yellow hover:bg-yellow/5 transition-all duration-200 text-[13px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "#FFD190" : "none"}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke={saved ? "#FFD190" : "currentColor"} strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
            </button>

            <div className="relative ml-auto">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-[8px] text-muted hover:text-white hover:bg-white/[0.04] transition-all duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={5} r={2} fill="currentColor" />
                  <circle cx={12} cy={12} r={2} fill="currentColor" />
                  <circle cx={12} cy={19} r={2} fill="currentColor" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-[14px] border overflow-hidden shadow-xl"
                    style={{
                      backgroundColor: "#1a1a1a",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <button className="w-full px-4 py-2.5 text-left text-[13px] text-muted hover:text-white hover:bg-white/[0.04] transition-colors">
                      Share
                    </button>
                    <button className="w-full px-4 py-2.5 text-left text-[13px] text-muted hover:text-white hover:bg-white/[0.04] transition-colors">
                      Report
                    </button>
                    <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                    <button className="w-full px-4 py-2.5 text-left text-[13px] text-red-400 hover:bg-white/[0.04] transition-colors">
                      Hide
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
