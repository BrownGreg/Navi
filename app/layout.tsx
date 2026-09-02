import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getLocale, getDictionary } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Navi",
  description: "Assistant de reunion intelligent : captation, transcription et compte-rendu automatique"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <LocaleProvider locale={locale} t={t}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
