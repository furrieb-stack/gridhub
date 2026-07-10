"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 inset-x-0 mx-auto z-[9999] flex flex-col items-center gap-2.5 pointer-events-none w-[90%] max-w-[360px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-full backdrop-blur-[32px] saturate-[150%] bg-[#FFFFFF]/[0.06] border border-[#FFF1E1]/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.5)] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <div className="flex shrink-0 items-center justify-center w-5 h-5 rounded-full">
              {t.type === "success" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD190" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {t.type === "error" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {t.type === "info" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <span className="text-[13px] font-semibold tracking-wide text-white/90 truncate flex-1">
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}