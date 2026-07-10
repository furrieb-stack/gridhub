"use client";

import { useEffect, useState } from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onCancel, 300);
  }

  function handleConfirm() {
    setVisible(false);
    setTimeout(onConfirm, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${
        visible ? "bg-black/60 backdrop-blur-sm opacity-100" : "bg-transparent backdrop-blur-none opacity-0"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-[400px] bg-[#1a1a1a] border border-white/[0.08] rounded-[24px] shadow-2xl p-6 flex flex-col gap-4 m-4"
        style={{
          transform: visible ? "scale(1)" : "scale(0.95)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div>
          <h2 className="text-[20px] font-bold text-white mb-2">{title}</h2>
          <p className="text-[15px] text-white/60 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center gap-3 mt-2 justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-colors text-[14px] font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 rounded-full text-[#12110f] text-[14px] font-bold shadow-lg active:scale-95 transition-all ${
              danger
                ? "bg-red-400 hover:bg-red-500 shadow-red-400/20"
                : "bg-[#FFD190] hover:bg-[#ffe3bc] shadow-[#FFD190]/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
