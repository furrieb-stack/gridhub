"use client";

import { useState, useRef } from "react";
import ImageViewer from "@/components/ImageViewer";
import Timestamp from "@/components/Timestamp";
import VerifiedBadge from "@/components/VerifiedBadge";
import Avatar from "@/components/Avatar";

interface PostAuthor {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface PostProps {
  author: PostAuthor;
  content: string;
  images?: string[];
  created_at: string;
  upvotes: number;
  comments_count: number;
}

export default function Post({ author, content, images, created_at, upvotes, comments_count }: PostProps) {
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const hasMultiple = images && images.length > 1;

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
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar
                src={author.avatar_url}
                username={author.username}
                displayName={author.display_name}
                size={42}
              />
              {author.is_verified && (
                <VerifiedBadge
                  size={20}
                  className="absolute -bottom-1 -right-1 border-2 border-[#151515]"
                />
              )}
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-white text-[15px] font-bold truncate tracking-wide">
                {author.display_name ?? author.username}
              </span>
              <div className="flex items-center gap-1 text-[13px] text-white/40">
                <span className="truncate">@{author.username}</span>
                <span>·</span>
                <Timestamp date={created_at} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSaved(!saved)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/[0.08]"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.04)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} className={saved ? "text-[#FFD190]" : "text-white/40"}>
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
                  <div
                    className="absolute right-0 top-full mt-2 z-20 w-40 rounded-2xl border overflow-hidden shadow-xl"
                    style={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <button className="w-full px-4 py-3 text-left text-[14px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
                      Share via...
                    </button>
                    <div className="h-px bg-white/[0.06]" />
                    <button className="w-full px-4 py-3 text-left text-[14px] text-red-400 hover:bg-white/[0.06] transition-colors">
                      Report Post
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-white/80 text-[15px] mt-4 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {images && images.length > 0 && (
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
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                </div>
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

      {viewerIndex !== null && images && (
        <ImageViewer
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      <div className="px-5 py-3 flex items-center gap-6">
        <button className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors duration-200 group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="text-[14px] font-medium">{upvotes}</span>
        </button>

        <button className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors duration-200 group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
          <span className="text-[14px] font-medium">{comments_count}</span>
        </button>

        <button className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors duration-200 group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="text-[14px] font-medium">12</span>
        </button>
      </div>
    </div>
  );
}
