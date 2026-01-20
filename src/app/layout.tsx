import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CustomCursor } from "@/components/CustomCursor/CustomCursor";
import RouteLoader from "@/components/RouteLoader";

import GlowBorderProvider from './GlowBorderProvider';



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andrew Bielous • Web Developer",
  description:
    "Portfolio for Andrew Bielous, a frontend-focused engineer crafting WordPress and React experiences.",
  metadataBase: new URL("https://cv-andrewb.vercel.app"),
  openGraph: {
    title: "Andrew Bielous • Web Developer",
    description:
      "Explore Andrew Bielous' client work, skills, and preferred tools.",
    url: "https://cv-andrewb.vercel.app",
    siteName: "Andrew Bielous",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Andrew Bielous portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Andrew Bielous • Web Developer",
    description:
      "Client-ready WordPress and React experiences built by Andrew Bielous.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <RouteLoader />
        <div className={styles.shell}>
          <a href="#main-content" className={styles.skipLink}>
            Skip to content
          </a>
          <CustomCursor particleCount={7} />
          <Header />
          <div className={styles.mainContent} id="main-content">
            <GlowBorderProvider />
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

