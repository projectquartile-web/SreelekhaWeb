"use client";

import { theatreData } from "@/data/theatre";

/**
 * Custom React hook to launch platform-aware native maps application (Apple Maps for iOS, Google Maps for others).
 */
export function useMapLauncher() {
  const launchMaps = () => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod");

    if (isIOS) {
      // Launch natively in Apple Maps
      window.open(`maps://?daddr=Sree+Lekha+Theatre+Chikkamagaluru&q=Sree+Lekha+Theatre`, "_blank");
    } else {
      // Launch in Google Maps
      window.open(theatreData.googleMapsUrl, "_blank");
    }
  };

  return { launchMaps };
}
