"use client";

import { useState, useRef, useEffect } from "react";
import { uploadStory, createStoryFromUrl } from "@/lib/api";

interface StoryUploadModalProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

export default function StoryUploadModal({ onClose, onStoryCreated }: StoryUploadModalProps) {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");
  const [urlType, setUrlType] = useState("image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadStory(file);
      onStoryCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    }
    setUploading(false);
  }

  async function handleUrlSubmit() {
    if (!url.trim()) return;
    setUploading(true);
    setError("");
    try {
      await createStoryFromUrl(url.trim(), urlType);
      onStoryCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to create story");
    }
    setUploading(false);
  }

  function pickFile() {
    fileRef.current?.click();
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={`relative w-full md:max-w-sm bg-[#1a1a1a] rounded-t-[24px] md:rounded-[24px] p-6 transition-all duration-300 ${
          visible ? "translate-y-0" : "translate-y-full md:translate-y-4 md:scale-95"
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-[18px] font-bold">Add to story</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("file")}
            className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors ${
              tab === "file" ? "bg-[#FFD190] text-[#12110f]" : "text-white/50 bg-white/5"
            }`}
          >
            Upload file
          </button>
          <button
            onClick={() => setTab("url")}
            className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors ${
              tab === "url" ? "bg-[#FFD190] text-[#12110f]" : "text-white/50 bg-white/5"
            }`}
          >
            Link from web
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-[13px] mb-3">{error}</p>
        )}

        {tab === "file" ? (
          <div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
            <button
              onClick={pickFile}
              disabled={uploading}
              className="w-full h-32 rounded-[16px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-[#FFD190]/50 hover:bg-white/5 transition-colors cursor-pointer"
            >
              {uploading ? (
                <div className="w-8 h-8 rounded-full border-2 border-[#FFD190] border-t-transparent animate-spin" />
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-white/40 text-[13px]">Tap to select photo or video</span>
                </>
              )}
            </button>
            {preview && (
              <div className="mt-3 rounded-[12px] overflow-hidden max-h-48">
                <img src={preview} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setUrlType("image")}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                  urlType === "image" ? "bg-white/15 text-white" : "text-white/40 bg-white/5"
                }`}
              >
                Image
              </button>
              <button
                onClick={() => setUrlType("video")}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                  urlType === "video" ? "bg-white/15 text-white" : "text-white/40 bg-white/5"
                }`}
              >
                Video
              </button>
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste image or video URL..."
              className="w-full h-11 px-4 rounded-[12px] text-white text-[14px] outline-none placeholder:text-white/25 bg-white/5 border border-white/10 focus:border-[#FFD190]/50 transition-colors"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={uploading || !url.trim()}
              className="w-full h-11 mt-3 rounded-[12px] bg-[#FFD190] text-[#12110f] text-[14px] font-bold hover:bg-[#ffe3bc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? "Adding..." : "Add to story"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
