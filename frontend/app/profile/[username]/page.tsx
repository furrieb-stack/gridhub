"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getStoredUser, type User } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Post from "@/components/Post";

const DEMO_PROFILE = {
  username: "aria_digital",
  display_name: "Aria Sterling",
  avatar_url: "https://picsum.photos/seed/aria/200/200",
  banner_url: "https://picsum.photos/seed/ariabanner/1600/400",
  bio: "Digital minimalist and visual storyteller. Exploring the intersection of human connection and atmospheric design. Curator of quiet spaces in a loud world. ✨",
  is_verified: true,
  follower_count: "12.8k",
  following_count: "412",
  karma: "4.5k",
  location: "San Francisco, CA",
  website: "ariasterling.com",
  joined: "Oct 2023",
};

const DEMO_POSTS = [
  {
    author: { username: "aria_digital", display_name: "Aria Sterling", avatar_url: null, is_verified: true },
    content: "Just captured the last light of the day. There's something truly ethereal about how shadows behave at twilight. The world feels like it's holding its breath.",
    images: ["https://picsum.photos/seed/ariapost/640/360"],
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    upvotes: 842,
    comments_count: 56,
  }
];

const TOP_MEDIA = [
  "https://picsum.photos/seed/media1/300/300",
  "https://picsum.photos/seed/media2/300/300",
  "https://picsum.photos/seed/media3/300/300",
  "https://picsum.photos/seed/media4/300/300",
];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Posts");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    if (username) {
      setTimeout(() => setLoading(false), 500);
    }
  }, [username]);

  if (!user) return null;
  const isDemo = username === "aria_digital";

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-[#12110f]">
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="md:ml-[250px] min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
          </div>
        ) : isDemo ? (
          <div className="w-full flex flex-col">
            <div className="relative w-full h-[280px] md:h-[340px]">
              <Image 
                src={DEMO_PROFILE.banner_url} 
                alt="Banner" 
                fill 
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12110f] via-[#12110f]/40 to-transparent" />
            </div>

            <div className="max-w-[960px] mx-auto w-full px-4 md:px-8">
              <div className="relative flex justify-between items-end -mt-16 md:-mt-20 z-10 mb-5">
                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#12110f] overflow-hidden bg-white/10 relative">
                    <Image src={DEMO_PROFILE.avatar_url} alt="Avatar" fill sizes="128px" className="object-cover" />
                  </div>
                  {DEMO_PROFILE.is_verified && (
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-6 h-6 rounded-full bg-[#FFD190] border-2 border-[#12110f] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#12110f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pb-2">
                  <button className="px-5 py-2 rounded-full bg-white/[0.06] text-white text-[14px] font-bold hover:bg-white/[0.1] transition-colors">
                    Edit Profile
                  </button>
                  <button className="px-6 py-2 rounded-full bg-[#FFD190] text-[#12110f] text-[14px] font-bold hover:bg-[#ffe3bc] transition-colors shadow-lg">
                    Follow
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="flex-1 max-w-[600px]">
                  <h1 className="text-[28px] font-bold text-white tracking-tight">
                    {DEMO_PROFILE.display_name}
                  </h1>
                  <p className="text-white/40 text-[15px] mb-4">@{DEMO_PROFILE.username}</p>
                  <p className="text-white/80 text-[15px] leading-relaxed mb-5">
                    {DEMO_PROFILE.bio}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-white/50 font-medium">
                    <div className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {DEMO_PROFILE.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <a href={`https://${DEMO_PROFILE.website}`} className="text-[#FFD190] hover:underline">
                        {DEMO_PROFILE.website}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Joined {DEMO_PROFILE.joined}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 md:px-4 py-2 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-bold text-white">{DEMO_PROFILE.follower_count}</span>
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase mt-1">Followers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-bold text-white">{DEMO_PROFILE.following_count}</span>
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase mt-1">Following</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[20px] font-bold text-[#FFD190]">{DEMO_PROFILE.karma}</span>
                    <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase mt-1">Karma</span>
                  </div>
                </div>
              </div>

              <div className="flex border-b border-white/[0.06] mb-6">
                {["Posts", "Comments", "Saved"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-6 text-[14px] font-bold transition-all relative ${
                      activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#FFD190]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-10">
                <div className="flex flex-col gap-4">
                  {DEMO_POSTS.map((post, i) => (
                    <Post key={i} {...post} />
                  ))}
                </div>

                <div className="hidden lg:block">
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-[24px] p-5">
                    <h3 className="text-white text-[16px] font-bold mb-4 tracking-wide">Top Media</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {TOP_MEDIA.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-[14px] overflow-hidden group cursor-pointer">
                          <Image src={url} alt="" fill sizes="150px" className="object-cover transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <h2 className="text-[24px] font-bold text-white">User not found</h2>
            <p className="text-white/40 text-[15px]">@{username} doesn&apos;t exist on Gridhub</p>
          </div>
        )}
      </main>

      <div className="block md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}