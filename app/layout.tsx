import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RepoFinder — Find the perfect open-source project",
    template: "%s · RepoFinder",
  },
  description:
    "Describe what you want to build and instantly discover the best matching open-source repositories on GitHub — ranked, filterable, and readable right here.",
  keywords: [
    "github",
    "repository search",
    "open source",
    "project ideas",
    "code discovery",
  ],
  openGraph: {
    title: "RepoFinder — Find the perfect open-source project",
    description:
      "Describe what you want to build and discover the best matching GitHub repositories.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
