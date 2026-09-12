"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play } from "lucide-react";

interface YouTubeThumbnailProps {
  videoId: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function YouTubeThumbnail({ videoId, alt, className = "", onClick }: YouTubeThumbnailProps) {
  const [imgSrc, setImgSrc] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  const [hasError, setHasError] = useState(false);
  const [triedHq, setTriedHq] = useState(false);

  useEffect(() => {
    // Reset state if videoId changes
    setImgSrc(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    setHasError(false);
    setTriedHq(false);
  }, [videoId]);

  const handleError = () => {
    if (!triedHq) {
      setTriedHq(true);
      setImgSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div 
        className={`bg-neutral-900 flex items-center justify-center text-neutral-500 cursor-pointer ${className}`}
        onClick={onClick}
      >
        <div className="flex flex-col items-center">
          <Play className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs uppercase tracking-wider">Play Trailer</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group cursor-pointer overflow-hidden bg-black ${className}`} onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-[#D90429] group-hover:border-[#D90429] transition-all duration-300">
          <Play className="w-5 h-5 text-white fill-white ml-1" />
        </div>
      </div>
    </div>
  );
}

interface YouTubeModalProps {
  videoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function YouTubeModal({ videoId, isOpen, onClose }: YouTubeModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !videoId) return null;

  return (
    /* Backdrop — the entire dark area around the player is the dismiss target */
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8 cursor-pointer"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Close trailer"
    >
      {/* Player container — stop propagation so normal YouTube clicks don't close */}
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── YouTube iframe ── */}
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="YouTube trailer player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Subtle dismiss hint */}
      <p className="mt-4 text-white/30 text-xs tracking-widest uppercase select-none pointer-events-none">
        Tap outside to close
      </p>
    </div>
  );
}
