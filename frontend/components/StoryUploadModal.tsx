"use client";

import { useState, useRef, useEffect } from "react";
import { uploadStory } from "@/lib/api";
import ImageCropperModal from "@/components/ImageCropperModal";

interface StoryUploadModalProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

export default function StoryUploadModal({ onClose, onStoryCreated }: StoryUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(() => {
      onClose();
      if (preview) URL.revokeObjectURL(preview);
    }, 300);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setRawFile(file);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCropped(blob: Blob) {
    setCropImage(null);
    setRawFile(null);
    const objectUrl = URL.createObjectURL(blob);
    setPreview(objectUrl);
    setUploading(true);
    setError("");

    try {
      const isVideo = blob.type.startsWith("video/");
      const ext = isVideo ? "mp4" : "jpg";
      const storyFile = new File([blob], `story.${ext}`, { type: blob.type || "image/jpeg" });
      await uploadStory(storyFile);
      onStoryCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
      setPreview(null);
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
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={!uploading ? handleClose : undefined} 
      />

      <div
        className={`relative w-full md:w-full md:max-w-[400px] bg-[#1a1a1a] rounded-t-[32px] md:rounded-[24px] shadow-2xl flex flex-col transition-all duration-300 cubic-bezier(0.32, 0.72, 0, 1) ${
          visible ? "translate-y-0 scale-100" : "translate-y-full md:translate-y-8 md:scale-95"
        }`}
      >
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        <div className="px-6 pt-2 md:pt-6 pb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-[20px] font-bold tracking-tight">Add to Story</h2>
            <button 
              onClick={handleClose} 
              disabled={uploading}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-[12px] bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFilePick} />
            <button
              onClick={pickFile}
              disabled={uploading}
              className="relative w-full aspect-[4/5] max-h-[360px] rounded-[20px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-[#FFD190]/50 hover:bg-white/[0.02] transition-all overflow-hidden group cursor-pointer"
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-[#FFD190] animate-spin" />
                    <span className="text-white font-semibold text-[14px] drop-shadow-md">Uploading...</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-[15px] font-semibold">Tap to browse</p>
                    <p className="text-white/40 text-[13px] mt-1">Photo</p>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {cropImage && (
        <ImageCropperModal
          image={cropImage}
          aspect={9 / 16}
          onCrop={handleCropped}
          onClose={() => { setCropImage(null); setRawFile(null); }}
        />
      )}
    </div>
  );
}