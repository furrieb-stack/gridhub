"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

interface ReportItem {
  id: number;
  post_id?: number;
  comment_id?: number;
  reason: string;
  description?: string;
  created_at: string;
  reporter_id: number;
  resolved: boolean;
}

interface SubgridAdmin {
  id: number;
  name: string;
  display_name: string | null;
  description: string | null;
  is_verified: boolean;
  is_nsfw: boolean;
  owner_username: string | null;
  subscriber_count: number;
  moderator_count: number;
  created_at: string;
}

interface UserStats {
  total: number;
  verified: number;
  banned: number;
  admins: number;
  mods: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [subgrids, setSubgrids] = useState<SubgridAdmin[]>([]);
  const [tab, setTab] = useState<"users" | "reports" | "subgrids">("users");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [banModal, setBanModal] = useState<{ user: any } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [banIp, setBanIp] = useState(false);
  const [banDeletePosts, setBanDeletePosts] = useState(false);
  const [subgridSearch, setSubgridSearch] = useState("");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) { router.replace("/login"); return; }
    if (!stored.is_admin) { router.replace("/feed"); return; }
    setUser(stored);
  }, [router]);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?include_banned=true`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/users/count`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {}
    setLoading(false);
  };

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setReports(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchSubgrids = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subgrids`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSubgrids(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "users") fetchUsers();
    else if (tab === "reports") fetchReports();
    else fetchSubgrids();
  }, [tab, token]);

  const doAction = async (url: string, id: number, cb: () => void) => {
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) cb();
    } catch {}
    setActionLoading(null);
  };

  const doBan = async () => {
    if (!token || !banModal) return;
    setActionLoading(banModal.user.id);
    try {
      const body: any = {};
      if (banReason) body.reason = banReason;
      if (banDuration) body.duration_hours = banDuration;
      if (banIp) body.ban_ip = true;
      if (banDeletePosts) body.delete_posts = true;
      const res = await fetch(`/api/admin/users/${banModal.user.id}/ban`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchUsers();
        setBanModal(null);
        setBanReason("");
        setBanDuration(null);
        setBanIp(false);
        setBanDeletePosts(false);
      }
    } catch {}
    setActionLoading(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.display_name?.toLowerCase() || "").includes(userSearch.toLowerCase())
  );

  const filteredSubgrids = subgrids.filter(
    (s) =>
      s.name.toLowerCase().includes(subgridSearch.toLowerCase()) ||
      (s.display_name?.toLowerCase() || "").includes(subgridSearch.toLowerCase())
  );

  if (!user || !user.is_admin) return null;

  const tabs = [
    { key: "users" as const, label: "Users" },
    { key: "reports" as const, label: "Reports" },
    { key: "subgrids" as const, label: "Subgrids" },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-8 py-6 md:py-10">
        <div className="w-full max-w-[900px]">
          <h1 className="text-[28px] font-black text-white mb-2 tracking-tight">Admin Panel</h1>

          {stats && (
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="px-4 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.04]">
                <span className="text-white/40 text-[11px] font-bold uppercase">Total</span>
                <p className="text-white text-[18px] font-black">{stats.total}</p>
              </div>
              <div className="px-4 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.04]">
                <span className="text-white/40 text-[11px] font-bold uppercase">Admins</span>
                <p className="text-[#FFD190] text-[18px] font-black">{stats.admins}</p>
              </div>
              <div className="px-4 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.04]">
                <span className="text-white/40 text-[11px] font-bold uppercase">Mods</span>
                <p className="text-blue-400 text-[18px] font-black">{stats.mods}</p>
              </div>
              <div className="px-4 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.04]">
                <span className="text-white/40 text-[11px] font-bold uppercase">Verified</span>
                <p className="text-green-400 text-[18px] font-black">{stats.verified}</p>
              </div>
              <div className="px-4 py-2 rounded-[12px] bg-white/[0.03] border border-white/[0.04]">
                <span className="text-white/40 text-[11px] font-bold uppercase">Banned</span>
                <p className="text-red-400 text-[18px] font-black">{stats.banned}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-[12px] mb-6 w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-[8px] text-[13px] font-bold transition-all ${
                  tab === t.key ? "bg-[#FFD190] text-[#12110f]" : "text-white/40 hover:text-white/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "users" && (
            <>
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-11 px-4 rounded-[14px] bg-white/[0.04] border border-white/[0.08] text-white text-[14px] outline-none mb-4 placeholder:text-white/20"
              />
              <div className="flex flex-col gap-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 rounded-[16px] border border-white/[0.04]"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#FFD190] flex items-center justify-center shrink-0">
                        <span className="text-[14px] font-black text-[#12110f]">
                          {(u.display_name ?? u.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-[14px] font-medium truncate flex items-center gap-2">
                          {u.display_name ?? u.username}
                          {u.is_verified && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD190">
                              <path d="M20 6L9 17l-5-5" stroke="#12110f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {u.is_admin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">ADMIN</span>}
                          {u.is_mod && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">MOD</span>}
                          {u.is_banned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">BANNED</span>}
                        </p>
                        <p className="text-white/30 text-[12px]">@{u.username}</p>
                        {u.ban_reason && <p className="text-red-400/60 text-[11px] mt-0.5">Reason: {u.ban_reason}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        onClick={() => doAction(`/api/admin/users/${u.id}/verify`, u.id, fetchUsers)}
                        disabled={actionLoading === u.id || u.is_verified}
                        className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all ${
                          u.is_verified ? "bg-green-500/10 text-green-400 cursor-not-allowed" : "bg-white/10 text-white/70 hover:bg-white/20"
                        }`}
                      >
                        {u.is_verified ? "Verified" : "Verify"}
                      </button>
                      {!u.is_admin && (
                        <button
                          onClick={() => doAction(`/api/admin/users/${u.id}/make-admin`, u.id, fetchUsers)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 rounded-[8px] bg-red-500/10 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all"
                        >
                          Make Admin
                        </button>
                      )}
                      {!u.is_mod && !u.is_admin && (
                        <button
                          onClick={() => doAction(`/api/admin/users/${u.id}/make-mod`, u.id, fetchUsers)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 rounded-[8px] bg-blue-500/10 text-blue-400 text-[11px] font-bold hover:bg-blue-500/20 transition-all"
                        >
                          Make Mod
                        </button>
                      )}
                      {u.is_mod && !u.is_admin && (
                        <button
                          onClick={() => doAction(`/api/admin/users/${u.id}/remove-mod`, u.id, fetchUsers)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 rounded-[8px] bg-red-500/10 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all"
                        >
                          Remove Mod
                        </button>
                      )}
                      {!u.is_banned && !u.is_admin && (
                        <button
                          onClick={() => setBanModal({ user: u })}
                          className="px-3 py-1.5 rounded-[8px] bg-red-500/10 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all"
                        >
                          Ban
                        </button>
                      )}
                      {u.is_banned && (!u.is_admin || u.id === user.id) && (
                        <button
                          onClick={() => doAction(`/api/admin/users/${u.id}/unban`, u.id, fetchUsers)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 rounded-[8px] bg-green-500/10 text-green-400 text-[11px] font-bold hover:bg-green-500/20 transition-all"
                        >
                          Unban
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "reports" && (
            <div className="flex flex-col gap-3">
              {reports.length === 0 ? (
                <p className="text-white/30 text-[14px] text-center py-12">No unresolved reports</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="p-5 rounded-[16px] border border-white/[0.04]" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-[14px] font-bold">Report #{r.id}</span>
                          <span className="text-white/30 text-[12px]">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-white/60 text-[13px]">
                          {r.post_id ? `Post #${r.post_id}` : r.comment_id ? `Comment #${r.comment_id}` : "Unknown"}
                        </p>
                        <p className="text-white/80 text-[14px] mt-2">{r.reason}</p>
                        {r.description && <p className="text-white/40 text-[13px] mt-1">{r.description}</p>}
                      </div>
                      <button
                        onClick={() => doAction(`/api/admin/reports/${r.id}/resolve`, r.id, fetchReports)}
                        disabled={actionLoading === r.id}
                        className="px-4 py-2 rounded-[10px] bg-green-500/10 text-green-400 text-[12px] font-bold hover:bg-green-500/20 transition-all shrink-0"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "subgrids" && (
            <>
              <input
                type="text"
                placeholder="Search subgrids..."
                value={subgridSearch}
                onChange={(e) => setSubgridSearch(e.target.value)}
                className="w-full h-11 px-4 rounded-[14px] bg-white/[0.04] border border-white/[0.08] text-white text-[14px] outline-none mb-4 placeholder:text-white/20"
              />
              <div className="flex flex-col gap-2">
                {filteredSubgrids.length === 0 ? (
                  <p className="text-white/30 text-[14px] text-center py-12">No subgrids</p>
                ) : (
                  filteredSubgrids.map((s) => (
                    <div key={s.id} className="p-4 rounded-[16px] border border-white/[0.04]" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-white text-[14px] font-bold truncate flex items-center gap-2">
                            c/{s.name}
                            {s.is_verified && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD190">
                                <path d="M20 6L9 17l-5-5" stroke="#12110f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            {s.is_nsfw && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">NSFW</span>}
                          </p>
                          <p className="text-white/40 text-[12px]">{s.display_name ?? s.name} · by @{s.owner_username ?? "unknown"}</p>
                          <p className="text-white/30 text-[11px] mt-0.5">{s.subscriber_count} subs · {s.moderator_count} mods</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!s.is_verified && (
                            <button
                              onClick={() => doAction(`/api/admin/subgrids/${s.id}/verify`, s.id, fetchSubgrids)}
                              disabled={actionLoading === s.id}
                              className="px-3 py-1.5 rounded-[8px] bg-green-500/10 text-green-400 text-[11px] font-bold hover:bg-green-500/20 transition-all"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => doAction(`/api/admin/subgrids/${s.id}/nsfw?nsfw=${!s.is_nsfw}`, s.id, fetchSubgrids)}
                            disabled={actionLoading === s.id}
                            className="px-3 py-1.5 rounded-[8px] bg-red-500/10 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-all"
                          >
                            {s.is_nsfw ? "Unmark NSFW" : "Mark NSFW"}
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete subgrid c/${s.name}?`)) doAction(`/api/admin/subgrids/${s.id}`, s.id, fetchSubgrids); }}
                            disabled={actionLoading === s.id}
                            className="px-3 py-1.5 rounded-[8px] bg-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/30 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {banModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setBanModal(null)}>
          <div className="w-full max-w-[420px] bg-[#1a1a1a] border border-white/[0.08] rounded-[24px] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white text-[18px] font-bold mb-4">Ban @{banModal.user.username}</h2>

            <label className="text-white/50 text-[12px] font-medium mb-1 block">Reason</label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
              className="w-full h-10 px-3 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-[14px] outline-none mb-3 placeholder:text-white/20"
            />

            <label className="text-white/50 text-[12px] font-medium mb-1 block">Duration (hours, leave empty = permanent)</label>
            <input
              type="number"
              value={banDuration ?? ""}
              onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Permanent"
              className="w-full h-10 px-3 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-[14px] outline-none mb-3 placeholder:text-white/20"
            />

            <div className="flex flex-col gap-2 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={banIp} onChange={(e) => setBanIp(e.target.checked)} className="accent-[#FFD190]" />
                <span className="text-white/70 text-[13px]">Ban IP address</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={banDeletePosts} onChange={(e) => setBanDeletePosts(e.target.checked)} className="accent-[#FFD190]" />
                <span className="text-white/70 text-[13px]">Delete all posts</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setBanModal(null)} className="flex-1 py-2.5 rounded-[10px] text-white/60 text-[13px] font-bold hover:bg-white/5 transition-all">
                Cancel
              </button>
               <button onClick={doBan} disabled={actionLoading === banModal.user.id} className="flex-1 py-2.5 rounded-[10px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-all disabled:opacity-50">
                {actionLoading === banModal.user.id ? "Banning..." : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}