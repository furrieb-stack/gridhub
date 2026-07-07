"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProfile, getStoredUser, type User, type UserProfile } from "@/lib/api";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import ProfileHeader from "@/components/ProfileHeader";
import Post from "@/components/Post";

const DEMO_PROFILES: Record<string, UserProfile> = {
  johndoe: {
    id: 1,
    username: "johndoe",
    display_name: "John Doe",
    avatar_url: null,
    banner_url: "https://picsum.photos/seed/banner1/1200/400",
    bio: "Full-stack developer. Building the future of social networks.\n⚡ Rust • Python • TypeScript\n📍 San Francisco",
    is_verified: true,
    follower_count: 1234,
    following_count: 567,
    post_count: 89,
    is_following: false,
    is_own_profile: false,
    created_at: "2023-06-15T00:00:00Z",
  },
  ann_dev: {
    id: 2,
    username: "ann_dev",
    display_name: "Ann Developer",
    avatar_url: null,
    banner_url: "https://picsum.photos/seed/banner2/1200/400",
    bio: "Python backend developer. FastAPI enthusiast. Open source contributor.",
    is_verified: false,
    follower_count: 456,
    following_count: 234,
    post_count: 45,
    is_following: true,
    is_own_profile: false,
    created_at: "2024-01-20T00:00:00Z",
  },
  rustacean: {
    id: 3,
    username: "rustacean",
    display_name: "Rust Dev",
    avatar_url: null,
    banner_url: null,
    bio: "Rustacean since 2018. Systems programming is art.",
    is_verified: false,
    follower_count: 789,
    following_count: 123,
    post_count: 234,
    is_following: false,
    is_own_profile: false,
    created_at: "2022-09-01T00:00:00Z",
  },
};

const DEMO_POSTS: Record<string, any[]> = {
  johndoe: [
    {
      author: { username: "johndoe", display_name: "John Doe", avatar_url: null, is_verified: true },
      content: "Just shipped a new feature! 🔥 The team crushed it this sprint. Feeling really proud of what we built together.",
      images: ["https://picsum.photos/seed/john1/640/360", "https://picsum.photos/seed/john2/640/360"],
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      upvotes: 342,
      comments_count: 28,
    },
    {
      author: { username: "johndoe", display_name: "John Doe", avatar_url: null, is_verified: true },
      content: "Hot take: Rust's type system is the closest thing to a formal proof you can get without writing a proof.",
      images: ["https://picsum.photos/seed/john3/640/360"],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      upvotes: 189,
      comments_count: 45,
    },
  ],
  ann_dev: [
    {
      author: { username: "ann_dev", display_name: "Ann Developer", avatar_url: null, is_verified: false },
      content: "New blog post: 10 FastAPI features you're probably not using ⚡",
      images: ["https://picsum.photos/seed/ann1/640/360"],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      upvotes: 67,
      comments_count: 12,
    },
  ],
  rustacean: [
    {
      author: { username: "rustacean", display_name: "Rust Dev", avatar_url: null, is_verified: false },
      content: "Been rewriting our Python microservice in Rust over the weekend... 10x performance improvement and zero memory leaks so far.",
      images: ["https://picsum.photos/seed/rust1/640/360"],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      upvotes: 567,
      comments_count: 43,
    },
  ],
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) router.replace("/login");
    else setUser(stored);
  }, [router]);

  useEffect(() => {
    if (!username) return;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchProfile(username);
        setProfile(data);
      } catch {
        const demo = DEMO_PROFILES[username];
        if (demo) {
          setProfile(demo);
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    }

    load();
  }, [username]);

  if (!user) return null;

  const posts = DEMO_POSTS[username] ?? [];

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: "#12110f" }}>
      <div className="hidden md:block">
        <Navbar />
      </div>

      <div className="md:ml-[250px] flex justify-center px-4 md:px-6 py-4 md:py-6">
        <div className="w-full max-w-[640px] space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
            </div>
          ) : profile ? (
            <>
              <ProfileHeader profile={profile} />

              <div className="flex border-b border-white/[0.06]">
                {["Posts", "Likes", "Media"].map((tab) => (
                  <button
                    key={tab}
                    className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
                      tab === "Posts"
                        ? "text-white border-b-2 border-[#FFD190]"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {posts.length > 0 ? (
                  posts.map((post, i) => <Post key={i} {...post} />)
                ) : (
                  <p className="text-center text-white/30 text-[15px] py-10">No posts yet</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <h2 className="text-[22px] font-bold text-white">User not found</h2>
              <p className="text-white/40 text-[15px]">
                @{username} doesn&apos;t exist
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="block md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
