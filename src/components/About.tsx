"use client";

import React from "react";
import { useTranslations } from "next-intl";
import AnimatedReveal from "./AnimatedReveal";
import Image from "next/image";

export default function About() {
  const t = useTranslations("home");

  return (
    <section id="about" className="py-24 md:py-32 bg-white overflow-hidden border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Narrative & Stats Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-16">
          {/* Title Area */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            <AnimatedReveal delay={0.2} yOffset={15}>
              <span className="text-[10px] md:text-xs font-semibold tracking-[0.25em] text-neutral-400 uppercase block mb-4">
                {t("about.subtitle")}
              </span>
            </AnimatedReveal>
            <AnimatedReveal delay={0.3} yOffset={20}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-neutral-900 font-normal leading-[1.15]">
                {t("about.title")}
              </h2>
            </AnimatedReveal>
          </div>

          {/* Description & Stats Area */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <AnimatedReveal delay={0.4} yOffset={20}>
              <p className="text-base md:text-lg text-neutral-500 font-light leading-relaxed mb-10">
                {t("about.description")}
              </p>
            </AnimatedReveal>

            {/* Premium Stats Row */}
            <AnimatedReveal delay={0.5} yOffset={15}>
              <div className="flex items-center justify-between pt-8 border-t border-neutral-100 w-full">
                <div>
                  <span className="text-[9px] tracking-[0.2em] text-neutral-400 uppercase block mb-1">
                    {t("about.stat1Label")}
                  </span>
                  <div className="text-xl md:text-2xl lg:text-3xl font-serif font-normal text-neutral-900">
                    {t("about.stat1Val")}
                  </div>
                </div>
                <div className="h-10 w-[1px] bg-neutral-250" />
                <div>
                  <span className="text-[9px] tracking-[0.2em] text-neutral-400 uppercase block mb-1">
                    {t("about.stat2Label")}
                  </span>
                  <div className="text-xl md:text-2xl lg:text-3xl font-serif font-normal text-neutral-900">
                    {t("about.stat2Val")}
                  </div>
                </div>
                <div className="h-10 w-[1px] bg-neutral-250" />
                <div>
                  <span className="text-[9px] tracking-[0.2em] text-neutral-400 uppercase block mb-1">
                    {t("about.stat3Label")}
                  </span>
                  <div className="text-xl md:text-2xl lg:text-3xl font-serif font-normal text-neutral-900">
                    {t("about.stat3Val")}
                  </div>
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </div>

        {/* Full-Width Grand Showcase of Theatre Facade */}
        <AnimatedReveal delay={0.6} className="w-full">
          <div className="relative aspect-[2362/1536] w-full rounded-3xl overflow-hidden shadow-xl border border-neutral-200/50">
            <Image
              src="/Theatre front.png"
              alt="Sree Lekha Theatre Facade"
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              className="object-cover transition-transform duration-700 hover:scale-101"
            />
          </div>
        </AnimatedReveal>

      </div>
    </section>
  );
}
