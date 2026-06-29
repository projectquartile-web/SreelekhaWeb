"use client";

import React from "react";
import { useTranslations } from "next-intl";
import SectionHeading from "./SectionHeading";
import AnimatedReveal from "./AnimatedReveal";
import Image from "next/image";

export default function Gallery() {
  const t = useTranslations("home");

  const galleryImages = [
    {
      id: "seats",
      src: "/Seatview.png",
      alt: "Comfortable Premium Seating",
      aspectClass: "aspect-[2341/1682]",
    },
    {
      id: "snackbar",
      src: "/Snackbar.jpeg",
      alt: "Snack Counter & Refreshments",
      aspectClass: "aspect-[960/639]",
    },
    {
      id: "popcorn",
      src: "/Popcorn.jpeg",
      alt: "Fresh Hot Popcorn",
      aspectClass: "aspect-[960/639]",
    },
    {
      id: "car-parking",
      src: "/Car Parking.png",
      alt: "Spacious Car Parking Area",
      aspectClass: "aspect-[9/16]",
    },
    {
      id: "bike-parking",
      src: "/Bike parking.png",
      alt: "Covered Two-Wheeler Parking Area",
      aspectClass: "aspect-[9/16]",
    },
  ];

  return (
    <section id="gallery" className="py-24 md:py-32 bg-white relative border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading title={t("gallery.title")} subtitle={t("gallery.subtitle")} />

        {/* Masonry Columns Layout: Displays original aspect ratios with zero cropping */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
          {galleryImages.map((image, index) => (
            <AnimatedReveal
              key={image.id}
              delay={index * 0.1}
              yOffset={20}
              className="break-inside-avoid block mb-8"
            >
              <div className="group relative w-full bg-neutral-50 rounded-3xl overflow-hidden shadow-md border border-neutral-200/50 hover:shadow-xl hover:border-[#2563EB]/25 transition-all duration-500 cursor-pointer">
                <div className={`relative w-full ${image.aspectClass}`}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                
                {/* Premium dark gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Tactile detail slide-up on hover */}
                <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none">
                  <span className="text-[9px] font-mono tracking-[0.25em] text-[#60A5FA] uppercase mb-2">
                    {t(`gallery.items.${image.id}.category`)}
                  </span>
                  <h4 className="text-xl font-serif text-white font-normal leading-tight">
                    {t(`gallery.items.${image.id}.title`)}
                  </h4>
                </div>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
