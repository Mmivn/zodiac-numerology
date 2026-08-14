import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import CosmicBackground from "@/components/CosmicBackground";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "vietnamese"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic", "vietnamese"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Zodiac & Numerology",
  description:
    "Personal zodiac and numerology readings, narrated by AI — character, cycles, and relationships.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CosmicBackground />
        {children}
      </body>
    </html>
  );
}
