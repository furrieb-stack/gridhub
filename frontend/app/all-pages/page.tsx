"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredUser, type User } from "@/lib/api";

interface PageLink {
  label: string;
  href: string;
  icon: string;
  desc: string;
}

const ALL_PAGES: PageLink[] = [
  { label: "Feed", href: "/feed", icon: "feed", desc: "Post feed" },
  { label: "Explore", href: "/explore", icon: "explore", desc: "Search communities and posts" },
  { label: "Notifications", href: "/notifications", icon: "notifications", desc: "Your notifications" },
  { label: "Messages", href: "/messages", icon: "messages", desc: "Direct messages" },
  { label: "Communities", href: "/subgrids", icon: "subgrids", desc: "All communities" },
  { label: "Saved", href: "/saved", icon: "saved", desc: "Saved posts" },
  { label: "Settings", href: "/settings", icon: "settings", desc: "Profile and privacy settings" },
  { label: "Login", href: "/login", icon: "login", desc: "Sign in" },
  { label: "Register", href: "/register", icon: "register", desc: "Create account" },
];

function PageIcon({ name }: { name: string }) {
  const c = "rgba(255,255,255,0.5)";
  const props = { width: 20, height: 20, viewBox: "0 0 24 24" };
  switch (name) {
    case "feed":
      return <svg {...props} fill={c}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>;
    case "explore":
      return <svg {...props} fill="none" stroke={c} strokeWidth={2.5}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "notifications":
      return <svg {...props} fill="none" stroke={c} strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case "messages":
      return <svg {...props} fill="none" stroke={c} strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "subgrids":
      return <svg {...props} fill={c}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>;
    case "saved":
      return <svg {...props} fill="none" stroke={c} strokeWidth={2}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>;
    case "settings":
      return <svg {...props} fill="none" stroke={c} strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case "login":
      return <svg {...props} fill="none" stroke={c} strokeWidth={2}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>;
    case "register":
      return <svg {...props} fill="none" stroke={c} strokeWidth={2}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
    default:
      return <svg {...props} fill={c}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

export default function AllPages() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  const pages = user
    ? ALL_PAGES
    : ALL_PAGES.filter((p) => ["Login", "Register"].includes(p.label));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#12110f" }}>
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[24px] font-bold tracking-tight">
            <span className="text-[#FFD190]">Grid</span>
            <span className="text-white">hub</span>
          </span>
        </div>

        <h1 className="text-white text-[20px] font-bold mb-1">All Pages</h1>
        <p className="text-white/40 text-[14px] mb-6">Quick navigation to every page</p>

        <div className="flex flex-col gap-2">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="flex items-center gap-4 px-4 py-3.5 rounded-[14px] transition-all duration-150 hover:bg-white/[0.04]"
              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            >
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              >
                <PageIcon name={page.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[15px] font-medium">{page.label}</p>
                <p className="text-white/30 text-[12px] mt-0.5 truncate">{page.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {user && (
          <Link
            href={`/@${user.username}`}
            className="flex items-center gap-4 px-4 py-3.5 rounded-[14px] mt-2 transition-all duration-150 hover:bg-white/[0.04]"
            style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#FFD190]">
              <span className="text-[15px] font-bold text-[#12110f]">
                {(user.display_name ?? user.username).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[15px] font-medium truncate">
                {user.display_name ?? user.username}
              </p>
              <p className="text-white/30 text-[12px] mt-0.5 truncate">@{user.username}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
