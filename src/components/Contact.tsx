"use client";

import React from "react";
import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading";
import AnimatedReveal from "./AnimatedReveal";
import { contactData } from "@/data/contact";
import { theatreData } from "@/data/theatre";
import { MapPin, Mail, Clock } from "lucide-react";

import { useMapLauncher } from "@/hooks/useMapLauncher";

export default function Contact() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const { launchMaps } = useMapLauncher();

  return (
    <section id="contact" className="py-24 md:py-32 bg-white relative border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading title={t("contact.title")} subtitle={t("contact.subtitle")} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Details Column */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-8">
              {/* Address */}
              <AnimatedReveal yOffset={15}>
                <div className="flex gap-4">
                  {/* Clean floating outline icon matching facilities */}
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center text-[#2563EB]">
                    <MapPin className="w-6 h-6 stroke-[1.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold tracking-wider text-neutral-450 uppercase mb-2">
                      {t("contact.addressTitle")}
                    </h4>
                    <p className="text-sm font-light text-neutral-800 leading-relaxed">
                      {contactData.addressLine1}
                      <br />
                      {contactData.addressLine2}
                      <br />
                      {contactData.city}, {contactData.state} - {contactData.pincode}
                    </p>
                  </div>
                </div>
              </AnimatedReveal>
              {/* Email */}
              <AnimatedReveal delay={0.1} yOffset={15}>
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center text-[#2563EB]">
                    <Mail className="w-6 h-6 stroke-[1.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold tracking-wider text-neutral-450 uppercase mb-2">
                      {t("contact.emailTitle")}
                    </h4>
                    <a
                      href={`mailto:${contactData.email}`}
                      className="text-sm font-light text-neutral-800 hover:text-[#2563EB] transition-colors block"
                    >
                      {contactData.email}
                    </a>
                  </div>
                </div>
              </AnimatedReveal>
            </div>
          </div>

          {/* Map Column: Interactive Live Google Map with Platform-Aware Launcher */}
          <div
            onClick={launchMaps}
            className="lg:col-span-7 h-[350px] lg:h-auto min-h-[350px] relative rounded-3xl overflow-hidden border border-neutral-200/60 shadow-md bg-neutral-50 cursor-pointer group transition-all duration-300 hover:border-[#2563EB]/25"
          >
            <iframe
              src={theatreData.embedMapUrl}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Sree Lekha Theatre Location Map"
            />
            {/* Click intercept overlay */}
            <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors duration-300" />
            
            {/* Floating platform action pill */}
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm border border-neutral-200/60 px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold tracking-wider text-[#2563EB] uppercase flex items-center gap-2 group-hover:bg-white transition-all duration-300 z-10">
              <MapPin className="w-3.5 h-3.5" />
              Open in Maps
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
