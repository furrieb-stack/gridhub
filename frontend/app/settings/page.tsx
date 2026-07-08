"use client";

import { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";
import { getStoredUser, setStoredUser, mediaUrl, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

function SectionIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "currentColor" : "rgba(255,255,255,0.4)";
  const props = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "profile":
      return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case "privacy":
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case "notifications":
      return <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case "appearance":
      return <svg {...props}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
    case "account":
      return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    default:
      return null;
  }
}

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
      <div className="hidden md:block">
        <Navbar />
      </div>
      
      <main className="md:ml-[250px] min-h-screen flex justify-center px-4 md:px-8 py-6 md:py-10">
        <div className="w-full max-w-[760px]">
          <h1 className="text-[28px] font-black text-white mb-6 md:mb-8 tracking-tight">
            Settings
          </h1>

          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            {/* Sidebar Navigation */}
            <div className="flex md:flex-col gap-2 md:w-[220px] shrink-0 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-[15px] font-semibold text-left whitespace-nowrap transition-all duration-200 active:scale-[0.98] ${
                    activeSection === s.id
                      ? "text-[#12110f] bg-[#FFD190] shadow-[0_4px_20px_rgba(255,209,144,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <SectionIcon id={s.id} active={activeSection === s.id} />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {activeSection === "profile" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Banner & Avatar Section (FIXED CLIP) */}
                  <div className="relative mb-14">
                    {/* Banner (Only this cuts off content) */}
                    <div className="relative h-40 w-full rounded-[24px] overflow-hidden bg-white/5 border border-white/[0.08] shadow-sm group">
                      {user.banner_url ? (
                        <img src={mediaUrl(user.banner_url)} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#FFD190]/20 via-white/5 to-[#12110f]" />
                      )}
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                        <button onClick={() => bannerInput.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-white font-medium hover:bg-white/25 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          <span className="text-[14px]">Change Cover</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Avatar (Outside of hidden overflow) */}
                    <div className="absolute left-6 -bottom-10 z-10 group">
                      <div className="relative w-[96px] h-[96px] rounded-full border-[4px] border-[#12110f] bg-[#1a1a1a] overflow-hidden shadow-xl">
                        {user.avatar_url ? (
                          <img src={mediaUrl(user.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#FFD190] flex items-center justify-center font-bold text-[#12110f] text-[36px]">
                            {user.display_name?.charAt(0).toUpperCase() ?? user.username.charAt(0).toUpperCase()}
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
                    
                    <input type="file" hidden ref={avatarInput} onChange={(e) => uploadFile(e, "avatar")} accept="image/*" />
                    <input type="file" hidden ref={bannerInput} onChange={(e) => uploadFile(e, "banner")} accept="image/*" />
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Username</label>
                      <input
                        defaultValue={user.username}
                        readOnly
                        className="w-full h-12 px-4 rounded-[14px] bg-white/[0.02] border border-white/[0.04] text-white/40 text-[15px] outline-none cursor-not-allowed"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Display Name</label>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Add a display name"
                        className="w-full h-12 px-4 rounded-[14px] bg-white/[0.04] border border-white/[0.08] text-white text-[15px] outline-none focus:bg-white/[0.06] focus:border-[#FFD190]/60 focus:ring-1 focus:ring-[#FFD190]/30 transition-all placeholder:text-white/20"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-white/60 text-[13px] font-semibold uppercase tracking-wide ml-1">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        placeholder="Tell us about yourself"
                        className="w-full px-4 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.08] text-white text-[15px] outline-none resize-none focus:bg-white/[0.06] focus:border-[#FFD190]/60 focus:ring-1 focus:ring-[#FFD190]/30 transition-all placeholder:text-white/20"
                      />
                    </div>

                    <button 
                      onClick={saveProfile} 
                      disabled={saving} 
                      className="w-full md:w-auto mt-2 px-8 py-3.5 bg-[#FFD190] text-[#12110f] text-[14px] font-bold rounded-[14px] hover:bg-[#ffe3bc] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_rgba(255,209,144,0.15)]"
                    >
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-2">
                    {[
                      { key: "is_private", label: "Private account", desc: "Only followers can see your posts" },
                      { key: "show_activity", label: "Show activity status", desc: "Let others see when you're active" },
                      { key: "allow_mentions", label: "Allow mentions", desc: "Control who can mention you" },
                      { key: "allow_dms", label: "Allow direct messages", desc: "Receive messages from anyone" },
                    ].map((item, i, arr) => (
                      <div key={item.key} className={`flex items-center justify-between p-4 ${i !== arr.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                        <div className="pr-4">
                          <p className="text-white text-[15px] font-semibold">{item.label}</p>
                          <p className="text-white/40 text-[13px] mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={item.key === "is_private" ? isPrivate : (privacySettings as any)[item.key] ?? false}
                            onChange={() => {
                              if (item.key === "is_private") setIsPrivate(!isPrivate);
                              else setPrivacySettings((prev: Record<string, boolean>) => ({ ...prev, [item.key]: !prev[item.key] }));
                            }}
                          />
                          <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[24px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFD190] peer-checked:after:bg-[#12110f] peer-checked:after:border-none border border-white/5" />
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={savePrivacy} 
                    disabled={saving} 
                    className="w-full md:w-auto px-8 py-3.5 bg-[#FFD190] text-[#12110f] text-[14px] font-bold rounded-[14px] hover:bg-[#ffe3bc] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_rgba(255,209,144,0.15)]"
                  >
                    {saving ? "Saving..." : "Save Privacy Settings"}
                  </button>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-2">
                    {[
                      { key: "push_notifications", label: "Push notifications", desc: "Receive real-time alerts on this device" },
                      { key: "email_notifications", label: "Email notifications", desc: "Receive updates and digests via email" },
                    ].map((item, i, arr) => (
                      <div key={item.key} className={`flex items-center justify-between p-4 ${i !== arr.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                        <div className="pr-4">
                          <p className="text-white text-[15px] font-semibold">{item.label}</p>
                          <p className="text-white/40 text-[13px] mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={(privacySettings as any)[item.key] ?? true}
                            onChange={() => {
                              setPrivacySettings((prev: Record<string, boolean>) => ({ ...prev, [item.key]: !prev[item.key] }));
                            }}
                          />
                          <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[24px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFD190] peer-checked:after:bg-[#12110f] peer-checked:after:border-none border border-white/5" />
                        </label>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={savePrivacy} 
                    disabled={saving} 
                    className="w-full md:w-auto px-8 py-3.5 bg-[#FFD190] text-[#12110f] text-[14px] font-bold rounded-[14px] hover:bg-[#ffe3bc] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_rgba(255,209,144,0.15)]"
                  >
                    {saving ? "Saving..." : "Save Notifications"}
                  </button>
                </div>
              )}

              {activeSection === "appearance" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-2">
                    {[
                      { label: "Dark mode", desc: "Dark theme is currently the only available option" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4">
                        <div className="pr-4">
                          <p className="text-white text-[15px] font-semibold">{item.label}</p>
                          <p className="text-white/40 text-[13px] mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-not-allowed opacity-80 shrink-0">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.label === "Dark mode"} disabled />
                          <div className="w-12 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-[24px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFD190] peer-checked:after:bg-[#12110f] peer-checked:after:border-none border border-white/5" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "account" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Verification Card */}
                  <div className="p-6 rounded-[24px] bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                    <div className="relative z-10">
                      <h3 className="text-blue-400 text-[18px] font-bold flex items-center gap-2">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Get Verified
                      </h3>
                      <p className="text-white/60 text-[14px] mt-2 mb-6 max-w-sm leading-relaxed">
                        Request a verified badge to show authenticity and stand out in the community.
                      </p>
                      <button 
                        onClick={requestVerification} 
                        className="px-6 py-3 rounded-[14px] bg-blue-500/20 text-blue-400 text-[14px] font-bold hover:bg-blue-500/30 transition-all active:scale-[0.98]"
                      >
                        Request Verification
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone Card */}
                  <div className="p-6 rounded-[24px] bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-500/20 blur-3xl rounded-full" />
                    <div className="relative z-10">
                      <h3 className="text-red-400 text-[18px] font-bold">Danger Zone</h3>
                      <p className="text-white/60 text-[14px] mt-2 mb-6 max-w-sm leading-relaxed">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button 
                        onClick={deleteAccount} 
                        className="px-6 py-3 rounded-[14px] bg-red-500/10 border border-red-500/30 text-red-400 text-[14px] font-bold hover:bg-red-500/20 transition-all active:scale-[0.98]"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <div className="block md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}