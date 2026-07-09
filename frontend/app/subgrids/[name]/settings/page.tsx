"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, mediaUrl, type User } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import ImageCropperModal from "@/components/ImageCropperModal";

export default function SubgridSettings({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [subgrid, setSubgrid] = useState<any>(null);
  const [isMod, setIsMod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isNsfw, setIsNsfw] = useState(false);

  const [mods, setMods] = useState<User[]>([]);
  const [modInput, setModInput] = useState("");
  const [modError, setModError] = useState("");

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "banner" | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<Blob | null>(null);
  const [pendingBanner, setPendingBanner] = useState<Blob | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
    } else {
      setUser(stored);
    }
  }, [router]);

  useEffect(() => {
    async function fetchSubgrid() {
      try {
        const res = await fetch(`/api/subgrids/name/${name}`);
        if (res.ok) {
          const data = await res.json();
          setSubgrid(data);
          setDisplayName(data.display_name || "");
          setDescription(data.description || "");
          setIsNsfw(data.is_nsfw || false);

          const modRes = await fetch(`/api/subgrids/${data.id}/moderators`);
          if (modRes.ok) {
            const modsData = await modRes.json();
            setMods(modsData);
            setIsMod(modsData.some((m: any) => m.id === user?.id));
          }
        } else {
          setFetchError("Community not found");
        }
      } catch (e) {
        setFetchError("Failed to load community");
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchSubgrid();
  }, [name, user, router]);

  const handleSave = async () => {
    if (!subgrid) return;
    setSaving(true);
    try {
      if (pendingAvatar) {
        const form = new FormData();
        form.append("file", pendingAvatar, "avatar.jpg");
        const uploadRes = await fetch(`/api/subgrids/${subgrid.id}/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
          body: form,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          subgrid.avatar_url = data.avatar_url;
        }
      }
      if (pendingBanner) {
        const form = new FormData();
        form.append("file", pendingBanner, "banner.jpg");
        const uploadRes = await fetch(`/api/subgrids/${subgrid.id}/banner`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
          body: form,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          subgrid.banner_url = data.banner_url;
        }
      }

      const res = await fetch(`/api/subgrids/${subgrid.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          description: description,
          is_nsfw: isNsfw,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubgrid(data);
        setPendingAvatar(null);
        setPendingBanner(null);
        addToast("Settings saved successfully", "success");
      } else {
        addToast("Failed to save settings", "error");
      }
    } catch (e) {
      addToast("Network error", "error");
    }
    setSaving(false);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setCropType(type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropped = (blob: Blob) => {
    if (!cropType) return;
    if (cropType === "avatar") {
      setPendingAvatar(blob);
      setSubgrid((prev: any) => prev ? { ...prev, avatar_url: URL.createObjectURL(blob) } : prev);
    } else {
      setPendingBanner(blob);
      setSubgrid((prev: any) => prev ? { ...prev, banner_url: URL.createObjectURL(blob) } : prev);
    }
    setCropImage(null);
    setCropType(null);
  };

  const handleAddMod = async () => {
    if (!subgrid || !modInput.trim()) return;
    setModError("");
    try {
      const searchRes = await fetch(`/api/users/by-username/${modInput.trim()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (!searchRes.ok) { setModError("User not found"); return; }
      const found: User = await searchRes.json();
      const modRes = await fetch(`/api/subgrids/${subgrid.id}/moderators?user_id=${found.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (modRes.ok) {
        setMods((prev) => [...prev, found]);
        setModInput("");
        addToast("Moderator added", "success");
      } else {
        const err = await modRes.json().catch(() => ({}));
        setModError(err.detail || "Failed to add moderator");
      }
    } catch {
      setModError("Network error");
    }
  };

  const handleRemoveMod = async (userId: number) => {
    if (!subgrid) return;
    try {
      const res = await fetch(`/api/subgrids/${subgrid.id}/moderators/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (res.ok) {
        setMods((prev) => prev.filter((m) => m.id !== userId));
        addToast("Moderator removed", "success");
      } else {
        addToast("Failed to remove moderator", "error");
      }
    } catch {
      addToast("Network error", "error");
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#12110f]">
        <div className="w-10 h-10 rounded-full border-4 border-[#FFD190] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50 bg-[#12110f]">
        <div className="flex flex-col items-center gap-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="opacity-50">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[16px] font-medium">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (subgrid && subgrid.owner_id !== user.id && !user.is_admin && !isMod) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#12110f]">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold">Access Denied</h2>
          <p className="text-white/50 text-[14px]">You do not have permission to edit this community's settings.</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-6 py-2.5 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block"><Navbar /></div>
      
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-8 py-6 md:py-10">
        <div className="w-full max-w-[640px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-white text-[24px] md:text-[28px] font-black tracking-tight">
              Community Settings
            </h1>
            <button
              onClick={() => router.push(`/subgrids/${subgrid.name}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-colors text-[13px] font-medium"
            >
              View Grid
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            {/* Media Block (Banner & Avatar) */}
            <div className="relative mb-14">
              <div className="relative h-48 w-full rounded-[24px] overflow-hidden bg-white/5 border border-white/[0.08] shadow-sm group">
                {subgrid?.banner_url ? (
                  <img src={mediaUrl(subgrid.banner_url)} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#FFD190]/20 via-purple-500/10 to-blue-500/10" />
                )}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                  <button onClick={() => bannerInput.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-white font-medium hover:bg-white/25 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-[14px]">Change Banner</span>
                  </button>
                </div>
              </div>
              
              <div className="absolute left-6 md:left-8 -bottom-10 z-10 group">
                <div className="relative w-[96px] h-[96px] rounded-full border-[4px] border-[#12110f] bg-[#1a1a1a] overflow-hidden shadow-xl">
                  {subgrid?.avatar_url ? (
                    <img src={mediaUrl(subgrid.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#FFD190] flex items-center justify-center font-bold text-[#12110f] text-[36px]">
                      {subgrid?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer" 
                    onClick={() => avatarInput.current?.click()}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <input type="file" hidden ref={avatarInput} onChange={(e) => handleFilePick(e, "avatar")} accept="image/*" />
              <input type="file" hidden ref={bannerInput} onChange={(e) => handleFilePick(e, "banner")} accept="image/*" />
            </div>

            {/* Inputs Block */}
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Grid URL</label>
                <div className="flex items-center">
                  <span className="h-12 px-4 flex items-center rounded-l-[14px] bg-white/[0.02] border border-r-0 border-white/[0.04] text-white/40 text-[15px]">
                    gridhub.com/
                  </span>
                  <input
                    defaultValue={subgrid.name}
                    readOnly
                    className="flex-1 h-12 pr-4 rounded-r-[14px] bg-white/[0.02] border border-white/[0.04] text-white/40 text-[15px] outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Next.js Developers"
                  className="w-full h-12 px-4 rounded-[14px] bg-white/[0.03] border border-white/[0.06] text-white text-[15px] outline-none focus:bg-white/[0.05] focus:border-[#FFD190]/60 focus:ring-1 focus:ring-[#FFD190]/30 transition-all placeholder:text-white/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the world what this community is about..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-[14px] bg-white/[0.03] border border-white/[0.06] text-white text-[15px] outline-none resize-none focus:bg-white/[0.05] focus:border-[#FFD190]/60 focus:ring-1 focus:ring-[#FFD190]/30 transition-all placeholder:text-white/20"
                />
              </div>

              {/* NSFW Toggle Block */}
              <div className="flex items-center justify-between p-5 rounded-[16px] bg-red-500/5 border border-red-500/10 mt-2">
                <div className="pr-4">
                  <p className="text-red-400 font-bold text-[15px] flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    NSFW Community
                  </p>
                  <p className="text-red-400/60 text-[13px] mt-1 leading-relaxed">
                    Mark this community as 18+. Users will be warned before entering.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isNsfw}
                    onChange={(e) => setIsNsfw(e.target.checked)}
                  />
                  <div className="w-12 h-6 bg-red-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[24px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white peer-checked:after:border-none border border-red-500/30" />
                </label>
              </div>
            </div>

            {/* Moderator Management */}
            {subgrid && user && subgrid.owner_id === user.id && (
              <div className="rounded-[24px] border border-white/[0.04] p-5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                <h3 className="text-white text-[16px] font-bold mb-4">Moderators</h3>
                <div className="flex flex-col gap-2 mb-4">
                  {mods.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <span className="text-white/40 text-[12px] font-bold">
                            {(m.display_name ?? m.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-[14px] font-medium">{m.display_name ?? m.username}</p>
                          <p className="text-white/30 text-[12px]">@{m.username}</p>
                        </div>
                      </div>
                      {m.id !== subgrid.owner_id && (
                        <button
                          onClick={() => handleRemoveMod(m.id)}
                          className="text-red-400 text-[12px] font-medium hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add moderator by username"
                    value={modInput}
                    onChange={(e) => { setModInput(e.target.value); setModError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMod()}
                    className="flex-1 h-10 px-4 rounded-[12px] border border-white/[0.06] text-white text-[14px] outline-none placeholder:text-white/20"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                  />
                  <button
                    onClick={handleAddMod}
                    disabled={!modInput.trim()}
                    className="px-4 h-10 rounded-[12px] bg-[#FFD190] text-[#12110f] text-[13px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
                {modError && <p className="text-red-400 text-[12px] mt-2">{modError}</p>}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-white/[0.06]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto px-10 py-3.5 bg-[#FFD190] text-[#12110f] text-[15px] font-bold rounded-[14px] hover:bg-[#ffe3bc] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_rgba(255,209,144,0.15)] flex justify-center items-center"
              >
                {saving ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#12110f]/20 border-t-[#12110f] animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
            
          </div>
        </div>
      </main>
      
      <div className="block md:hidden"><MobileNav /></div>

      {cropImage && cropType && (
        <ImageCropperModal
          image={cropImage}
          aspect={cropType === "avatar" ? 1 : 3}
          circularCrop={cropType === "avatar"}
          onCrop={handleCropped}
          onClose={() => { setCropImage(null); setCropType(null); }}
        />
      )}
    </div>
  );
}