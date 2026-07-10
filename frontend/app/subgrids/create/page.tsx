"use client";

import { type FormEvent, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, createSubgrid, type User } from "@/lib/api";

interface CreateSubgridModalProps {
  onClose?: () => void;
}

export default function CreateSubgridModal({ onClose }: CreateSubgridModalProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
    } else {
      setUser(stored);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [router]);

  function handleClose() {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
      else router.back();
    }, 300);
  }

  function handleTouchStart(e: React.TouchEvent) {
    // Не блокируем скролл внутри инпутов и текстареа
    if ((e.target as HTMLElement).closest("input, textarea, button")) return;
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
      setDragY(0); // Возвращаем на место, если свайпнули недостаточно сильно
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setError("");
    setLoading(true);

    try {
      const sg = await createSubgrid({
        name: name.trim(),
        display_name: displayName.trim() || undefined,
        description: description.trim() || undefined,
        is_nsfw: nsfw,
      });
      handleClose();
      setTimeout(() => router.push(`/subgrids/${sg.name}`), 300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create community");
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center transition-all duration-300 ${
        visible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent backdrop-blur-none"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-[500px] bg-[#1a1a1a] md:border border-white/[0.08] rounded-t-[32px] md:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          transform: visible
            ? `translateY(${dragY}px) scale(${typeof window !== 'undefined' && window.innerWidth >= 768 ? 1 : 1})`
            : `translateY(${typeof window !== 'undefined' && window.innerWidth >= 768 ? '10px' : '100%'}) scale(${typeof window !== 'undefined' && window.innerWidth >= 768 ? 0.95 : 1})`,
          opacity: visible ? 1 : (typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : 1),
          transition: isDragging.current ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Drag Handle */}
        <div className="md:hidden flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing w-full">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pt-2 md:pt-6 pb-4 border-b border-white/[0.04]">
          <h2 className="text-[20px] font-bold text-white tracking-tight">Create Community</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto no-scrollbar">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium rounded-[12px] px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Grid Name *</label>
              <div className="flex items-center">
                <span className="h-12 px-4 flex items-center rounded-l-[14px] bg-white/[0.02] border border-r-0 border-white/[0.06] text-white/40 text-[15px]">
                  c/
                </span>
                <input
                  type="text"
                  placeholder="communityname"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  required
                  maxLength={50}
                  className="flex-1 h-12 pr-4 rounded-r-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none transition-all focus:bg-white/[0.06] focus:border-[#FFD190]/60 placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Display Name</label>
              <input
                type="text"
                placeholder="E.g. Next.js Developers"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                className="w-full h-12 px-4 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none transition-all focus:bg-white/[0.06] focus:border-[#FFD190]/60 placeholder:text-white/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Description</label>
              <textarea
                placeholder="What's this community about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none resize-none transition-all focus:bg-white/[0.06] focus:border-[#FFD190]/60 placeholder:text-white/20"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-[16px] bg-red-500/5 border border-red-500/10 mt-2">
              <div className="pr-4">
                <p className="text-red-400 font-bold text-[14px] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  NSFW Community
                </p>
                <p className="text-red-400/60 text-[12px] mt-1 leading-relaxed">
                  Contains 18+ content. Users will be warned.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={nsfw}
                  onChange={(e) => setNsfw(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-red-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white peer-checked:after:border-none border border-red-500/30" />
              </label>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.04] bg-white/[0.01]">
          <button
            onClick={() => formRef.current?.requestSubmit()}
            disabled={loading || !name.trim()}
            className="w-full h-12 rounded-[14px] bg-[#FFD190] text-[#12110f] text-[15px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,209,144,0.2)] disabled:shadow-none"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-[#12110f]/20 border-t-[#12110f] animate-spin" />
                Creating...
              </>
            ) : (
              "Create Community"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}