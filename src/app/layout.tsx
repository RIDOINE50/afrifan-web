import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // ✅ AJOUT : pour charger le SDK Kkiapay
import "./globals.css"; 

// ✅ 1. Import du composant modal d'appel entrant
import IncomingCallModal from "@/components/IncomingCallModal";

// ✅ 2. Import du Provider Chakra UI
import Providers from "@/components/Providers";

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
        {/* ✅ SDK Web Kkiapay - Chargé avant toute interaction */}
        <Script 
          src="https://cdn.kkiapay.me/k.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        
        {/* ✅ 3. On enveloppe TOUT avec le Providers pour que Chakra UI fonctionne */}
        <Providers>
          {children}
          
          {/* Le modal est chargé globalement, prêt à apparaître quand un appel arrive */}
          <IncomingCallModal />
        </Providers>
        
      </body>
    </html>
  );
}