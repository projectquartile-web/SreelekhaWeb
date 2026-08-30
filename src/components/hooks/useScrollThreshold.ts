"use client";

import { useState, useEffect } from "react";

/**
 * Custom React hook to detect if the window scroll offset has crossed a given threshold.
 * 
 * @param threshold The scroll offset in pixels (defaults to 36px)
 * @returns boolean representing if window.scrollY > threshold
 */
export function useScrollThreshold(threshold: number = 36): boolean {
  const [isThresholdCrossed, setIsThresholdCrossed] = useState(false);

  useEffect(() => {
    // Avoid running on server-side rendering
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setIsThresholdCrossed(window.scrollY > threshold);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return isThresholdCrossed;
}
