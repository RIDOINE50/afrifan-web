"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const isProfileSection = 
    pathname === "/profile" || 
    pathname === "/abonnements" || 
    pathname === "/suivis" || 
    pathname === "/live" || 
    pathname === "/settings" ||
    pathname?.startsWith("/profile/");

  const swipeSequence = ["/home", "/explore", "/messages", "/profile"];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      const currentIndex = swipeSequence.indexOf(pathname);
      if (currentIndex !== -1) {
        let nextIndex = currentIndex;
        if (diffX > 0) {
          nextIndex = (currentIndex + 1) % swipeSequence.length;
        } else {
          nextIndex = (currentIndex - 1 + swipeSequence.length) % swipeSequence.length;
        }
        router.push(swipeSequence[nextIndex]);
      }
    }
  };

  const mainMenuItems = [
    { icon: "🏠", label: "Pour toi", path: "/home" },
    { icon: "", label: "Explorer", path: "/explore" },
    { icon: "+", label: "Créer", path: "/create" },
    { icon: "💬", label: "Messages", path: "/messages" },
    { icon: "👤", label: "Profil", path: "/profile" },
  ];

  const profileMenuItems = [
    { icon: "⭐", label: "Abonnements", path: "/abonnements" },
    { icon: "👥", label: "Suivis", path: "/suivis" },
    { icon: "", label: "Live", path: "/live" },
    { icon: "⚙️", label: "Paramètres", path: "/settings" },
  ];

  const menuItems = isProfileSection ? profileMenuItems : mainMenuItems;

  const getPageTitle = () => {
    if (pathname === "/explore") return "Découvrir";
    if (pathname === "/home") return "Pour toi";
    if (pathname === "/messages") return "Messages";
    if (pathname === "/profile") return "Mon Profil";
    if (pathname === "/abonnements") return "Mes Abonnements";
    if (pathname === "/suivis") return "Mes Suivis";
    if (pathname === "/live") return "Live";
    if (pathname === "/settings") return "Paramètres";
    if (pathname === "/create") return "Créer";
    return "Afrifan";
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0A0A0A",
      color: "#FFFFFF",
      fontFamily: "Arial, sans-serif",
      paddingBottom: isMobile ? "80px" : "0", // ✅ Espace réservé UNIQUEMENT sur mobile
    }}>
      {/* ============================================ */}
      {/* VERSION DESKTOP : Sidebar à gauche           */}
      {/* ============================================ */}
      {!isMobile && (
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <aside style={{
            width: "280px",
            backgroundColor: "#0A0A0A",
            borderRight: "1px solid #1A1A1A",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            height: "100vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px" }}>A</div>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>Afrifan</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: "999px", padding: "10px 16px", marginBottom: "20px", border: "1px solid #2A2A2A" }}>
              <span style={{ color: "#9CA3AF", marginRight: "8px", fontSize: "16px" }}></span>
              <input type="text" placeholder="Rechercher" style={{ background: "transparent", border: "none", outline: "none", color: "#FFFFFF", width: "100%", fontSize: "14px" }} />
            </div>

            <button onClick={() => router.push("/create")} style={{ width: "100%", padding: "12px", backgroundColor: "#8B5CF6", border: "none", borderRadius: "12px", color: "#FFFFFF", fontSize: "15px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>+</span> Créer
            </button>

            <nav style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px" }}>
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button key={item.path} onClick={() => router.push(item.path)} style={{ background: isActive ? "rgba(139, 92, 246, 0.15)" : "transparent", border: "none", borderRadius: "12px", padding: "12px 16px", color: isActive ? "#8B5CF6" : "#FFFFFF", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px", textAlign: "left", transition: "background 0.2s" }}>
                    <span style={{ fontSize: item.label === "Créer" ? "22px" : "20px", fontWeight: item.label === "Créer" ? "bold" : "normal" }}>{item.icon}</span>
                    <span style={{ fontWeight: isActive ? "bold" : "normal" }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: "20px" }}>
              <h3 style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: "bold", marginBottom: "8px", letterSpacing: "0.5px" }}>COMPTES SUIVIS</h3>
              <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>Suivez des créateurs pour les voir ici.</p>
            </div>

            <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>N</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>Utilisateur</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>@username</div>
              </div>
            </div>
          </aside>

          <main style={{ flex: 1, marginLeft: "280px", minHeight: "100vh" }}>
            {children}
          </main>
        </div>
      )}

      {/* ============================================ */}
      {/* VERSION MOBILE : Header + SWIPE              */}
      {/* ============================================ */}
      {isMobile && (
        <>
          <header style={{
            position: "sticky", top: 0, zIndex: 50, backgroundColor: "#0A0A0A",
            borderBottom: "1px solid #1A1A1A", padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{getPageTitle()}</h1>
            {!isProfileSection && (
              <button onClick={() => router.push("/notifications")} style={{ background: "none", border: "none", color: "#FFFFFF", fontSize: "24px", cursor: "pointer" }}></button>
            )}
          </header>

          <main 
            style={{ flex: 1, overflowY: "auto", touchAction: "pan-y" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {children}
          </main>

          {/* ✅ BARRE DE NAVIGATION DU BAS (MOBILE UNIQUEMENT) */}
          <nav style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#0A0A0A",
            borderTop: "1px solid #1A1A1A",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "8px 0",
            zIndex: 9999,
          }}>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  style={{
                    background: "none",
                    border: "none",
                    color: isActive ? "#8B5CF6" : "#9CA3AF",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    padding: "8px 16px",
                    position: item.path === "/create" ? "relative" : "static",
                    transform: item.path === "/create" ? "translateY(-12px)" : "none",
                  }}
                >
                  {item.path === "/create" ? (
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      backgroundColor: "#8B5CF6", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "28px", color: "#FFFFFF",
                      boxShadow: "0 4px 12px rgba(139, 92, 246, 0.4)",
                    }}>
                      +
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: "24px" }}>{item.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: isActive ? "bold" : "normal" }}>
                        {item.label}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}