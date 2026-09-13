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

export const metadata: Metadata = {
  title: "Afrifan",
  description: "La plateforme des créateurs et de leurs fans",
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