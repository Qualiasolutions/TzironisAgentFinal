import type { Metadata, Viewport } from "next";
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
  title: "Tzironis Business Suite",
  description: "Intelligent AI Assistant for Business Solutions",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tzironis Business Suite",
  },
};

export const viewport: Viewport = {
  themeColor: "#145199",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{ 
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', 
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          minHeight: '100vh',
          backgroundColor: '#f0f7ff'
        }}
      >
        {children}
      </body>
    </html>
  );
}
