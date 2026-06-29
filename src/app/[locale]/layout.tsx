import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Sree Lekha Theatre | Premium Cinema in Chikkamagaluru",
  description: "Experience cinema at Sree Lekha Theatre, Chikkamagaluru. State-of-the-art 4K digital projection, Dolby Atmos sound, and premium seating.",
  openGraph: {
    title: "Sree Lekha Theatre | Premium Cinema in Chikkamagaluru",
    description: "Experience cinema at Sree Lekha Theatre, Chikkamagaluru. State-of-the-art 4K digital projection and Dolby Atmos sound.",
    url: "https://sreelekhatheatre.com",
    siteName: "Sree Lekha Theatre",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sree Lekha Theatre - Premium Cinema",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sree Lekha Theatre | Premium Cinema in Chikkamagaluru",
    description: "Experience cinema at Sree Lekha Theatre, Chikkamagaluru.",
    images: ["/og-image.jpg"],
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate the locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Fetch messages
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className="h-full antialiased dark scroll-smooth"
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-white">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
