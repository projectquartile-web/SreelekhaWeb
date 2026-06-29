"use client";

import React from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useScrollThreshold } from "@/hooks/useScrollThreshold";

export default function Navbar() {
  const isScrolled = useScrollThreshold(36);
  const t = useTranslations("home");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Announcement Utility Bar */}
      <div
        className={`bg-[#0F172A] border-b border-white/5 transition-all duration-500 overflow-hidden flex items-center justify-center w-full ${
          isScrolled ? "max-h-0 py-0 opacity-0" : "max-h-20 py-2.5 opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full text-center">
          <span className="inline-block text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.2em] uppercase font-semibold text-white/90 leading-relaxed select-none">
            {t("contact.operationsLabel")}: {t("contact.operationsMessage")}
          </span>
        </div>
      </div>

      {/* Main Brand Navbar */}
      <div
        className={`transition-all duration-500 border-b ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md py-2 border-neutral-200/50 shadow-sm"
            : "bg-transparent py-3 border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo / Brand Name */}
          <a
            href="#home"
            className="flex items-center gap-3 group py-1"
          >
            <Image
              src="/logo.svg"
              alt="Sree Lekha Logo"
              width={70}
              height={39}
              priority
              className="object-contain"
            />
            <div className="flex flex-col items-start gap-0.5">
              <span className={`font-serif text-lg tracking-wide leading-none transition-colors duration-300 ${
                isScrolled ? "text-neutral-900" : "text-white"
              }`}>Sree Lekha</span>
              <span className={`text-[7px] font-mono tracking-[0.2em] uppercase transition-colors duration-300 ${
                isScrolled ? "text-neutral-400" : "text-white/60"
              }`}>CHIKKAMAGALURU</span>
            </div>
          </a>

          {/* Action Area (Language Switcher) */}
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
