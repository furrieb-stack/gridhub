"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, mediaUrl, type User } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

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

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

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
            const mods = await modRes.json();
            setIsMod(mods.some((m: any) => m.id === user?.id));
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
        addToast("Settings saved successfully", "success");
      } else {
        addToast("Failed to save settings", "error");
      }
    } catch (e) {
      addToast("Network error", "error");
    }
    setSaving(false);
  };

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    if (!e.target.files || !e.target.files[0] || !subgrid) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/subgrids/${subgrid.id}/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSubgrid({ ...subgrid, [`${type}_url`]: data[`${type}_url`] });
        addToast(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully`, "success");
      } else {
        addToast(`Failed to update ${type}`, "error");
      }
    } catch (err) {
      addToast("Network error", "error");
    }
  };

  if (!user || loading) return null;

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50 bg-[#12110f]">
        <p className="text-[15px]">{fetchError}</p>
      </div>
    );
  }

  if (subgrid && subgrid.owner_id !== user.id && !user.is_admin && !isMod) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#12110f]">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-8 py-8 md:py-12">
        <div className="w-full max-w-[800px]">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-white text-[28px] md:text-[32px] font-bold tracking-tight">
              Community Settings
            </h1>
            <button
              onClick={() => router.push(`/subgrids/${subgrid.name}`)}
              className="px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors text-[14px]"
            >
              View Community
            </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-3xl border border-white/[0.04] overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col gap-6 w-full md:w-[240px] shrink-0">
                  <div className="relative w-[120px] h-[120px] rounded-full border-4 border-[#12110f] bg-[#12110f] overflow-hidden mx-auto md:mx-0 group">
                    {subgrid?.avatar_url ? (
                      <img src={mediaUrl(subgrid.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#FFD190] flex items-center justify-center font-bold text-[#12110f] text-[40px]">
                        {subgrid?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => avatarInput.current?.click()}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-[13px] font-medium">Change</span>
                    </button>
                    <input type="file" ref={avatarInput} className="hidden" accept="image/*" onChange={(e) => handleUploadMedia(e, "avatar")} />
                  </div>

                  <div className="relative h-24 w-full rounded-xl bg-white/5 group overflow-hidden">
                    {subgrid?.banner_url ? (
                      <img src={mediaUrl(subgrid.banner_url)} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#FFD190]/20 via-purple-500/20 to-blue-500/20" />
                    )}
                    <button
                      onClick={() => bannerInput.current?.click()}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-[13px] font-medium">Change Banner</span>
                    </button>
                    <input type="file" ref={bannerInput} className="hidden" accept="image/*" onChange={(e) => handleUploadMedia(e, "banner")} />
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Display Name"
                      className="w-full h-12 px-4 rounded-[12px] bg-[#12110f] border border-white/[0.04] text-white text-[15px] focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-white/60 text-[13px] font-medium uppercase tracking-wider">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell the community what this subgrid is about..."
                      rows={4}
                      className="w-full p-4 rounded-[12px] bg-[#12110f] border border-white/[0.04] text-white text-[15px] focus:outline-none focus:border-white/20 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isNsfw"
                      checked={isNsfw}
                      onChange={(e) => setIsNsfw(e.target.checked)}
                      className="w-5 h-5 accent-[#FFD190] bg-[#12110f] border-white/20 rounded cursor-pointer"
                    />
                    <label htmlFor="isNsfw" className="text-white text-[15px] cursor-pointer font-medium">
                      Mark as NSFW
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-black/20 border-t border-white/[0.04] flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 rounded-full bg-[#FFD190] text-[#12110f] font-bold text-[15px] hover:bg-[#ffe3bc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
