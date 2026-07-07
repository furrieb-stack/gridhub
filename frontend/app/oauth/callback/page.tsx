"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveTokens, type User } from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const userRaw = params.get("user");

    if (accessToken && refreshToken && userRaw) {
      try {
        const user: User = JSON.parse(decodeURIComponent(userRaw));
        saveTokens(accessToken, refreshToken, user);
        router.replace("/feed");
      } catch {
        router.replace("/login?error=Failed to parse user data");
      }
    } else {
      router.replace("/login?error=Missing OAuth parameters");
    }
  }, [params, router]);

  return (
    <p className="text-muted text-[15px]">Completing sign in...</p>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Suspense fallback={<p className="text-muted text-[15px]">Loading...</p>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
