"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "privacy", label: "Privacy & Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "account", label: "Account" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block"><Navbar /></div>
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-6 py-6 md:py-8">
        <div className="w-full max-w-[680px]">
          <h1 className="text-[20px] font-bold text-white mb-6">Settings</h1>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex md:flex-col gap-1 md:w-48 shrink-0 overflow-x-auto no-scrollbar">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-4 py-2.5 rounded-[12px] text-[14px] font-medium text-left whitespace-nowrap transition-colors ${
                    activeSection === s.id
                      ? "text-white bg-white/[0.06]"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              {activeSection === "profile" && (
                <div className="space-y-5">
                  <div>
                    <label className="text-white/50 text-[13px] font-medium">Username</label>
                    <input
                      defaultValue={user.username}
                      readOnly
                      className="w-full h-12 px-4 mt-1.5 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none cursor-not-allowed opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-[13px] font-medium">Display Name</label>
                    <input
                      defaultValue={user.display_name ?? ""}
                      placeholder="Add a display name"
                      className="w-full h-12 px-4 mt-1.5 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none focus:border-[#FFD190]/50 transition-colors placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-[13px] font-medium">Bio</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about yourself"
                      className="w-full px-4 py-3 mt-1.5 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none resize-none focus:border-[#FFD190]/50 transition-colors placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-[13px] font-medium">Email</label>
                    <input
                      defaultValue={user.email}
                      readOnly
                      className="w-full h-12 px-4 mt-1.5 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="space-y-5">
                  {[
                    { label: "Private account", desc: "Only followers can see your posts" },
                    { label: "Show activity status", desc: "Let others see when you're active" },
                    { label: "Allow mentions", desc: "Control who can mention you" },
                    { label: "Allow direct messages", desc: "Receive messages from anyone" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white text-[14px] font-medium">{item.label}</p>
                        <p className="text-white/30 text-[12px] mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative w-10 h-6 rounded-full bg-white/[0.08] cursor-pointer transition-colors has-[:checked]:bg-[#FFD190]">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4 peer-checked:bg-[#12110f]" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-5">
                  {[
                    { label: "Push notifications", desc: "Receive push notifications" },
                    { label: "Email notifications", desc: "Receive email digests" },
                    { label: "Likes", desc: "Someone likes your post" },
                    { label: "Comments", desc: "Someone comments on your post" },
                    { label: "Follows", desc: "Someone follows you" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white text-[14px] font-medium">{item.label}</p>
                        <p className="text-white/30 text-[12px] mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative w-10 h-6 rounded-full bg-white/[0.08] cursor-pointer transition-colors has-[:checked]:bg-[#FFD190]">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4 peer-checked:bg-[#12110f]" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "appearance" && (
                <div className="space-y-5">
                  {[
                    { label: "Dark mode", desc: "Dark theme (currently only option)" },
                    { label: "Reduce motion", desc: "Minimize animations" },
                    { label: "Compact mode", desc: "Show more content per screen" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white text-[14px] font-medium">{item.label}</p>
                        <p className="text-white/30 text-[12px] mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative w-10 h-6 rounded-full bg-white/[0.08] cursor-pointer transition-colors has-[:checked]:bg-[#FFD190]">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.label === "Dark mode"} />
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4 peer-checked:bg-[#12110f]" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "account" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-[16px] border border-red-500/20" style={{ backgroundColor: "rgba(239, 68, 68, 0.06)" }}>
                    <p className="text-red-400 text-[14px] font-medium">Danger Zone</p>
                    <p className="text-white/30 text-[12px] mt-1 mb-4">Permanently delete your account and all data.</p>
                    <button className="px-4 h-9 rounded-full bg-red-500/20 text-red-400 text-[13px] font-bold hover:bg-red-500/30 transition-colors">
                      Delete Account
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-white text-[14px] font-medium">Export data</p>
                      <p className="text-white/30 text-[12px] mt-0.5">Download your posts and media</p>
                    </div>
                    <button className="px-4 h-9 rounded-full bg-white/[0.06] text-white/60 text-[13px] font-medium hover:bg-white/[0.1] transition-colors">
                      Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <div className="block md:hidden"><MobileNav /></div>
    </div>
  );
}
