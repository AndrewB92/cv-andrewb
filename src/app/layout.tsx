import { pageMetadata } from "@/config/metadata";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import styles from "./layout.module.css";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import MicrosoftClarity from '@/components/analytics/MicrosoftClarity';
import { GoogleAnalytics } from '@next/third-parties/google';
import ConsoleIntro from "@/components/ConsoleIntro/ConsoleIntro";

import GlowBorderProvider from "./GlowBorderProvider";

// import { CustomCursor } from "@/components/CustomCursor/CustomCursor";
// import RouteLoader from "@/components/RouteLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = pageMetadata("/");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.GA_ID;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* <RouteLoader /> */}

        <div className={styles.shell}>
          <a href="#main-content" className={styles.skipLink}>
            Skip to content
          </a>

          {/* <CustomCursor particleCount={7} /> */}

          <Header />

          <main className={styles.mainContent} id="main-content">
            <GlowBorderProvider />
            {children}
          </main>

          <Footer />
        </div>

        <ConsoleIntro />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        <MicrosoftClarity />
      </body>
    </html>
  );
}