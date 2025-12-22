import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingAIChat } from "@/components/FloatingAIChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow";

export const metadata: Metadata = {
  title: `${appName} - Modern Task Management`,
  description: `Focus on what matters, effortlessly with ${appName}.`,
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
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <FloatingAIChat />
      </body>
    </html>
  );
}
