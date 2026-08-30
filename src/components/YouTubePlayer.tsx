"use client";

import React, { useState, useEffect } from "react";
import { X, Play } from "lucide-react";

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
  if (!isOpen || !videoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:top-4 sm:-right-12 md:-right-16 text-white/70 hover:text-white transition-colors p-2"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full absolute inset-0"
        ></iframe>
      </div>
    </div>
  );
}
