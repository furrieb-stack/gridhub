"use client";

import { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import { getStoredUser, setStoredUser, mediaUrl, type User } from "@/lib/api";
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

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<Record<string, boolean>>({
    show_activity: true,
    allow_mentions: true,
    allow_dms: true,
    push_notifications: true,
    email_notifications: true,
  });
  const { addToast } = useToast();

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Settings | Gridhub";
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else {
      setUser(stored);
      setDisplayName(stored.display_name || "");
      setBio(stored.bio || "");
      setIsPrivate(stored.is_private ?? false);
      if (stored.privacy_settings) {
        try {
          setPrivacySettings((prev) => ({ ...prev, ...JSON.parse(stored.privacy_settings!) }));
        } catch {}
      }
    }
  }, [router]);

  if (!user) return null;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ display_name: displayName, bio }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStoredUser(updated);
        setUser(updated);
        addToast("Profile saved successfully", "success");
      } else {
        addToast("Failed to save profile", "error");
      }
    } catch (e) {
      console.error(e);
      addToast("Network error", "error");
    }
    setSaving(false);
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          is_private: isPrivate,
          privacy_settings: JSON.stringify(privacySettings),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStoredUser(updated);
        setUser(updated);
        addToast("Settings saved successfully", "success");
      } else {
        addToast("Failed to save settings", "error");
      }
    } catch (e) {
      addToast("Network error", "error");
    }
    setSaving(false);
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/users/me/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const updated = { ...user, [`${type}_url`]: data[`${type}_url`] };
        setStoredUser(updated);
        setUser(updated);
        addToast(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully`, "success");
      } else {
        addToast(`Failed to update ${type}`, "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error", "error");
    }
  };

  const requestVerification = async () => {
    try {
      const res = await fetch("/api/users/verification-request", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (res.ok) {
        addToast("Verification requested", "success");
      } else {
        const error = await res.json();
        addToast(error.detail || "Request failed", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error", "error");
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure? This cannot be undone!")) return;
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (res.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        router.replace("/login");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
                  <div className="mb-8 relative rounded-[16px] overflow-hidden border border-white/[0.06] bg-[#12110f]">
                    {/* Banner Area */}
                    <div className="relative h-32 w-full bg-white/5 group">
                      {user.banner_url ? (
                        <img src={mediaUrl(user.banner_url)} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#FFD190]/20 via-purple-500/20 to-blue-500/20" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => bannerInput.current?.click()} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Avatar Area */}
                    <div className="absolute left-6 bottom-[-24px] z-10 group">
                      <div className="relative w-[72px] h-[72px] rounded-full border-4 border-[#12110f] bg-[#12110f] overflow-hidden">
                        {user.avatar_url ? (
                          <img src={mediaUrl(user.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#FFD190] flex items-center justify-center font-bold text-[#12110f] text-[28px]">
                            {user.display_name?.charAt(0).toUpperCase() ?? user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => avatarInput.current?.click()}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-white">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <input type="file" hidden ref={avatarInput} onChange={(e) => uploadFile(e, "avatar")} accept="image/*" />
                    <input type="file" hidden ref={bannerInput} onChange={(e) => uploadFile(e, "banner")} accept="image/*" />
                  </div>
                  <div className="pt-6">
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
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Add a display name"
                      className="w-full h-12 px-4 mt-1.5 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none focus:border-[#FFD190]/50 transition-colors placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-[13px] font-medium">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Tell us about yourself"
                      className="w-full px-4 py-3 mt-1.5 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[15px] outline-none resize-none focus:border-[#FFD190]/50 transition-colors placeholder:text-white/20"
                    />
                  </div>
                  <button onClick={saveProfile} disabled={saving} className="px-6 py-2.5 bg-[#FFD190] text-black font-bold rounded-[10px] hover:opacity-90">
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="space-y-5">
                  {[
                    { key: "is_private", label: "Private account", desc: "Only followers can see your posts" },
                    { key: "show_activity", label: "Show activity status", desc: "Let others see when you're active" },
                    { key: "allow_mentions", label: "Allow mentions", desc: "Control who can mention you" },
                    { key: "allow_dms", label: "Allow direct messages", desc: "Receive messages from anyone" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white text-[14px] font-medium">{item.label}</p>
                        <p className="text-white/30 text-[12px] mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative w-10 h-6 rounded-full bg-white/[0.08] cursor-pointer transition-colors has-[:checked]:bg-[#FFD190]">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={item.key === "is_private" ? isPrivate : (privacySettings as any)[item.key] ?? false}
                          onChange={() => {
                            if (item.key === "is_private") {
                              setIsPrivate(!isPrivate);
                            } else {
                              setPrivacySettings((prev: Record<string, boolean>) => ({ ...prev, [item.key]: !prev[item.key] }));
                            }
                          }}
                        />
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4 peer-checked:bg-[#12110f]" />
                      </label>
                    </div>
                  ))}
                  <button onClick={savePrivacy} disabled={saving} className="px-6 py-2.5 bg-[#FFD190] text-black font-bold rounded-[10px] hover:opacity-90 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Privacy Settings"}
                  </button>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-5">
                  {[
                    { key: "push_notifications", label: "Push notifications", desc: "Receive push notifications" },
                    { key: "email_notifications", label: "Email notifications", desc: "Receive email digests" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-white text-[14px] font-medium">{item.label}</p>
                        <p className="text-white/30 text-[12px] mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative w-10 h-6 rounded-full bg-white/[0.08] cursor-pointer transition-colors has-[:checked]:bg-[#FFD190]">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={(privacySettings as any)[item.key] ?? true}
                          onChange={() => {
                            setPrivacySettings((prev: Record<string, boolean>) => ({ ...prev, [item.key]: !prev[item.key] }));
                          }}
                        />
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-4 peer-checked:bg-[#12110f]" />
                      </label>
                    </div>
                  ))}
                  <button onClick={savePrivacy} disabled={saving} className="px-6 py-2.5 bg-[#FFD190] text-black font-bold rounded-[10px] hover:opacity-90 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Notification Settings"}
                  </button>
                </div>
              )}

              {activeSection === "appearance" && (
                <div className="space-y-5">
                  {[
                    { label: "Dark mode", desc: "Dark theme (currently only option)" },
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
                  <div className="p-4 rounded-[16px] border border-blue-500/20" style={{ backgroundColor: "rgba(59, 130, 246, 0.06)" }}>
                    <p className="text-blue-400 text-[14px] font-medium">Verification</p>
                    <p className="text-white/30 text-[12px] mt-1 mb-4">Request a verified badge for your profile.</p>
                    <button onClick={requestVerification} className="px-4 h-9 rounded-full bg-blue-500/20 text-blue-400 text-[13px] font-bold hover:bg-blue-500/30 transition-colors">
                      Request Verification
                    </button>
                  </div>

                  <div className="p-4 rounded-[16px] border border-red-500/20" style={{ backgroundColor: "rgba(239, 68, 68, 0.06)" }}>
                    <p className="text-red-400 text-[14px] font-medium">Danger Zone</p>
                    <p className="text-white/30 text-[12px] mt-1 mb-4">Permanently delete your account and all data.</p>
                    <button onClick={deleteAccount} className="px-4 h-9 rounded-full bg-red-500/20 text-red-400 text-[13px] font-bold hover:bg-red-500/30 transition-colors">
                      Delete Account
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
