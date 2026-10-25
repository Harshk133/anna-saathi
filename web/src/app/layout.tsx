import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, JetBrains_Mono, Mukta } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
});

const sans = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
});

const deva = Mukta({
  variable: "--font-deva",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnnaSaathi",
  description: "Buy right, cook first. A household food planner that cuts waste before it happens.",
};

export const viewport: Viewport = {
  themeColor: "#0f0b09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${deva.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
