"use client";

import React from "react";
import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading";
import AnimatedReveal from "./AnimatedReveal";
import { Armchair, ParkingCircle, Coffee, Smile, LucideIcon } from "lucide-react";

interface FacilityItem {
  id: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
}

const facilityItemsList: FacilityItem[] = [
  {
    id: "seating",
    titleKey: "facilities.seating.title",
    descKey: "facilities.seating.desc",
    icon: Armchair,
  },
  {
    id: "parking",
    titleKey: "facilities.parking.title",
    descKey: "facilities.parking.desc",
    icon: ParkingCircle,
  },
  {
    id: "snacks",
    titleKey: "facilities.snacks.title",
    descKey: "facilities.snacks.desc",
    icon: Coffee,
  },
  {
    id: "family",
    titleKey: "facilities.family.title",
    descKey: "facilities.family.desc",
    icon: Smile,
  },
];

export default function Facilities() {
  const t = useTranslations("home");

  return (
    <section id="facilities" className="py-24 md:py-32 bg-[#F8FAFC] relative overflow-hidden border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <SectionHeading title={t("facilities.title")} subtitle={t("facilities.subtitle")} />

        {/* Unified, sleek column row with dividing borders (Apple style) */}
        <AnimatedReveal yOffset={25}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-neutral-200/60 bg-white rounded-3xl overflow-hidden shadow-sm divide-y md:divide-y-0 md:divide-x divide-neutral-200/60">
            {facilityItemsList.map((facility) => {
              const IconComponent = facility.icon;

              return (
                <div
                  key={facility.id}
                  className="p-8 md:p-10 flex flex-col justify-between hover:bg-neutral-50/50 transition-colors duration-300"
                >
                  <div>
                    {/* Minimalist blue outline icon */}
                    <div className="w-10 h-10 flex items-center justify-center text-[#2563EB] mb-8">
                      <IconComponent className="w-6 h-6 stroke-[1.2]" />
                    </div>

                    <h3 className="text-xl font-serif text-neutral-900 font-normal mb-4 tracking-wide">
                      {t(facility.titleKey)}
                    </h3>

                    <p className="text-xs md:text-sm text-neutral-500 font-light leading-relaxed">
                      {t(facility.descKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
