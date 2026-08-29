"use client";

import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#0A0A0A",
      color: "#FFFFFF",
      fontFamily: "Arial, sans-serif",
    }}>
      {/* Sidebar fixe à gauche */}
      <Sidebar />
      
      {/* Contenu principal à droite */}
      <main style={{
        flex: 1,
        overflowY: "auto",
        height: "100vh",
      }}>
        {children}
      </main>
    </div>
  );
}