import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css"; 

import IncomingCallModal from "@/components/IncomingCallModal";
import Providers from "@/components/Providers";

// ✅ AJOUT : Import du ThemeProvider
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ MODIF : Ajout de la config PWA (manifest + appleWebApp + icons)
export const metadata: Metadata = {
  title: "Afrifan",
  description: "La plateforme des créateurs et de leurs fans",
  manifest: "/manifest.webmanifest",
  themeColor: "#8B5CF6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Afrifan",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <Script 
          src="https://cdn.kkiapay.me/k.js" 
          strategy="beforeInteractive"
        />
        {/* ✅ AJOUT : meta pour iOS (install sur iPhone) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Afrifan" />
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        
        <Providers>
          {/* ✅ AJOUT : ThemeProvider enveloppe tout */}
          <ThemeProvider>
            {children}
            <IncomingCallModal />
          </ThemeProvider>
        </Providers>
        
      </body>
    </html>
  );
}