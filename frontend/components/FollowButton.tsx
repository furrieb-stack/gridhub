"use client";

import { useState } from "react";

interface FollowButtonProps {
  userId?: number;
  isFollowing?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function FollowButton({ userId, isFollowing = false, onToggle, className }: FollowButtonProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [hoverUnfollow, setHoverUnfollow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!userId || loading) return;
    
    // Optimistic update
    setFollowing((prev) => !prev);
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        onToggle?.();
      } else {
        // Revert on failure
        setFollowing((prev) => !prev);
      }
    } catch (e) {
      setFollowing((prev) => !prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHoverUnfollow(true)}
      onMouseLeave={() => setHoverUnfollow(false)}
      className={`rounded-full text-[13px] font-bold transition-all duration-200 active:scale-[.96] ${className ?? ""} ${
        following
          ? hoverUnfollow
            ? "bg-red-500/15 text-red-400 border border-red-500/30"
            : "bg-white/10 text-white border border-white/15"
          : "bg-white text-[#12110f] hover:bg-white/90 border border-transparent"
      }`}
      style={{
        paddingLeft: 16,
        paddingRight: 16,
        height: 32,
        minWidth: 88,
      }}
    >
      {following ? (hoverUnfollow ? "Unfollow" : "Following") : "Follow"}
    </button>
  );
}
