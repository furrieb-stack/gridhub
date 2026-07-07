"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { clearTokens, getStoredUser, type User } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Feed", href: "/feed", icon: "feed" },
  { label: "Explore", href: "/explore", icon: "explore" },
  { label: "Notifications", href: "/notifications", icon: "notifications" },
  { label: "Messages", href: "/messages", icon: "messages" },
  { label: "Saved", href: "/saved", icon: "saved" },
  { label: "Profile", href: "/profile", icon: "profile" },
] as const;

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "#FFD190" : "rgba(255,255,255,0.5)";
  const props = { width: 22, height: 22, fill: "none", viewBox: "0 0 24 24" };

  switch (name) {
    case "feed":
      return (
        <svg {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
          <path d="M9 22V12h6v10" stroke={c} strokeWidth={2} strokeLinejoin="round" />
        </svg>
      );
    case "explore":
      return (
        <svg {...props}>
          <circle cx={12} cy={12} r={9} stroke={c} strokeWidth={2} />
          <circle cx={12} cy={12} r={3} stroke={c} strokeWidth={2} />
          <path d="M16.5 7.5L21 3" stroke={c} strokeWidth={2} strokeLinecap="round" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...props}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={c} strokeWidth={2} strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={c} strokeWidth={2} strokeLinejoin="round" />
        </svg>
      );
    case "messages":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
        </svg>
      );
    case "saved":
      return (
        <svg {...props}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" stroke={c} strokeWidth={2} strokeLinejoin="round" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <circle cx={12} cy={8} r={4} stroke={c} strokeWidth={2} />
          <path d="M20 21a8 8 0 1 0-16 0" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user: User | null = getStoredUser();

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

  const initial = (user?.display_name ?? user?.username ?? "U").charAt(0).toUpperCase();

  return (
    <nav className="fixed left-0 top-0 h-screen w-[240px] flex flex-col border-r z-50"
      style={{
        backgroundColor: "rgba(255, 209, 144, 0.03)",
        borderColor: "rgba(255, 209, 144, 0.08)",
      }}
    >
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <Image src="/favicon.svg" alt="" width={26} height={26} />
        <span className="text-[26px] font-bold tracking-tight">
          <span className="text-yellow">Grid</span>
          <span className="text-white">hub</span>
        </span>
      </div>

      <div className="flex-1 flex flex-col px-3">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[15px] transition-all duration-200 hover:bg-white/[0.04] text-left"
                style={{ color: active ? "#FFD190" : "rgba(255,255,255,0.6)" }}
              >
                <NavIcon name={item.icon} active={active} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 mx-2">
          <button className="w-full h-[44px] rounded-[14px] border-none text-dark text-[15px] font-bold cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[.98] flex items-center justify-center gap-2"
            style={{ backgroundColor: "#FFD190" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#121212" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
            New Post
          </button>
        </div>
      </div>

      <div className="border-t px-3 py-3"
        style={{ borderColor: "rgba(255, 209, 144, 0.08)" }}
      >
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center w-full gap-3 px-3 py-2 rounded-[12px] transition-all duration-200 hover:bg-white/[0.04]"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-[12px] bg-yellow/20 flex items-center justify-center">
                <span className="text-[16px] font-bold text-yellow">{initial}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-[14px] font-medium truncate">
                {user?.display_name ?? user?.username}
              </p>
              <p className="text-muted text-[12px] truncate">@{user?.username}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="text-muted hover:text-white transition-colors shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx={12} cy={5} r={2} fill="currentColor" />
                <circle cx={12} cy={12} r={2} fill="currentColor" />
                <circle cx={12} cy={19} r={2} fill="currentColor" />
              </svg>
            </button>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-[14px] border overflow-hidden"
              style={{
                backgroundColor: "#1a1a1a",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); router.push("/settings"); }}
                className="w-full px-4 py-3 text-left text-[14px] text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Settings
              </button>
              <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full px-4 py-3 text-left text-[14px] text-red-400 hover:bg-white/[0.04] transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
