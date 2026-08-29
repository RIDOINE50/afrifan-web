import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // ✅ L'import du CSS est bien là

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
  children: React.ReactNode; // ✅ Correction ici : pas de LayoutProps<"/">
}) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      {/* ✅ Ajout de bg-background et text-foreground pour forcer les couleurs du thème */}
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}