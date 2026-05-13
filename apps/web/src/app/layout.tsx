import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { AppNav } from "@/components/AppNav";
import { AppTour } from "@/components/AppTour";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WhatsApp Agent",
  description: "Panel para conversaciones y leads (Twilio + FastAPI)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} min-h-screen antialiased`}
      >
        <AppNav />
        <AppTour />
        {children}
      </body>
    </html>
  );
}
