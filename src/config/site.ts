export const siteConfig = {
  name: "Sree Lekha Theatre",
  city: "Chikkamagaluru",
  state: "Karnataka",
  country: "India",
  defaultLocale: "en",
  locales: ["en", "kn"] as const,
  domain: "sreelekhatheatre.com", // Placeholder domain for meta tags
};

export type Locale = (typeof siteConfig.locales)[number];
