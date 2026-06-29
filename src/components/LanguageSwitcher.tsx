"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import React, { useTransition } from "react";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale: "en" | "kn") => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className={`flex items-center gap-1 border border-neutral-200 bg-neutral-50/90 rounded-full p-0.5 text-[10px] md:text-xs transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}>
      <button
        onClick={() => handleLanguageChange("en")}
        disabled={isPending}
        className={`px-3 py-1 rounded-full transition-all duration-300 font-medium uppercase tracking-wider ${
          locale === "en"
            ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/50"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange("kn")}
        disabled={isPending}
        className={`px-3 py-1 rounded-full transition-all duration-300 font-medium ${
          locale === "kn"
            ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/50"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}
