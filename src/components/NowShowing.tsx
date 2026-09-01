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
import type { MovieWithShows } from "@/lib/db";
import { MovieCardClient } from "./MovieCardClient";

interface NowShowingProps {
  locale: string;
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
          <div className={`grid gap-8 w-full ${
            schedule.length === 1 ? 'grid-cols-1' :
            schedule.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            schedule.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {schedule.map((movie, index) => (
              <MovieCardClient
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
