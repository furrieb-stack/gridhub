"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, fetchSubgrids, type User, type Subgrid, mediaUrl } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

export default function SubgridsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subgrids, setSubgrids] = useState<Subgrid[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Communities | Gridhub";
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSubgrids(search || undefined);
        setSubgrids(data);
      } catch {
        setSubgrids([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[20px] font-bold text-white">Communities</h1>
            <button
              onClick={() => router.push("/subgrids/create")}
              className="px-4 h-9 rounded-full bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all"
            >
              + New
            </button>
          </div>

          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx={11} cy={11} r={8} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search communities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full border-none text-white text-[14px] outline-none transition-all duration-200 placeholder:text-white/25"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
            </div>
          ) : subgrids.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/40 text-[15px]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>No communities found</p>
              <button
                onClick={() => router.push("/subgrids/create")}
                className="px-4 h-9 rounded-full bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all"
              >
                Create the first one
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subgrids.map((sg) => (
                <button
                  key={sg.id}
                  onClick={() => router.push(`/subgrids/${sg.name}`)}
                  className="flex items-center gap-4 px-4 py-3 rounded-[16px] transition-colors hover:bg-white/[0.03] text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {sg.avatar_url ? (
                      <img src={mediaUrl(sg.avatar_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/40 text-[18px] font-bold">{sg.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[15px] font-bold truncate flex items-center gap-1">
                      c/{sg.display_name ?? sg.name}
                      {sg.is_verified && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD190" className="shrink-0">
                          <path d="M20 6L9 17l-5-5" stroke="#12110f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </p>
                    <p className="text-white/40 text-[13px] truncate">{sg.subscriber_count} members</p>
                  </div>
                  {sg.is_subscribed && (
                    <span className="text-[#FFD190] text-[12px] font-bold">Joined</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
