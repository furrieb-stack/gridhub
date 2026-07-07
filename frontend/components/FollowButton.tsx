"use client";

import { useState } from "react";

interface FollowButtonProps {
  isFollowing?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function FollowButton({ isFollowing = false, onToggle, className }: FollowButtonProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [hoverUnfollow, setHoverUnfollow] = useState(false);

  function handleClick() {
    setFollowing((prev) => !prev);
    onToggle?.();
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
