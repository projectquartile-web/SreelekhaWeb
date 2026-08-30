"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";
import AnimatedReveal from "./AnimatedReveal";
import { YouTubeThumbnail, YouTubeModal } from "./YouTubePlayer";
import type { MovieWithShows } from "@/lib/db";

const FALLBACK_GRADIENTS = [
  "from-slate-900 via-neutral-900 to-black",
  "from-blue-950 via-slate-950 to-black",
  "from-zinc-900 via-neutral-900 to-black",
  "from-neutral-950 via-slate-900 to-black",
];

interface MovieCardClientProps {
  movie: MovieWithShows;
  index: number;
  timingsLabel: string;
}

export function MovieCardClient({ movie, index, timingsLabel }: MovieCardClientProps) {
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AnimatedReveal delay={index * 0.15} yOffset={30}>
      <div className="group bg-[#F8FAFC] border border-neutral-200/60 rounded-sm overflow-hidden flex flex-col h-full hover:border-[#2563EB]/40 hover:shadow-xl hover:shadow-neutral-200/80 transition-all duration-500">
        
        {/* ── Poster / Title Area ── */}
        <div
          className={`relative aspect-[2/3] w-full flex flex-col justify-center items-center overflow-hidden border-b border-neutral-800 ${
            movie.youtube_trailer_id ? "cursor-pointer" : ""
          } ${!movie.youtube_trailer_id ? `bg-gradient-to-br ${gradient} p-6` : ""}`}
          onClick={() => {
            if (movie.youtube_trailer_id) setIsModalOpen(true);
          }}
        >
          {movie.youtube_trailer_id ? (
            <div className="absolute inset-0 w-full h-full">
              <YouTubeThumbnail 
                videoId={movie.youtube_trailer_id} 
                alt={`${movie.name} Trailer`}
              />
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#2563EB] group-hover:border-[#2563EB] transition-all duration-500">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-light text-white tracking-wide uppercase line-clamp-3 leading-snug text-center">
                {movie.name}
              </span>
            </>
          )}
        </div>

        {/* Trailer Modal */}
        <YouTubeModal 
          videoId={movie.youtube_trailer_id || null}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        {/* ── Details Area ── */}
        <div className="p-5 flex flex-col flex-grow">
          <h4 className="text-base font-light text-neutral-900 group-hover:text-[#2563EB] transition-colors duration-300 mb-4 leading-snug">
            {movie.name}
          </h4>

          <div>
            <span className="text-[10px] tracking-[0.15em] text-neutral-400 uppercase block mb-2">
              {timingsLabel}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {movie.shows.map((show, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-white text-neutral-700 border border-neutral-200/80 px-2 py-1 rounded-sm font-mono shadow-sm"
                >
                  {show.show_time}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AnimatedReveal>
  );
}
