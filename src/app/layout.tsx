import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import styles from "./layout.module.css";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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

export const metadata: Metadata = {
  title: "Andrew Bielous • Frontend Developer",

  description:
    "Frontend developer building performant web experiences with Next.js, React, TypeScript, and WordPress.",

  metadataBase: new URL("https://andrew-b.is-a.dev"),

  openGraph: {
    title: "Andrew Bielous • Frontend Developer",
    description:
      "Frontend developer focused on performant, maintainable web experiences.",
    url: "https://andrew-b.is-a.dev",
    siteName: "Andrew Bielous",
    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Andrew Bielous — Frontend Developer",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Andrew Bielous • Frontend Developer",
    description:
      "Frontend developer focused on performant, maintainable web experiences.",
    images: ["/og-image.png"],
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

        <ConsoleIntro
          config={{
            name: "Andrew Bielous",
            role: "Frontend Developer",
            status: "available for opportunities",

            email: "babujjioh@gmail.com",

            stack: [
              "Next.js",
              "React",
              "TypeScript",
              "WordPress",
            ],

            githubUrl: "https://github.com/AndrewB92",
            linkedinUrl: "https://www.linkedin.com/in/bielousandrew",

            version: "1.0.0",
          }}
        />
      </body>
    </html>
  );
}