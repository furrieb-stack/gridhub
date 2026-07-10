"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";

export default function ProfileRoot() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      router.replace(`/@${user.username}`);
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}