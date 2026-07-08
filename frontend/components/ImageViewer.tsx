"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { mediaUrl } from "@/lib/api";

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const currentSrc = images[index];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [index]);

  const handleClose = useCallback(() => {
    setVisible(false);
    document.body.style.overflow = "";
    setTimeout(onClose, 300);
  }, [onClose]);

  const goNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (index < images.length - 1) setIndex((i) => i + 1);
  }, [index, images.length]);

  const goPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, handleClose]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((prev) => {
      const next = prev - e.deltaY * 0.005;
      return Math.min(Math.max(next, 1), 1.8);
    });
  }

  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.2, 1.8));
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.2, 1));
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    dragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    hasDragged.current = true;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({ x: posStart.current.x + dx, y: posStart.current.y + dy });
  }

  function handleMouseUp() {
    dragging.current = false;
  }

  function resetZoom() {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  function handleBackgroundClick() {
    if (!hasDragged.current) {
      handleClose();
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center select-none transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div 
        className="absolute inset-0 bg-[#12110f]/95 backdrop-blur-2xl cursor-pointer" 
        onClick={handleBackgroundClick} 
      />

      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#12110f]/80 to-transparent pointer-events-none z-20 flex items-start justify-between px-6 pt-6">
        <div className="pointer-events-auto">
          {images.length > 1 && (
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold text-[14px] tracking-wide shadow-lg">
              {index + 1} / {images.length}
            </div>
          )}
        </div>
        
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={handleClose}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-[#FFD190] hover:text-[#12110f] text-white/80 transition-all duration-200 border border-white/10 shadow-lg"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`relative z-10 w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-300 ease-out ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <div
          className="relative max-w-[95vw] max-h-[95vh] pointer-events-auto"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imgRef}
            src={mediaUrl(currentSrc)}
            alt=""
            draggable={false}
            className={`block w-auto h-auto max-w-[95vw] max-h-[85vh] object-contain ${
              scale === 1 ? "transition-transform duration-300" : ""
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (dragging.current ? "grabbing" : "grab") : "zoom-in",
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              if (scale > 1) {
                resetZoom();
              } else {
                setScale(1.8);
              }
            }}
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="absolute inset-y-0 inset-x-4 pointer-events-none flex items-center justify-between z-20">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-[#FFD190] hover:text-[#12110f] hover:border-[#FFD190] disabled:opacity-0 transition-all duration-200 shadow-xl"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={goNext}
            disabled={index === images.length - 1}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-[#FFD190] hover:text-[#12110f] hover:border-[#FFD190] disabled:opacity-0 transition-all duration-200 shadow-xl"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/10 backdrop-blur-xl px-2 py-2 rounded-full border border-white/10 shadow-2xl">
        <button
          onClick={zoomOut}
          disabled={scale <= 1}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className="w-14 text-center text-white font-bold text-[14px]">
          {Math.round(scale * 100)}%
        </div>

        <button
          onClick={zoomIn}
          disabled={scale >= 1.8}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {scale !== 1 && (
          <>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button
              onClick={resetZoom}
              className="px-4 py-2 rounded-full text-[13px] font-bold text-[#12110f] bg-[#FFD190] hover:bg-[#ffe3bc] transition-all active:scale-95"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}