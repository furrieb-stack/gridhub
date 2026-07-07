"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex h-screen flex-col items-center justify-center p-4 overflow-hidden" style={{ backgroundColor: "#121212" }}>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 rounded-full pointer-events-none"
        style={{ width: 420, height: 420, background: "#FFD190", filter: "blur(250px)", opacity: 0.15 }}
      />
      <div className="noise-overlay" />
      <div className="flex items-center gap-2 mb-6">
        <Image src="/favicon.svg" alt="Gridhub" width={32} height={32} />
        <span className="text-[28px] font-bold tracking-tight">
          <span className="text-[#FFD190]">Grid</span>
          <span className="text-white">hub</span>
        </span>
      </div>
      <h1 className="text-[72px] font-bold text-white/10 select-none" style={{ lineHeight: 1 }}>404</h1>
      <p className="text-white/40 text-[15px] mt-4 mb-8">This page doesn&apos;t exist</p>
      <button
        onClick={() => router.push("/feed")}
        className="px-6 h-11 rounded-full bg-[#FFD190] text-[#12110f] text-[14px] font-bold hover:bg-[#ffe3bc] transition-all active:scale-[.97]"
      >
        Back to feed
      </button>
    </div>
  );
}
