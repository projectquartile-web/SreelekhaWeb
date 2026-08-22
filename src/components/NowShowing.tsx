/**
 * NowShowing — Server Component
 *
 * Reads today's movies and showtimes from the "Shows" Google Sheet
 * (columns: Movie Name | Show Time) via the server-side data layer.
 *
 * Staff only enter a movie name and a time in the sheet.
 * No dates, IDs, or active flags are required.
 *
 * This component never runs in the browser and never exposes credentials.
 */

import React from "react";
import { getTranslations } from "next-intl/server";
import SectionHeading from "./SectionHeading";
import AnimatedReveal from "./AnimatedReveal";
import { getSchedule } from "@/lib/db";
import { Play } from "lucide-react";
import type { MovieWithShows } from "@/lib/db";

interface NowShowingProps {
  locale: string;
}

const FALLBACK_GRADIENTS = [
  "from-slate-900 via-neutral-900 to-black",
  "from-blue-950 via-slate-950 to-black",
  "from-zinc-900 via-neutral-900 to-black",
  "from-neutral-950 via-slate-900 to-black",
];

interface MovieCardProps {
  movie: MovieWithShows;
  index: number;
  timingsLabel: string;
}

function MovieCard({ movie, index, timingsLabel }: MovieCardProps) {
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

  return (
    <AnimatedReveal delay={index * 0.15} yOffset={30}>
      <div className="group bg-[#F8FAFC] border border-neutral-200/60 rounded-sm overflow-hidden flex flex-col h-full hover:border-[#2563EB]/40 hover:shadow-xl hover:shadow-neutral-200/80 transition-all duration-500">

        {/* ── Poster / Title Area ── */}
        <div
          className={`relative aspect-[2/3] w-full bg-gradient-to-br ${gradient} flex flex-col justify-center items-center p-6 border-b border-neutral-800`}
        >
          <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#2563EB] group-hover:border-[#2563EB] transition-all duration-500">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-xl font-light text-white tracking-wide uppercase line-clamp-3 leading-snug text-center">
            {movie.name}
          </span>
        </div>

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

export default async function NowShowing({ locale }: NowShowingProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  let schedule: MovieWithShows[] = [];
  try {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    
    schedule = await getSchedule(today);
  } catch (err) {
    // Log server-side; render gracefully with an empty state
    console.error("[NowShowing] Failed to fetch from D1 database:", err);
  }

  return (
    <section id="now-showing" className="py-24 md:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading
          title={t("movies.title")}
          subtitle={t("movies.subtitle")}
        />

        {/* Live banner */}
        <AnimatedReveal yOffset={15} className="mb-12">
          <div className="w-full bg-[#F8FAFC] border border-neutral-200/60 p-6 md:p-8 rounded-sm flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span className="text-sm font-semibold tracking-[0.2em] text-neutral-900 uppercase">
                {t("movies.activeBanner")}
              </span>
            </div>
          </div>
        </AnimatedReveal>

        {/* Movie grid or empty state */}
        {schedule.length === 0 ? (
          <AnimatedReveal yOffset={20}>
            <p className="text-center text-neutral-500 text-sm py-16">
              {t("movies.noMovies")}
            </p>
          </AnimatedReveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {schedule.map((movie, index) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                index={index}
                timingsLabel={t("movies.timingsLabel")}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
