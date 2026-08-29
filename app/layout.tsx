import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navi — demo",
  description: "Demo fonctionnelle du parcours Navi (mode dictaphone + mockups visio/participant)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
