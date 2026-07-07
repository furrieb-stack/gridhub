"use client";

import { useState } from "react";
import Image from "next/image";

interface PostAuthor {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface PostProps {
  author: PostAuthor;
  content: string;
  image?: string;
  created_at: string;
  upvotes: number;
  comments_count: number;
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

export default function Post({ author, content, image, created_at, upvotes, comments_count }: PostProps) {
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = (author.display_name ?? author.username).charAt(0).toUpperCase();

  return (
    <div className="rounded-[24px] border overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        borderColor: "rgba(255,255,255,0.04)",
      }}
    >
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-[16px] font-bold text-white/60">{initial}</span>
              </div>
              {author.is_verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#1d9bf0] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-[15px] font-medium truncate">
                  {author.display_name ?? author.username}
                </span>
                <span className="text-white/40 text-[14px] truncate">@{author.username}</span>
                <span className="text-white/20 text-[13px] ml-1 shrink-0">· {formatTime(created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSaved(!saved)}
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "#FFD190" : "none"}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke={saved ? "#FFD190" : "rgba(255,255,255,0.4)"} strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-200"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={5} r={2} fill="rgba(255,255,255,0.4)" />
                  <circle cx={12} cy={12} r={2} fill="rgba(255,255,255,0.4)" />
                  <circle cx={12} cy={19} r={2} fill="rgba(255,255,255,0.4)" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-[14px] border overflow-hidden shadow-xl"
                    style={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <button className="w-full px-4 py-2.5 text-left text-[13px] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                      Share
                    </button>
                    <button className="w-full px-4 py-2.5 text-left text-[13px] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
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

        <p className="text-white/80 text-[15px] mt-3 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {image && (
        <div className="relative w-full aspect-video">
          <Image src={image} alt="" fill className="object-cover" />
        </div>
      )}

      <div className="px-5 py-3 flex items-center gap-6">
        <button className="flex items-center gap-1.5 text-white/40 hover:text-[#FFD190] transition-colors duration-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18l-5-3-5 3z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-medium">{upvotes}</span>
        </button>

        <button className="flex items-center gap-1.5 text-white/40 hover:text-[#FFD190] transition-colors duration-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-medium">{comments_count}</span>
        </button>

        <button className="flex items-center gap-1.5 text-white/40 hover:text-[#FFD190] transition-colors duration-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] font-medium">Share</span>
        </button>
      </div>
    </div>
  );
}
