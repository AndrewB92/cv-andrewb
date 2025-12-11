import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andrew B. • Full-Stack Engineer",
  description:
    "Personal site for Andrew B., showcasing engineering projects, skills, and recent work with Next.js, Firebase, and Vercel.",
  metadataBase: new URL("https://cv-andrewb.vercel.app"),
  openGraph: {
    title: "Andrew B. • Full-Stack Engineer",
    description:
      "Personal site for Andrew B., showcasing engineering projects, skills, and recent work.",
    url: "https://cv-andrewb.vercel.app",
    siteName: "Andrew B.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Andrew B. Portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Andrew B. • Full-Stack Engineer",
    description:
      "Personal site for Andrew B., showcasing engineering projects, skills, and recent work.",
    creator: "@andrewb",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
