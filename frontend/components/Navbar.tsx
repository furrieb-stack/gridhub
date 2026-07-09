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
  { label: "Notifications", href: "/notifications", icon: "notifications" },
  { label: "Messages", href: "/messages", icon: "messages" },
  { label: "Communities", href: "/subgrids", icon: "subgrids" },
  { label: "Saved", href: "/saved", icon: "saved" },
  { label: "Profile", href: "/profile", icon: "profile" },
] as const;

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.4)";
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
    case "subgrids":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "saved":
      return (
        <svg {...props}>
          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subgrids, setSubgrids] = useState<{ id: number; name: string; display_name: string | null }[]>([]);
  const [selectedSubgridId, setSelectedSubgridId] = useState<number | undefined>(undefined);
  const [showSubgridPicker, setShowSubgridPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    fetch("/api/subgrids/my", {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    })
      .then((r) => r.json())
      .then((data) => setSubgrids(data))
      .catch(() => {});
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

  const displayName = user?.display_name ?? user?.username ?? "You";

  return (
    <nav className="fixed left-0 top-0 h-screen w-[250px] flex flex-col z-50 bg-[#12110f]"
      style={{
        borderRight: "1px solid rgba(255, 209, 144, 0.02)",
      }}
    >
      <div className="flex items-center gap-2 px-6 pt-7 pb-6">
        <span className="text-[28px] font-bold tracking-tight">
          <span className="text-[#FFD190]">Grid</span>
          <span className="text-white font-semibold ml-[1px]">hub</span>
        </span>
      </div>

      <div className="flex-1 flex flex-col px-3.5 overflow-y-auto no-scrollbar pb-4">
        <div className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const href = item.label === "Profile" && user ? `/@${user.username}` : item.href;
            const active = pathname === href || (pathname === "/" && item.label === "Feed");
            const badge = item.label === "Notifications" ? unreadCount : 0;

            return (
              <Link
                key={item.href}
                href={href}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-[14px] text-[15px] transition-all duration-150 text-left group
                  ${active ? 'bg-white/[0.06] text-white hover:bg-white/[0.09]' : 'text-white/45 hover:bg-white/[0.04] hover:text-white/80'}`}
              >
                <NavIcon name={item.icon} active={active} />
                <span className="font-medium tracking-wide">{item.label}</span>

                {badge > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-[#FFD190] text-[#12110f] text-[11px] font-bold flex items-center justify-center transition-transform group-hover:scale-105">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-5 px-1.5 flex flex-col gap-2">
          {showSubgridPicker && (
            <div className="rounded-[16px] border border-white/[0.08] bg-[#1a1a1a] shadow-xl overflow-hidden">
              <button
                onClick={() => { setSelectedSubgridId(undefined); setShowSubgridPicker(false); }}
                className="w-full px-4 py-3 text-left text-white/50 text-[13px] hover:bg-white/[0.04] transition-colors"
              >
                None (general post)
              </button>
              <div className="h-px bg-white/[0.04]" />
              {subgrids.map((sg) => (
                <button
                  key={sg.id}
                  onClick={() => { setSelectedSubgridId(sg.id); setShowSubgridPicker(false); }}
                  className={`w-full px-4 py-3 text-left text-[13px] hover:bg-white/[0.04] transition-colors font-medium ${selectedSubgridId === sg.id ? "text-[#FFD190] bg-[#FFD190]/5" : "text-white/90"}`}
                >
                  {sg.display_name ?? sg.name}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setNewPostOpen(true)} className="w-full h-[48px] rounded-full border-none text-[#12110f] text-[15px] font-bold cursor-pointer transition-all duration-150 hover:bg-[#ffe3bc] active:scale-[.98] flex items-center justify-center gap-1.5 bg-[#FFD190]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#12110f" strokeWidth={3} strokeLinecap="round" />
            </svg>
            New Post
          </button>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3 px-3">
          <Link href="/terms" className="text-white/30 text-[12px] font-medium hover:text-white/60 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-white/30 text-[12px] font-medium hover:text-white/60 transition-colors">
            Privacy Policy
          </Link>
          <div className="flex items-center gap-4 pt-1">
            <a href="https://discord.gg/gridhub" target="_blank" rel="noreferrer" className="text-white/30 hover:text-[#5865F2] transition-colors" title="Discord Server">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
            </a>
            <a href="https://t.me/gridhub" target="_blank" rel="noreferrer" className="text-white/30 hover:text-[#0088cc] transition-colors" title="Telegram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
          <p className="text-white/20 text-[11px] font-medium mt-1">
            © 2026 LLC "Blink development"
          </p>
        </div>
      </div>

      <div className="px-3.5 pb-6 mt-auto">
        <div className="h-[1px] w-full mx-auto mb-4 bg-white/[0.04]" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center w-full gap-3 px-3 py-2 rounded-[14px] transition-all duration-150 hover:bg-white/[0.04] group"
          >
            <Avatar
              src={user?.avatar_url}
              username={user?.username ?? ""}
              displayName={user?.display_name}
              size={40}
              className="transition-transform group-hover:scale-105"
            />
            
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-[14px] font-bold tracking-wide truncate">
                {displayName}
              </p>
              <p className="text-white/30 text-[12px] truncate group-hover:text-white/40 transition-colors">
                @{user?.username ?? "yourhandle"}
              </p>
            </div>

            <div className="text-white/30 group-hover:text-white/70 transition-colors shrink-0 pe-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx={12} cy={6} r={1.5} />
                <circle cx={12} cy={12} r={1.5} />
                <circle cx={12} cy={18} r={1.5} />
              </svg>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-[14px] border overflow-hidden z-50 bg-[#1a1a1a]"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <Link
                href={`/@${user?.username}`}
                onClick={() => setMenuOpen(false)}
                className="block w-full px-4 py-3 text-left text-[14px] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                View Profile
              </Link>
              <div className="h-px bg-white/[0.06]" />
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block w-full px-4 py-3 text-left text-[14px] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Settings
              </Link>
              {user?.is_admin && (
                <>
                  <div className="h-px bg-white/[0.06]" />
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full px-4 py-3 text-left text-[14px] text-red-400 hover:bg-red-500/10 transition-colors font-bold"
                  >
                    Admin Panel
                  </Link>
                </>
              )}
              <div className="h-px bg-white/[0.06]" />
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full px-4 py-3 text-left text-[14px] text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
      {newPostOpen && <NewPostModal subgridId={selectedSubgridId} onClose={() => setNewPostOpen(false)} />}
    </nav>
  );
}