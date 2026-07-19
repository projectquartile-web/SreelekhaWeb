export const siteConfig = {
  name: "Sree Lekha Theatre",
  city: "Chikkamagaluru",
  state: "Karnataka",
  country: "India",
  defaultLocale: "en",
  locales: ["en", "kn"] as const,
  domain: "shreelekhatheatre.com",
};

export type Locale = (typeof siteConfig.locales)[number];
