"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";

interface ImageCropperModalProps {
  image: string;
  aspect: number;
  circularCrop?: boolean;
  onCrop: (blob: Blob) => void;
  onClose: () => void;
}

export default function ImageCropperModal({ image, aspect, circularCrop, onCrop, onClose }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);

    try {
      const imageElement = document.createElement("img");
      imageElement.src = image;
      await new Promise((resolve) => { imageElement.onload = resolve; });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        imageElement,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
      );

      onCrop(blob);
    } catch (err) {
      console.error("Cropping failed", err);
    } finally {
      setProcessing(false);
    }
  }, [image, croppedAreaPixels, onCrop]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-[24px] w-full max-w-[500px] mx-4 overflow-hidden border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white text-[17px] font-bold">Crop Image</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-[14px] font-medium">
            Cancel
          </button>
        </div>

        <div className="relative w-full" style={{ height: 400 }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circularCrop ? "round" : "rect"}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#FFD190]"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M16 12H8" />
            </svg>
          </div>

          <button
            onClick={createCroppedImage}
            disabled={processing}
            className="w-full py-3 rounded-[14px] bg-[#FFD190] text-[#12110f] text-[15px] font-bold hover:bg-[#ffe3bc] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? "Processing..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
