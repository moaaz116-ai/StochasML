import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stochas ML - Open-Source TinyML Platform",
  description:
    "Build, train, and deploy machine learning models on microcontrollers with ease. Open-source TinyML platform for ESP32-S3 and beyond.",
};

import { ToastContainer } from "@/components/ui/toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${ebGaramond.variable}`}>
      <body className={`${inter.className} ${ebGaramond.variable} bg-surface-0 text-white min-h-screen`}>
        <Providers>{children}</Providers>
        <ToastContainer />
      </body>
    </html>
  );
}
