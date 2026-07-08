"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mediaUrl } from "@/lib/api";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import FollowButton from "@/components/FollowButton";
import type { UserProfile } from "@/lib/api";

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);

  const joined = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-[24px] border overflow-hidden"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(255, 255, 255, 0.04)",
      }}
    >
      <div className="relative w-full h-48 md:h-64 bg-white/5 overflow-hidden">
        {profile.banner_url && !imgErr ? (
          <img
            src={mediaUrl(profile.banner_url)}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#FFD190]/20 via-purple-500/20 to-blue-500/20" />
        )}
      </div>

      <div className="px-5 md:px-8 pb-6">
        <div className="flex items-end justify-between -mt-12 md:-mt-16 mb-4">
          <div className="relative inline-block shrink-0">
            <div className="rounded-full border-4 border-[#12110f] bg-[#12110f] overflow-hidden">
              <Avatar
                src={profile.avatar_url}
                username={profile.username}
                displayName={profile.display_name}
                size={80}
              />
            </div>
            {profile.is_verified && (
              <VerifiedBadge
                size={26}
                className="absolute bottom-0 right-0 border-[3px] border-[#12110f]"
              />
            )}
          </div>

          {!profile.is_own_profile && (
            <div className="mb-1 md:mb-3">
              <FollowButton userId={profile.id} isFollowing={profile.is_following} />
            </div>
          )}
          {profile.is_own_profile && (
            <button
              onClick={() => router.push("/settings")}
              className="mb-1 md:mb-3 px-4 h-8 rounded-full border border-white/15 text-white/70 text-[13px] font-medium hover:bg-white/5 transition-all"
            >
              Edit profile
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-bold text-white">
                {profile.display_name ?? profile.username}
              </h1>
            </div>
            <p className="text-[15px] text-white/40">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-[15px] text-white/70 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-1 text-[14px] text-white/40">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
            <span>Joined {joined}</span>
          </div>

          <div className="flex items-center gap-5 text-[15px]">
            <button className="flex items-center gap-1.5 group">
              <span className="font-bold text-white">{profile.following_count}</span>
              <span className="text-white/40 group-hover:text-white/60 transition-colors">Following</span>
            </button>
            <button className="flex items-center gap-1.5 group">
              <span className="font-bold text-white">{profile.follower_count}</span>
              <span className="text-white/40 group-hover:text-white/60 transition-colors">Followers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
