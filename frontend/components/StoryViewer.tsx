"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { mediaUrl, toggleStoryLike, fetchStoryFollowStatus, getStoredUser } from "@/lib/api";
import type { StoryGroupData } from "@/lib/api";

interface StoryViewerProps {
  group: StoryGroupData;
  onClose: () => void;
  onPrevUser: (() => void) | null;
  onNextUser: (() => void) | null;
  onFollowChange?: (userId: number, following: boolean) => void;
}

export default function StoryViewer({ group, onClose, onPrevUser, onNextUser, onFollowChange }: StoryViewerProps) {
  const { stories, author, user_id } = group;
  const currentUser = getStoredUser();
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState(stories[0]?.is_liked ?? false);
  const [likesCount, setLikesCount] = useState(stories[0]?.likes_count ?? 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [brokenImg, setBrokenImg] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const idxRef = useRef(index);
  idxRef.current = index;
  const storiesRef = useRef(stories);
  storiesRef.current = stories;
  const onNextUserRef = useRef(onNextUser);
  onNextUserRef.current = onNextUser;
  const onPrevUserRef = useRef(onPrevUser);
  onPrevUserRef.current = onPrevUser;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const current = stories[index];
  const isVideo = current?.media_type === "mp4" || current?.media_type === "webm" || current?.media_type === "video";
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!current) return;
    setLiked(current.is_liked);
    setLikesCount(current.likes_count);
    setProgress(0);
    setBrokenImg(false);
    fetchStoryFollowStatus(current.id).then((r) => setIsFollowing(r.is_following)).catch(() => {});
  }, [index, current]);

  const advance = useCallback(() => {
    const idx = idxRef.current;
    const total = storiesRef.current.length;
    if (idx < total - 1) {
      setIndex(idx + 1);
    } else if (onNextUserRef.current) {
      onNextUserRef.current();
    } else {
      onCloseRef.current();
    }
  }, []);

  const goBack = useCallback(() => {
    const idx = idxRef.current;
    if (idx > 0) {
      setIndex(idx - 1);
    } else if (onPrevUserRef.current) {
      onPrevUserRef.current();
    }
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => onCloseRef.current(), 300);
  }, []);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isVideo) return;

    const duration = 5000;
    const interval = 50;
    const step = interval / duration;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          setTimeout(advance, 0);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, index, isVideo, advance]);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [index, isVideo]);

  function handleVideoTime() {
    if (!videoRef.current) return;
    const pct = videoRef.current.currentTime / videoRef.current.duration;
    setProgress(Math.min(pct, 1));
  }

  function handleVideoEnd() {
    advance();
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > 50 && absDx > absDy * 1.5) {
      if (dx > 0) goBack();
      else advance();
    }
    setPaused(false);
  }

  async function handleLike() {
    if (!current) return;
    const previousState = liked;
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    
    try {
      const res = await toggleStoryLike(current.id);
      setLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch {
      setLiked(previousState);
      setLikesCount(prev => previousState ? prev + 1 : prev - 1);
    }
  }

  function isExternalUrl(url: string) {
    return url.startsWith("http://") || url.startsWith("https://");
  }

  function handleOpenInBrowser() {
    if (current) window.open(current.media_url, "_blank", "noopener,noreferrer");
  }

  if (!current) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center select-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } bg-black`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* МЕДИА КОНТЕЙНЕР */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {isVideo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={mediaUrl(current.media_url)}
              className="w-full h-full object-contain"
              onTimeUpdate={handleVideoTime}
              onEnded={handleVideoEnd}
              onError={() => setBrokenImg(true)}
              playsInline
            />
            {brokenImg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/50 bg-[#12110f]/80">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <p className="text-[14px]">Video unavailable</p>
                {isExternalUrl(current.media_url) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenInBrowser(); }}
                    className="px-5 py-2.5 rounded-full bg-white/10 text-white text-[13px] font-medium hover:bg-white/20 transition-colors"
                  >
                    Open in browser
                  </button>
                )}
                <p className="text-[12px] text-white/30">Tap to continue</p>
              </div>
            )}
          </div>
        ) : (
          <img
            src={mediaUrl(current.media_url)}
            alt=""
            className="w-full h-full object-contain"
            onError={() => setBrokenImg(true)}
          />
        )}
      </div>

      {/* ВЕРХНЯЯ ЧАСТЬ (Инфо, бары, градиент) */}
      <div className="absolute top-0 inset-x-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-3 md:pt-5 pb-12 px-2 pointer-events-none">
        
        {/* Полоски прогресса */}
        <div className="flex gap-1 px-1.5 mb-3.5">
          {stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/30 shadow-sm">
              <div
                className="h-full rounded-full transition-all duration-100 bg-white"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Аватарка и юзернейм */}
        <div className="flex items-center justify-between px-2 pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20 bg-white/10">
              {author.avatar_url && !brokenImg ? (
                <img src={mediaUrl(author.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[13px] font-bold flex items-center justify-center w-full h-full">
                  {(author.display_name ?? author.username).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 drop-shadow-md">
              <span className="text-white text-[14px] font-semibold leading-none tracking-tight">
                {author.username}
              </span>
              
              {!isFollowing && user_id !== -1 && currentUser?.id !== user_id && (
                <>
                  <span className="text-white/60 text-[10px]">•</span>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("access_token");
                        const res = await fetch(`/api/users/${user_id}/follow`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                          setIsFollowing(true);
                          onFollowChange?.(user_id, true);
                        }
                      } catch {}
                    }}
                    className="text-white font-semibold text-[13px] hover:text-white/70 transition-colors"
                  >
                    Follow
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 drop-shadow-md">
            <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ЗОНЫ ТАПОВ (Левая/Правая часть экрана) */}
      <div className="absolute inset-0 z-20 flex">
        <div className="w-[30%]" onTouchStart={() => setPaused(true)} onTouchEnd={(e) => { e.stopPropagation(); goBack(); setPaused(false); }} onClick={(e) => { e.stopPropagation(); goBack(); }} />
        <div className="w-[70%]" onTouchStart={() => setPaused(true)} onTouchEnd={(e) => { e.stopPropagation(); advance(); setPaused(false); }} onClick={(e) => { e.stopPropagation(); advance(); }} />
      </div>

      {/* НИЖНЯЯ ПАНЕЛЬ (Градиент, поле ответа, лайк) */}
      <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-6 px-4">
        <div className="flex items-center justify-between gap-4 w-full">
          
          {/* Инпут-обманка (Reply) */}
          <div className="flex-1 h-11 rounded-full border border-white/30 px-4 flex items-center bg-black/20 backdrop-blur-sm cursor-text hover:bg-white/10 transition-colors">
            <span className="text-white/60 text-[14px]">Send message...</span>
          </div>

          {/* Лайк и счетчик */}
          <div className="flex flex-col items-center justify-center w-11 shrink-0">
            <button 
              onClick={handleLike} 
              className="group active:scale-90 transition-transform"
            >
              <svg 
                width="28" 
                height="28" 
                viewBox="0 0 24 24" 
                fill={liked ? "#FF3040" : "none"} 
                stroke={liked ? "#FF3040" : "white"} 
                strokeWidth={2}
                className="drop-shadow-md transition-colors"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            {likesCount > 0 && (
              <span className="text-white text-[12px] font-medium mt-1 drop-shadow-md">
                {likesCount}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}