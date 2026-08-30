import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKn = locale === "kn";

  const title = isKn
    ? "ಶ್ರೀ ಲೇಖಾ ಥಿಯೇಟರ್ | ಚಿಕ್ಕಮಗಳೂರು"
    : "Sree Lekha Theatre | Chikkamagaluru";

  const description = isKn
    ? "ಚಿಕ್ಕಮಗಳೂರಿನ ಶ್ರೀ ಲೇಖಾ ಥಿಯೇಟರ್‌ನಲ್ಲಿ ಸಿನಿಮಾ ಅನುಭವವನ್ನು ಪಡೆಯಿರಿ. ಸೌಲಭ್ಯಗಳು, ಗ್ಯಾಲರಿ, ಸಂಪರ್ಕ ಮಾಹಿತಿ ಮತ್ತು ಹೆಚ್ಚಿನದನ್ನು ವೀಕ್ಷಿಸಿ."
    : "Experience movies at Sree Lekha Theatre, Chikkamagaluru. View facilities, gallery, contact information and more.";

  const domain = siteConfig.domain;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${domain}/${locale}`,
      siteName: "Sree Lekha Theatre",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: isKn ? "ಶ್ರೀ ಲೇಖಾ ಥಿಯೇಟರ್" : "Sree Lekha Theatre",
        },
      ],
      locale: isKn ? "kn_IN" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

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
