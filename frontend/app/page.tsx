"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      router.replace("/feed");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
