"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { mediaUrl, fetchStories, getStoredUser } from "@/lib/api";
import type { StoryGroupData } from "@/lib/api";
import StoryViewer from "./StoryViewer";
import StoryUploadModal from "./StoryUploadModal";

export default function Stories() {
  const [groups, setGroups] = useState<StoryGroupData[]>([]);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [brokenAvatars, setBrokenAvatars] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const currentUser = getStoredUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchStories();
      setGroups(data);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load, refreshKey]);

  function handleStoryCreated() {
    setRefreshKey((k) => k + 1);
  }

  if (groups.length === 0 && !currentUser) return null;

  return (
    <>
      <div className="flex items-center gap-4 overflow-x-auto py-5 px-2 no-scrollbar">
        <button
          onClick={() => setShowUpload(true)}
          className="flex flex-col items-center gap-2 shrink-0 group mr-1"
        >
          <div className="relative">
            <div className="w-[68px] h-[68px] rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-white/20 bg-white/[0.02] overflow-hidden">
              {currentUser?.avatar_url ? (
                <img 
                  src={mediaUrl(currentUser.avatar_url)} 
                  alt="Your story" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white/40 text-[24px] font-bold">
                  {(currentUser?.display_name ?? currentUser?.username ?? "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#FFD190] rounded-full border-[3px] border-[#12110f] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#12110f" strokeWidth={3.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
          <span className="text-[12px] font-medium text-white/60 truncate max-w-[72px] transition-colors group-hover:text-white/90">
            Your story
          </span>
        </button>

        {groups.map((g, i) => {
          const a = g.author;
          const hasUnseen = g.stories.length > 0;
          return (
            <button
              key={g.user_id}
              onClick={() => setViewingIndex(i)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className="relative">
                <div
                  className={`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 overflow-hidden ${
                    hasUnseen
                      ? "ring-[2.5px] ring-[#FFD190] ring-offset-[3px] ring-offset-[#12110f]"
                      : "ring-[1.5px] ring-white/15 ring-offset-[3px] ring-offset-[#12110f] opacity-60 group-hover:opacity-100"
                  }`}
                  style={{ backgroundColor: hasUnseen ? "#FFD190" : "#2a2a2a" }}
                >
                  {a.avatar_url && !brokenAvatars.has(g.user_id) ? (
                    <img
                      src={mediaUrl(a.avatar_url)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setBrokenAvatars((prev) => new Set(prev).add(g.user_id))}
                    />
                  ) : (
                    <span className={`${hasUnseen ? "text-[#12110f]" : "text-white/60"} text-[24px] font-bold`}>
                      {(a.display_name ?? a.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[12px] font-medium truncate max-w-[72px] transition-colors ${hasUnseen ? "text-white/90" : "text-white/50 group-hover:text-white/70"}`}>
                {a.display_name ?? a.username}
              </span>
            </button>
          );
        })}
      </div>

      {viewingIndex !== null && groups[viewingIndex] && (
        <StoryViewer
          key={viewingIndex}
          group={groups[viewingIndex]}
          onClose={() => setViewingIndex(null)}
          onPrevUser={viewingIndex > 0 ? () => setViewingIndex((i) => i! - 1) : null}
          onNextUser={viewingIndex < groups.length - 1 ? () => setViewingIndex((i) => i! + 1) : null}
          onFollowChange={() => load()}
        />
      )}

      {showUpload && (
        <StoryUploadModal
          onClose={() => setShowUpload(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </>
  );
}