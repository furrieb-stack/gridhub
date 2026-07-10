"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BannedPage() {
  const router = useRouter();
  const [reason, setReason] = useState("");

  useEffect(() => {
    const r = sessionStorage.getItem("ban_reason") || "Violation of community guidelines";
    setReason(r);
    document.title = "Banned | Gridhub";
  }, []);

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#12110f" }}>
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">You Have Been Banned</h1>
        <p className="text-white/50 text-[15px] mb-6">Your account has been suspended by an administrator.</p>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 mb-8 text-left">
          <p className="text-white/30 text-[12px] font-semibold uppercase tracking-wider mb-2">Reason</p>
          <p className="text-white/80 text-[15px]">{reason}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-full bg-white/5 text-white font-bold text-[15px] hover:bg-white/10 transition-colors border border-white/10"
        >
          Log out
        </button>
      </div>
    </div>
  );
}