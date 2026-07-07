"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const currentSrc = images[index];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [index]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  const goNext = useCallback(() => {
    if (index < images.length - 1) setIndex((i) => i + 1);
  }, [index, images.length]);

  const goPrev = useCallback(() => {
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
  }, [goNext, goPrev]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setScale((prev) => {
      const next = prev - e.deltaY * 0.002;
      return Math.min(Math.max(next, 0.5), 5);
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (scale <= 1) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center select-none"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(16px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={`transition-all duration-200 ease-out ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <div
          className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-[16px]"
          onWheel={handleWheel}
        >
          <img
            ref={imgRef}
            src={currentSrc}
            alt=""
            draggable={false}
            className="block w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-75 cursor-grab"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? "grabbing" : "grab",
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              if (scale > 1) resetZoom();
              else {
                const rect = imgRef.current!.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                setScale(2);
                setPosition({
                  x: -(x - 0.5) * rect.width * 2 + (x - 0.5) * rect.width,
                  y: -(y - 0.5) * rect.height * 2 + (y - 0.5) * rect.height,
                });
              }
            }}
          />
        </div>
      </div>

      <button
        onClick={handleClose}
        className="fixed top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all z-10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {scale !== 1 && (
        <button
          onClick={resetZoom}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[13px] font-medium text-white/80 bg-white/10 hover:bg-white/15 transition-all"
        >
          Reset zoom
        </button>
      )}

      {images.length > 1 && (
        <>
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={goPrev}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <div className="px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-[13px] font-medium">
              {index + 1} / {images.length}
            </div>

            {index < images.length - 1 && (
              <button
                onClick={goNext}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>

          {index > 0 && (
            <button
              onClick={goPrev}
              className="fixed left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {index < images.length - 1 && (
            <button
              onClick={goNext}
              className="fixed right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}
