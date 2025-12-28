import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingAIChat } from "@/components/FloatingAIChat";
import { ArabicFontSizeProvider } from "@/contexts/ArabicFontSizeContext";
import { FontLoader } from "@/components/FontLoader";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Arabic Reader";

export const metadata: Metadata = {
  title: `${appName} - AI-Powered Arabic Learning`,
  description: `Master Arabic vocabulary and reading skills with ${appName}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white text-slate-900`}
      >
        <FontLoader />
        <ArabicFontSizeProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <FloatingAIChat />
          <Toaster position="top-right" />
        </ArabicFontSizeProvider>
      </body>
    </html>
  );
}
