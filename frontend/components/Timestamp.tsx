"use client";

import { useState } from "react";

interface TimestampProps {
  date: string | Date;
  className?: string;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString(undefined, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

function formatExact(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function Timestamp({ date, className }: TimestampProps) {
  const [showExact, setShowExact] = useState(false);
  const d = typeof date === "string" ? new Date(date) : date;
  const relative = formatRelative(d);
  const exact = formatExact(d);

  const isJustNow = relative === "0s";

  return (
    <span
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => setShowExact(true)}
      onMouseLeave={() => setShowExact(false)}
      style={{ cursor: "default" }}
    >
      <span className={isJustNow ? "text-[#FFD190]" : ""}>{relative}</span>
      {showExact && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[12px] text-white whitespace-nowrap pointer-events-none z-50"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {exact}
        </span>
      )}
    </span>
  );
}
