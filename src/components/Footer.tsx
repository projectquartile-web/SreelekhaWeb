"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { contactData } from "@/data/contact";
import { siteConfig } from "@/config/site";

export default function Footer() {
  const t = useTranslations("common");
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.experience"), href: "#facilities" },
    { label: t("nav.gallery"), href: "#gallery" },
    { label: t("nav.visit"), href: "#contact" },
  ];

  return (
    <footer className="bg-[#F8FAFC] border-t border-neutral-250/50 py-16 text-neutral-500 font-light">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
        {/* Brand */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <a
            href="#home"
            className="flex items-center gap-3 group py-1"
          >
            <Image
              src="/logo.svg"
              alt="Sree Lekha Logo"
              width={55}
              height={30}
              className="object-contain"
            />
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-serif text-lg tracking-wide leading-none text-neutral-900 font-semibold">Sree Lekha</span>
              <span className="text-[7px] font-mono tracking-[0.2em] uppercase text-neutral-400">CHIKKAMAGALURU</span>
            </div>
          </a>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-sm mt-2">
            {t("footer.tagline")}
          </p>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <h4 className="text-xs font-semibold tracking-wider text-neutral-800 uppercase">
            {t("footer.links")}
          </h4>
          <ul className="space-y-2 text-xs">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="hover:text-[#2563EB] transition-colors duration-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <h4 className="text-xs font-semibold tracking-wider text-neutral-800 uppercase">
            {t("footer.contact")}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href={`mailto:${contactData.email}`}
                className="hover:text-[#2563EB] transition-colors"
              >
                {contactData.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-neutral-200/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
        <div>
          &copy; {currentYear} {siteConfig.name}. {t("footer.rights")}
        </div>
        <div className="flex gap-6">
          <span>Premium Entertainment Destination</span>
        </div>
      </div>
    </footer>
  );
}
