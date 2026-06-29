import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Facilities from "@/components/Facilities";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { siteConfig } from "@/config/site";
import { theatreData } from "@/data/theatre";
import { contactData } from "@/data/contact";

export default function HomePage() {
  // Structured data (Schema.org JSON-LD) for Local Business & MovieTheater
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MovieTheater",
    "name": siteConfig.name,
    "image": `https://${siteConfig.domain}/og-image.jpg`,
    "url": `https://${siteConfig.domain}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": `${contactData.addressLine1}, ${contactData.addressLine2}`,
      "addressLocality": contactData.city,
      "addressRegion": contactData.state,
      "postalCode": contactData.pincode,
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": theatreData.latitude,
      "longitude": theatreData.longitude
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "09:00",
      "closes": "23:00"
    }
  };

  return (
    <>
      {/* JSON-LD Structured Metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Page Layout */}
      <Navbar />
      <main className="flex-grow">
        <Hero variant="image" mediaUrl="/HallScreenview.png" />
        <About />
        <Facilities />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
