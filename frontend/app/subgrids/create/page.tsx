"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, createSubgrid, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

export default function CreateSubgridPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setError("");
    setLoading(true);

    try {
      const sg = await createSubgrid({
        name: name.trim(),
        display_name: displayName.trim() || undefined,
        description: description.trim() || undefined,
        is_nsfw: nsfw,
      });
      router.push(`/subgrids/${sg.name}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create community");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[500px]">
          <h1 className="text-[20px] font-bold text-white mb-6">Create a Community</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-red-400 text-[14px] bg-red-500/10 rounded-[12px] px-4 py-3">{error}</p>
            )}

            <div>
              <label className="text-white/50 text-[13px] font-medium">Name</label>
              <input
                type="text"
                placeholder="c/communityname"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                required
                maxLength={50}
                className="w-full h-12 px-4 mt-1.5 rounded-[14px] border border-white/[0.06] text-white text-[15px] outline-none transition-colors focus:border-[#FFD190]/50 placeholder:text-white/20"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              />
            </div>

            <div>
              <label className="text-white/50 text-[13px] font-medium">Display Name (optional)</label>
              <input
                type="text"
                placeholder="Community Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                className="w-full h-12 px-4 mt-1.5 rounded-[14px] border border-white/[0.06] text-white text-[15px] outline-none transition-colors focus:border-[#FFD190]/50 placeholder:text-white/20"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              />
            </div>

            <div>
              <label className="text-white/50 text-[13px] font-medium">Description (optional)</label>
              <textarea
                placeholder="What's this community about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
                className="w-full px-4 py-3 mt-1.5 rounded-[14px] border border-white/[0.06] text-white text-[15px] outline-none resize-none transition-colors focus:border-[#FFD190]/50 placeholder:text-white/20"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              />
            </div>

            <label className="flex items-center justify-between py-3 cursor-pointer">
              <div>
                <p className="text-white text-[14px] font-medium">NSFW</p>
                <p className="text-white/30 text-[12px] mt-0.5">18+ content</p>
              </div>
              <div className="relative w-10 h-6 rounded-full bg-white/[0.08] cursor-pointer transition-colors has-[:checked]:bg-[#FFD190]">
                <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} className="sr-only peer" />
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4 peer-checked:bg-[#12110f]" />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full h-12 mt-2 rounded-[14px] bg-[#FFD190] text-[#12110f] text-[15px] font-bold hover:bg-[#ffe3bc] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Community"}
            </button>
          </form>
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
