"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearTokens, getStoredUser, type User } from "@/lib/api";
import Avatar from "@/components/Avatar";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Feed", href: "/feed", icon: "feed" },
  { label: "Explore", href: "/explore", icon: "explore" },
  { label: "Notifications", href: "/notifications", icon: "notifications", badge: 7 },
  { label: "Messages", href: "/messages", icon: "messages" },
  { label: "Saved", href: "/saved", icon: "saved" },
] as const;

function MobileNavIcon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.4)";
  const props = { width: 20, height: 20, fill: c, viewBox: "0 0 24 24" };

  switch (name) {
    case "feed":
      return (
        <svg {...props}>
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case "explore":
      return (
        <svg {...props} fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...props}>
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      );
    case "messages":
      return (
        <svg {...props}>
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      );
    case "saved":
      return (
        <svg {...props}>
          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <nav className="fixed bottom-5 inset-x-4 mx-auto max-w-[320px] z-50 block md:hidden backdrop-blur-2xl bg-[#12110f]/50 rounded-full border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between px-1.5 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (pathname === "/" && item.label === "Feed");
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex items-center justify-center w-[42px] h-[42px] rounded-full transition-all duration-200 active:scale-90 hover:bg-white/[0.06]"
            >
              <MobileNavIcon name={item.icon} active={active} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#FFD190] text-[#12110f] text-[8px] font-extrabold flex items-center justify-center ring-2 ring-[#12110f]/50">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="transition-transform active:scale-90"
          >
            <Avatar
              src={user?.avatar_url}
              username={user?.username ?? ""}
              displayName={user?.display_name}
              size={36}
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full right-0 mb-4 w-44 rounded-2xl border border-white/[0.1] bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                  className="w-full px-4 py-3 text-left text-[13px] text-white/80 hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Profile
                </button>
                <div className="h-px bg-white/[0.06]" />
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full px-4 py-3 text-left text-[13px] text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}