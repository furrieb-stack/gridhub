"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";

interface NewPostModalProps {
  onClose: () => void;
  subgridId?: number;
}

const MAX_CONTENT_LENGTH = 10000;

export default function NewPostModal({ onClose, subgridId }: NewPostModalProps) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [subgrids, setSubgrids] = useState<{ id: number; name: string; display_name: string | null }[]>([]);
  const [selectedSubgridId, setSelectedSubgridId] = useState<number | undefined>(subgridId);
  const [showSubgridPicker, setShowSubgridPicker] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);

  const user = getStoredUser();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    // Focus after animation to prevent jumping on mobile
    setTimeout(() => textRef.current?.focus(), 300);
    
    const draft = localStorage.getItem("post_draft");
    if (draft) setContent(draft);
    if (!subgridId) {
      fetch("/api/subgrids/my", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
        .then((r) => r.json())
        .then((data) => setSubgrids(data))
        .catch(() => {});
    }
    
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [subgridId]);

  useEffect(() => {
    if (content) localStorage.setItem("post_draft", content);
    else localStorage.removeItem("post_draft");
  }, [content]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(() => {
      onClose();
      previews.forEach((p) => URL.revokeObjectURL(p));
    }, 300);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest("textarea") || (e.target as HTMLElement).closest("button")) return;
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  }

  function handleTouchEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    previews.forEach((p) => URL.revokeObjectURL(p));
    const newFiles = [...files, ...picked].slice(0, 6);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(i: number) {
    const newFiles = files.filter((_, idx) => idx !== i);
    setFiles(newFiles);
    newFiles.forEach((f) => URL.revokeObjectURL(URL.createObjectURL(f)));
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  function handlePost() {
    if ((!content.trim() && files.length === 0) || posting) return;

    const token = localStorage.getItem("access_token");
    if (!token) { setError("Not logged in"); return; }

    setPosting(true);
    const API = "/api";
    const postContent = content.trim();
    const targetSubgrid = selectedSubgridId ?? subgridId;

    handleClose();
    localStorage.removeItem("post_draft");

    (async () => {
      try {
        let mediaIds: number[] = [];

        if (files.length > 0) {
          for (const file of files) {
            const form = new FormData();
            form.append("file", file);
            const resp = await fetch(`${API}/upload`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: form,
            });
            if (!resp.ok) throw new Error("Upload failed");
            const data = await resp.json();
            mediaIds.push(data.id);
          }
        }

        const body: Record<string, unknown> = { content: postContent };
        if (mediaIds.length > 0) body.media_ids = mediaIds;
        if (targetSubgrid) body.subgrid_id = targetSubgrid;

        const resp = await fetch(`${API}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });

        if (resp.ok) {
          const post = await resp.json();
          window.dispatchEvent(new CustomEvent("post-created", { detail: { post } }));
          setPosting(false);
        } else {
          setPosting(false);
          setError("Failed to create post");
        }
      } catch (err) {
        setPosting(false);
        console.error("Post error:", err);
      }
    })();
  }

  const canPost = (content.trim().length > 0 || files.length > 0) && !posting;
  const initial = (user?.display_name ?? user?.username ?? "U").charAt(0).toUpperCase();

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center transition-all duration-300 ${
        visible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none"
      }`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-[560px] bg-[#1a1a1a] md:border md:border-white/[0.08] rounded-t-[32px] md:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          transform: visible 
            ? `translateY(${dragY}px) scale(${window.innerWidth >= 768 ? 1 : 1})` 
            : `translateY(${window.innerWidth >= 768 ? '10px' : '100%'}) scale(${window.innerWidth >= 768 ? 0.95 : 1})`,
          opacity: visible ? 1 : (window.innerWidth >= 768 ? 0 : 1),
          transition: isDragging.current ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="md:hidden flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 md:px-6 pt-2 md:pt-5 pb-3 border-b border-white/[0.04]">
          <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors text-[15px] font-medium hidden md:block">
            Cancel
          </button>
          
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:text-white transition-colors md:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          
          <div className="flex-1 text-center md:hidden font-bold text-white text-[15px]">New Post</div>
          
          <button
            onClick={handlePost}
            disabled={!canPost}
            className="px-5 h-9 rounded-full bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(255,209,144,0.3)] disabled:shadow-none active:scale-95"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>

        <div className="px-5 md:px-6 py-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex gap-3 h-full flex-col md:flex-row">
            <div className="hidden md:flex w-10 h-10 rounded-full bg-[#FFD190] items-center justify-center shrink-0">
              <span className="text-[15px] font-black text-[#12110f]">{initial}</span>
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <textarea
                ref={textRef}
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CONTENT_LENGTH) {
                    setContent(e.target.value);
                  }
                }}
                placeholder="What's happening?"
                className="w-full bg-transparent text-white text-[16px] md:text-[18px] outline-none resize-none placeholder:text-white/20 leading-relaxed min-h-[120px] flex-1"
                style={{ fontFamily: "inherit" }}
              />

              {subgrids.length > 0 && (
                <div className="relative mt-4">
                  <button
                    onClick={() => setShowSubgridPicker(!showSubgridPicker)}
                    className="flex items-center gap-2 px-4 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 text-[13px] font-medium hover:bg-white/10 transition-colors"
                  >
                    {selectedSubgridId
                      ? subgrids.find((s) => s.id === selectedSubgridId)?.display_name ?? subgrids.find((s) => s.id === selectedSubgridId)?.name
                      : "Post to community"}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={`transition-transform ${showSubgridPicker ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {showSubgridPicker && (
                    <div className="absolute top-full left-0 mt-2 w-64 rounded-[16px] border border-white/[0.08] bg-[#222] shadow-xl overflow-hidden z-50">
                      <button
                        onClick={() => { setSelectedSubgridId(undefined); setShowSubgridPicker(false); }}
                        className="w-full px-4 py-3 text-left text-white/50 text-[13px] hover:bg-white/[0.04] transition-colors"
                      >
                        None (general post)
                      </button>
                      <div className="h-px bg-white/[0.04]" />
                      {subgrids.map((sg) => (
                        <button
                          key={sg.id}
                          onClick={() => { setSelectedSubgridId(sg.id); setShowSubgridPicker(false); }}
                          className={`w-full px-4 py-3 text-left text-[13px] hover:bg-white/[0.04] transition-colors font-medium ${selectedSubgridId === sg.id ? "text-[#FFD190] bg-[#FFD190]/5" : "text-white/90"}`}
                        >
                          {sg.display_name ?? sg.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {previews.map((p, i) => (
                    <div key={i} className="relative w-[84px] h-[84px] rounded-[14px] overflow-hidden group border border-white/10">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-red-400 text-[13px] font-medium mt-3 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 md:px-6 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center justify-between mb-safe">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.08] text-[#FFD190] transition-colors"
                title="Add Media"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative rounded-full overflow-hidden flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle 
                      cx="18" cy="18" r="16" fill="none" 
                      stroke={content.length > MAX_CONTENT_LENGTH * 0.9 ? "#ef4444" : "#FFD190"} 
                      strokeWidth="3" 
                      strokeDasharray="100"
                      strokeDashoffset={100 - (Math.min(content.length / MAX_CONTENT_LENGTH, 1) * 100)}
                      className="transition-all duration-200 ease-out"
                    />
                  </svg>
                </div>
                <span className={`text-[12px] font-medium min-w-[28px] text-right ${content.length > MAX_CONTENT_LENGTH * 0.9 ? "text-red-400" : "text-white/40"}`}>
                  {content.length > MAX_CONTENT_LENGTH - 100 ? MAX_CONTENT_LENGTH - content.length : ""}
                </span>
              </div>
              <span className="text-[12px] text-white/30 font-medium">
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilePick}
      />
    </div>
  );
}