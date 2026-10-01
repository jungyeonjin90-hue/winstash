import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://winstash.xyz"),
  title: "WinStash - AI Career Memory for Everything You Do",
  description:
    "Never lose track of what you achieved. Dump 1 minute on Friday. WinStash automatically turns raw work notes into manager-ready weekly updates, promotion reviews, and career portfolios.",
  verification: {
    google: "qKa_dC23HOY2U3XVvOP3rdC4nyvltfy_dgjghEXxKPQ",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "WinStash - Turn 60-Second Friday Dumps into Career Assets",
    description:
      "1-Input, 3-Output Career Operating System. Turn raw weekly notes into manager-ready weekly updates, promotion reviews, and career portfolios.",
    url: "https://winstash.xyz",
    siteName: "WinStash",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WinStash - 1-Input, 3-Output Career Operating System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WinStash - Turn 60-Second Friday Dumps into Career Assets",
    description:
      "1-Input, 3-Output Career Operating System. Turn raw weekly notes into manager-ready weekly updates, promotion reviews, and career portfolios.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/20 selection:text-indigo-600">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
