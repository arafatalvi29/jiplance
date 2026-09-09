import type { Metadata } from "next";

import "./globals.css";
import "./header.css";

import { siteConfig } from "@/lib/config";
import LanguageProvider from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: `${siteConfig.brand} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}