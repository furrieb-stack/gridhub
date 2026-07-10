"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearTokens, getStoredUser, type User } from "@/lib/api";
import Avatar from "@/components/Avatar";
import NewPostModal from "@/components/NewPostModal";
import { useToast } from "@/components/ToastProvider";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Feed", href: "/feed", icon: "feed" },
  { label: "Explore", href: "/explore", icon: "explore" },
  { label: "All Pages", href: "/all-pages", icon: "all-pages" },
  { label: "Alerts", href: "/notifications", icon: "notifications" },
] as const;

function MobileNavIcon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.45)";
  const props = { width: 22, height: 22, fill: c, viewBox: "0 0 24 24" };

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
    case "all-pages":
      return (
        <svg {...props} fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...props}>
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
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
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("/api/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.unread_count !== undefined) {
          setUnreadCount(data.unread_count);
        }
      })
      .catch(console.error);

    const eventSource = new EventSource(`/api/notifications/stream/${token}`);
    
    eventSource.addEventListener("unread", (event) => {
      try {
        const data = JSON.parse(event.data);
        setUnreadCount(data.unread_count);
      } catch (e) { console.error(e); }
    });

    eventSource.addEventListener("notification", (event) => {
      try {
        const data = JSON.parse(event.data);
        const msg = (data.data?.message as string) ?? data.type;
        addToast(msg, "info");
      } catch (e) { console.error(e); }
    });

    return () => {
      eventSource.close();
    };
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
    <>
      <button
        onClick={() => setNewPostOpen(true)}
        className="fixed bottom-[108px] right-4 md:right-6 z-40 block md:hidden w-[56px] h-[56px] rounded-full bg-[#1a1a1a]/90 backdrop-blur-md border border-white/[0.08] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <nav className="fixed bottom-6 inset-x-0 mx-auto w-[94%] max-w-[420px] z-50 block md:hidden backdrop-blur-[60px] saturate-[180%] bg-[#12110f]/60 rounded-[32px] border border-white/[0.1] shadow-[0_30px_60px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between px-2.5 h-[72px]">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (pathname === "/" && item.label === "Feed");
            const badge = item.label === "Alerts" ? unreadCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center w-[72px] h-[56px] rounded-full transition-all duration-300 active:scale-95 ${
                  active ? "bg-white/[0.12]" : "hover:bg-white/[0.05]"
                }`}
              >
                <div className="relative flex items-center justify-center h-6 mb-0.5">
                  <MobileNavIcon name={item.icon} active={active} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#FFD190] text-[#12110f] text-[9px] font-black flex items-center justify-center ring-2 ring-[#12110f]/80">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors ${active ? "text-white" : "text-white/45"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`relative flex flex-col items-center justify-center w-[72px] h-[56px] rounded-full transition-all duration-300 active:scale-95 ${
                menuOpen || pathname.startsWith("/@") ? "bg-white/[0.12]" : "hover:bg-white/[0.05]"
              }`}
            >
              <div className="h-6 flex items-center justify-center mb-0.5">
                <div className={`w-5 h-5 rounded-full overflow-hidden transition-all duration-300 ${menuOpen || pathname.startsWith("/@") ? "ring-2 ring-white" : "ring-[1.5px] ring-white/40"}`}>
                  <Avatar
                    src={user?.avatar_url}
                    username={user?.username ?? ""}
                    displayName={user?.display_name}
                    size={20}
                  />
                </div>
              </div>
              <span className={`text-[10px] font-bold tracking-wide transition-colors ${menuOpen || pathname.startsWith("/@") ? "text-white" : "text-white/45"}`}>
                Profile
              </span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute bottom-[calc(100%+20px)] right-0 w-48 rounded-[24px] border border-white/[0.12] bg-[#1a1a1a]/95 backdrop-blur-[48px] shadow-[0_24px_60px_rgba(0,0,0,0.9)] z-50 overflow-hidden p-2">
                  <Link
                    href={user?.username ? `/@${user.username}` : "#"}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-[16px] text-left text-[14px] font-medium text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    My Profile
                  </Link>
                  <div className="h-[1px] bg-white/[0.08] my-1 mx-2" />
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-[16px] text-left text-[14px] font-medium text-red-400 hover:bg-red-500/15 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
      {newPostOpen && <NewPostModal onClose={() => setNewPostOpen(false)} />}
    </>
  );
}