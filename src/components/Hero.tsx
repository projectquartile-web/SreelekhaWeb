"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { theme } from "@/lib/theme";

interface HeroProps {
  variant?: "image" | "video";
  mediaUrl?: string;
}

export default function Hero({ variant = "image", mediaUrl = "/hero/hero-bg.jpg" }: HeroProps) {
  const t = useTranslations("home");

  return (
    <section
      id="home"
      className="relative h-screen w-full overflow-hidden bg-white flex items-center justify-center pt-20"
    >
      {/* Background Media */}
      {variant === "video" ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-[1.03]"
          src={mediaUrl}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center scale-[1.01]"
          style={{ backgroundImage: `url('${mediaUrl}')` }}
        />
      )}

      {/* Elegant Dark Overlay on top, with a very subtle and short white fade at the very bottom to blur the boundary edge */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />


      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center flex flex-col items-center">

        {/* Hero Title - Playfair Display serif */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...theme.animations.springSlow, delay: 0.2 }}
          className="text-6xl md:text-9xl font-serif text-white font-normal mb-8 leading-[1.05] tracking-tight"
        >
          {t("hero.title")}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...theme.animations.springDefault, delay: 0.4 }}
          className="text-base md:text-lg font-light text-neutral-200 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          {t("hero.subtitle")}
        </motion.p>
      </div>

      {/* Floating indicators / scroll guide */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50">
        <span className="text-[9px] tracking-[0.35em] uppercase font-semibold">Scroll</span>
        <div className="w-[1px] h-10 bg-white/10 relative overflow-hidden">
          <motion.div
            animate={{ y: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-white"
          />
        </div>
      </div>
    </section>
  );
}
