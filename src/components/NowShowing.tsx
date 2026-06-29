"use client";

import React from "react";
import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading";
import AnimatedReveal from "./AnimatedReveal";
import { moviesData } from "@/data/movies";
import { Clock, Play, Calendar } from "lucide-react";

export default function NowShowing() {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  return (
    <section id="now-showing" className="py-24 md:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading title={t("movies.title")} subtitle={t("movies.subtitle")} />

        {/* Banner */}
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

        {/* Movie Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {moviesData.map((movie, index) => {
            const fallbackGradients = [
              "from-slate-900 via-neutral-900 to-black",
              "from-blue-950 via-slate-950 to-black",
              "from-zinc-900 via-neutral-900 to-black",
              "from-neutral-950 via-slate-900 to-black",
            ];
            const gradient = fallbackGradients[index % fallbackGradients.length];

            return (
              <AnimatedReveal key={movie.id} delay={index * 0.15} yOffset={30}>
                <div className="group bg-[#F8FAFC] border border-neutral-200/60 rounded-sm overflow-hidden flex flex-col h-full hover:border-[#2563EB]/40 hover:shadow-xl hover:shadow-neutral-200/80 transition-all duration-500">
                  {/* Poster Area (keeps dark visual contrast for the cinema feeling) */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900 flex items-center justify-center">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col justify-between p-6 border-b border-neutral-800`}>
                      <div className="w-full flex justify-between items-start">
                        <span className="text-[9px] tracking-widest text-[#2563EB] uppercase font-semibold border border-[#2563EB]/40 bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
                          4K UHD
                        </span>
                        <div className="flex items-center gap-1 text-white/50 text-[10px]">
                          <Clock className="w-3 h-3 text-[#2563EB]" />
                          <span>{movie.duration}</span>
                        </div>
                      </div>
                      
                      <div className="my-auto text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#2563EB] group-hover:border-[#2563EB] transition-all duration-500">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                        <span className="text-xl font-light text-white tracking-wide uppercase line-clamp-2">
                          {t(movie.titleKey)}
                        </span>
                      </div>

                      <div className="text-[10px] tracking-wider text-neutral-400 uppercase border-t border-neutral-800/40 pt-4 text-center">
                        {t(movie.genreKey)}
                      </div>
                    </div>
                  </div>

                  {/* Details Area */}
                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <h4 className="text-lg font-light text-neutral-900 group-hover:text-[#2563EB] transition-colors duration-300 mb-2">
                        {t(movie.titleKey)}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mb-4">
                        {t(movie.genreKey)}
                      </p>

                      {/* Timings */}
                      <div className="mb-6">
                        <span className="text-[10px] tracking-[0.15em] text-neutral-400 uppercase block mb-2">
                          {t("movies.timingsLabel")}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {movie.timings.map((time) => (
                            <span
                              key={time}
                              className="text-[10px] bg-white text-neutral-700 border border-neutral-200/80 px-2 py-1 rounded-sm font-mono shadow-sm"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              </AnimatedReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
