import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navi",
  description: "Assistant de reunion intelligent : captation, transcription et compte-rendu automatique"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
