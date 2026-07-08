"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredUser, type User } from "@/lib/api";
import Avatar from "@/components/Avatar";

interface PageLink {
  label: string;
  href: string;
  icon: string;
  desc: string;
  color: string;
}

const MAIN_PAGES: PageLink[] = [
  { label: "Feed", href: "/feed", icon: "feed", desc: "Post feed", color: "#FFD190" },
  { label: "Explore", href: "/explore", icon: "explore", desc: "Search communities", color: "#60A5FA" },
];

const SOCIAL_PAGES: PageLink[] = [
  { label: "Notifications", href: "/notifications", icon: "notifications", desc: "Your alerts", color: "#F87171" },
  { label: "Messages", href: "/messages", icon: "messages", desc: "Direct messages", color: "#34D399" },
  { label: "Communities", href: "/subgrids", icon: "subgrids", desc: "All communities", color: "#A78BFA" },
];

const PERSONAL_PAGES: PageLink[] = [
  { label: "Saved", href: "/saved", icon: "saved", desc: "Saved posts", color: "#FBBF24" },
  { label: "Settings", href: "/settings", icon: "settings", desc: "Profile and privacy", color: "#9CA3AF" },
];

const AUTH_PAGES: PageLink[] = [
  { label: "Login", href: "/login", icon: "login", desc: "Sign in", color: "#FFD190" },
  { label: "Register", href: "/register", icon: "register", desc: "Create account", color: "#60A5FA" },
];

function PageIcon({ name, color }: { name: string; color: string }) {
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", stroke: color };
  switch (name) {
    case "feed":
      return <svg {...props} fill={color} stroke="none"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>;
    case "explore":
      return <svg {...props} fill="none" strokeWidth={2.5}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "notifications":
      return <svg {...props} fill="none" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case "messages":
      return <svg {...props} fill="none" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "subgrids":
      return <svg {...props} fill={color} stroke="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>;
    case "saved":
      return <svg {...props} fill="none" strokeWidth={2}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>;
    case "settings":
      return <svg {...props} fill="none" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case "login":
      return <svg {...props} fill="none" strokeWidth={2}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>;
    case "register":
      return <svg {...props} fill="none" strokeWidth={2}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
    default:
      return <svg {...props} fill="none" strokeWidth={2}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

function PageGroup({ links }: { links: PageLink[] }) {
  return (
    <div className="bg-white/[0.04] rounded-[20px] overflow-hidden border border-white/[0.04] mb-6">
      {links.map((page, index) => (
        <Link
          key={page.href}
          href={page.href}
          className="flex items-center gap-4 px-4 py-3.5 transition-all duration-200 hover:bg-white/[0.06] active:bg-white/[0.08]"
        >
          <div 
            className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${page.color}15` }}
          >
            <PageIcon name={page.icon} color={page.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[16px] font-semibold tracking-tight">{page.label}</p>
            <p className="text-white/40 text-[13px] mt-0.5 truncate">{page.desc}</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

export default function AllPages() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#12110f" }}>
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#12110f]/80 backdrop-blur-xl border-b border-white/[0.04] px-4 py-4 mb-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="text-[22px] font-black tracking-tight">
            <span className="text-[#FFD190]">Grid</span>
            <span className="text-white">hub</span>
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {user ? (
          <>
            {/* User Profile Card */}
            <Link
              href={`/@${user.username}`}
              className="flex items-center gap-4 p-4 rounded-[24px] mb-8 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-white/10">
                <Avatar
                  src={user.avatar_url}
                  username={user.username}
                  displayName={user.display_name}
                  size={56}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[18px] font-bold truncate">
                  {user.display_name ?? user.username}
                </p>
                <p className="text-white/50 text-[14px] mt-0.5 truncate">@{user.username}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>

            <h2 className="text-white/50 text-[13px] font-bold uppercase tracking-wider mb-2 px-1">Discover</h2>
            <PageGroup links={MAIN_PAGES} />

            <h2 className="text-white/50 text-[13px] font-bold uppercase tracking-wider mb-2 px-1">Connect</h2>
            <PageGroup links={SOCIAL_PAGES} />

            <h2 className="text-white/50 text-[13px] font-bold uppercase tracking-wider mb-2 px-1">Personal</h2>
            <PageGroup links={PERSONAL_PAGES} />
          </>
        ) : (
          <>
            <h1 className="text-white text-[28px] font-black mb-2">Welcome</h1>
            <p className="text-white/50 text-[15px] mb-8">Sign in to access all Gridhub features.</p>
            <PageGroup links={AUTH_PAGES} />
          </>
        )}
      </div>
    </div>
  );
}