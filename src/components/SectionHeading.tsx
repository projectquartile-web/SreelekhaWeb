import React from "react";
import AnimatedReveal from "./AnimatedReveal";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export default function SectionHeading({
  title,
  subtitle,
  align = "center",
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div className={`mb-16 md:mb-24 ${isCenter ? "text-center" : "text-left"}`}>
      <AnimatedReveal yOffset={15}>
        {subtitle && (
          <span className="text-xs md:text-sm font-semibold tracking-[0.25em] text-[#2563EB] uppercase block mb-3">
            {subtitle}
          </span>
        )}
        <h2 className="text-4xl md:text-6xl font-serif text-neutral-900 font-normal">
          {title}
        </h2>
      </AnimatedReveal>
    </div>
  );
}
