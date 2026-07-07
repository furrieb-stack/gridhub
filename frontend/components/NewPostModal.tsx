"use client";

import { useState, useRef, useEffect } from "react";

interface NewPostModalProps {
  onClose: () => void;
}

export default function NewPostModal({ onClose }: NewPostModalProps) {
  const [content, setContent] = useState("");
  const [visible, setVisible] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    textRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handlePost() {
    if (!content.trim()) return;
    handleClose();
  }

  const canPost = content.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] md:pt-[15vh]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className={`w-full max-w-[520px] mx-4 rounded-[24px] border overflow-hidden transition-all duration-200 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={handlePost}
            disabled={!canPost}
            className="px-5 h-9 rounded-full bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>

        <div className="px-5 pb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD190] flex items-center justify-center shrink-0">
              <span className="text-[15px] font-bold text-[#12110f]">Y</span>
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                ref={textRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                rows={6}
                className="w-full bg-transparent text-white text-[16px] outline-none resize-none placeholder:text-white/20 leading-relaxed"
                style={{ fontFamily: "inherit" }}
              />

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </button>
                </div>

                <span className={`text-[12px] ${content.length > 500 ? "text-red-400" : "text-white/20"}`}>
                  {content.length}/500
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
