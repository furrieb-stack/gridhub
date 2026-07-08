"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, mediaUrl, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

interface TopUser {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  karma_points: number;
  is_verified: boolean;
  follower_count: number;
}

interface TopSubgrid {
  id: number;
  name: string;
  display_name: string | null;
  avatar_url: string | null;
  description: string | null;
  subscriber_count: number;
  post_count: number;
}

type Tab = "users" | "subgrids";

export default function ExplorePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<TopUser[]>([]);
  const [subgrids, setSubgrids] = useState<TopSubgrid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Explore | Gridhub";
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    Promise.all([
      fetch("/api/top-users", { headers }).then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {}),
      fetch("/api/top-subgrids", { headers }).then(r => r.ok ? r.json() : []).then(setSubgrids).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[600px]">
          <h1 className="text-[22px] font-bold text-white mb-1">Explore</h1>
          <p className="text-white/40 text-[14px] mb-6">Top users and communities on Gridhub</p>

          <div className="flex gap-2 mb-6">
            {(["users", "subgrids"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors capitalize ${
                  t === tab ? "bg-[#FFD190] text-[#12110f]" : "text-white/40 hover:text-white/70 bg-white/[0.04]"
                }`}
              >
                {t === "users" ? "Top Users" : "Top Communities"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-white/50 py-10 text-[14px]">Loading...</div>
          ) : tab === "users" ? (
            <div className="flex flex-col gap-2">
              {users.map((u, i) => (
                <div
                  key={u.id}
                  onClick={() => router.push(`/profile/${u.username}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <span className="text-white/30 text-[14px] font-mono w-5 text-right">{i + 1}</span>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                    {u.avatar_url ? (
                      <img src={mediaUrl(u.avatar_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[16px] font-bold flex items-center justify-center w-full h-full">
                        {(u.display_name ?? u.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-[14px] font-semibold truncate">{u.display_name ?? u.username}</span>
                      {u.is_verified && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD190">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-white/40 text-[12px]">
                      {u.follower_count} followers · {u.karma_points} karma
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="text-center text-white/50 py-10 text-[14px]">No users yet</div>}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subgrids.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/subgrids/${s.name}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <span className="text-white/30 text-[14px] font-mono w-5 text-right">{i + 1}</span>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
                    {s.avatar_url ? (
                      <img src={mediaUrl(s.avatar_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#FFD190] text-[16px] font-bold flex items-center justify-center w-full h-full">
                        {(s.display_name ?? s.name).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[14px] font-semibold truncate">{s.display_name ?? s.name}</div>
                    <div className="text-white/40 text-[12px]">
                      r/{s.name} · {s.subscriber_count} members · {s.post_count} posts
                    </div>
                  </div>
                </div>
              ))}
              {subgrids.length === 0 && <div className="text-center text-white/50 py-10 text-[14px]">No communities yet</div>}
            </div>
          )}
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}