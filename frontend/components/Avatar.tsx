"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/api";

interface AvatarProps {
  src?: string | null;
  username: string;
  displayName?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ src, username, displayName, size = 42, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const label = (displayName ?? username).charAt(0).toUpperCase();

  const hasExplicitSize = className?.includes("w-") && className?.includes("h-");

  const containerStyle = hasExplicitSize
    ? {}
    : { width: size, height: size, minWidth: size };

  if (src && !broken) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 ${className ?? ""}`}
        style={containerStyle}
      >
        <img
          src={mediaUrl(src)}
          alt={username}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-[#FFD190] flex items-center justify-center shrink-0 ${className ?? ""}`}
      style={containerStyle}
    >
      <span
        className="font-bold text-[#12110f]"
        style={{ fontSize: Math.max(size * 0.4, 12) }}
      >
        {label}
      </span>
    </div>
  );
}
