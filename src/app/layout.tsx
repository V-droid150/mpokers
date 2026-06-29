import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mpokers — Cardless Poker Chips",
  description:
    "Kelola chip & taruhan poker online tanpa kartu. Vegas vibes, mobile-friendly, hingga 8 pemain.",
  applicationName: "Mpokers",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Mpokers" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
