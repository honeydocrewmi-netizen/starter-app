import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import { businessConfig } from "@/lib/business-config";
import "./globals.css";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "900"],
});

const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `Get a quote — ${businessConfig.name}`,
  description: businessConfig.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
