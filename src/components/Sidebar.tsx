"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [followedCreators, setFollowedCreators] = useState<any[]>([]);
  
  // ✅ NOUVEAU : État pour ouvrir/fermer le menu sur mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    danger: "#EF4444",
    pink: "#EC4899",
  };

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id, profiles(id, username, full_name, avatar_url)')
          .eq('follower_id', session.user.id)
          .limit(5);
        setFollowedCreators(follows?.map((f: any) => f.profiles).filter(Boolean) || []);
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false); // Fermer le menu mobile après déconnexion
    router.push("/login");
  };

  // ✅ NOUVEAU : Ajout de l'onglet "Créer"
  const navItems = [
    { name: "Créer", icon: "➕", path: "/create", isAction: true }, // Bouton spécial
    { name: "Pour toi", icon: "🏠", path: "/" },
    { name: "Explorer", icon: "🧭", path: "/explore" },
    { name: "LIVE", icon: "📡", path: "/live" },
    { name: "Messages", icon: "✉️", path: "/messages" },
    { name: "Profil", icon: "👤", path: "/profile" },
  ];

  const menuItemStyle = (path: string, isAction: boolean = false): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: isAction ? "12px" : "10px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    color: isAction ? "white" : (pathname === path ? colors.primary : colors.text),
    backgroundColor: isAction ? colors.primary : (pathname === path ? `${colors.primary}15` : "transparent"),
    fontWeight: pathname === path || isAction ? "bold" : "500",
    fontSize: "15px",
    transition: "all 0.2s",
    justifyContent: isAction ? "center" : "flex-start",
    border: isAction ? "none" : "1px solid transparent",
  });

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false); // ✅ Ferme le menu mobile après un clic
  };

  return (
    <>
      {/* ==========================================
          1. BOUTON HAMBURGER (Visible UNIQUEMENT sur mobile)
      ========================================== */}
      <button 
        className="mobile-hamburger-btn"
        onClick={() => setIsMobileMenuOpen(true)}
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 40,
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "10px 14px",
          color: colors.text,
          fontSize: "20px",
          cursor: "pointer",
          display: "none", // Caché sur desktop, activé par CSS media query
        }}
      >
        ☰
      </button>

      {/* ==========================================
          2. OVERLAY SOMBRE (Pour fermer en cliquant dehors sur mobile)
      ========================================== */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 90,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ==========================================
          3. LA SIDEBAR (Desktop + Mobile Drawer)
      ========================================== */}
      <aside 
        className={`sidebar-container ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: "260px",
          backgroundColor: colors.bg,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          padding: "16px 12px",
          height: "100vh",
          overflowY: "auto",
          position: "sticky",
          top: 0,
          zIndex: 100,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {/* En-tête avec bouton fermer (Mobile uniquement) */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "20px",
          padding: "0 8px"
        }}>
          <div 
            onClick={() => handleNavigation("/")}
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
          >
            <div style={{
              width: "36px", height: "36px", borderRadius: "8px",
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.pink})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold", fontSize: "18px", color: "white"
            }}>A</div>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: colors.text }}>Afrifan</span>
          </div>
          
          {/* Bouton X pour fermer sur mobile */}
          <button 
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", display: "none" }}
          >
            ✕
          </button>
        </div>

        {/* Recherche */}
        <div style={{
          display: "flex", alignItems: "center", backgroundColor: colors.card,
          borderRadius: "999px", padding: "8px 14px", marginBottom: "20px",
          border: `1px solid ${colors.border}`
        }}>
          <span style={{ color: colors.textMuted, marginRight: "8px" }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher"
            onClick={() => handleNavigation("/explore")}
            style={{
              background: "transparent", border: "none", outline: "none",
              color: colors.text, width: "100%", fontSize: "14px", cursor: "pointer"
            }}
            readOnly
          />
        </div>

        {/* Menu principal */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {navItems.map((item) => (
            <div
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              style={menuItemStyle(item.path, item.isAction)}
            >
              <span>{item.icon}</span> {item.name}
            </div>
          ))}
        </nav>

        <div style={{ height: "1px", backgroundColor: colors.border, margin: "8px 0" }} />

        {/* Comptes suivis */}
        <div style={{ marginTop: "8px", flex: 1 }}>
          <div style={{ color: colors.textMuted, fontSize: "12px", fontWeight: "bold", padding: "0 12px", marginBottom: "8px" }}>
            COMPTES SUIVIS
          </div>
          {followedCreators.length === 0 ? (
            <div style={{ padding: "0 12px", color: colors.textMuted, fontSize: "13px" }}>
              Suivez des créateurs pour les voir ici.
            </div>
          ) : (
            followedCreators.map((creator: any, i: number) => (
              <div
                key={i}
                onClick={() => handleNavigation(`/profile?id=${creator.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px",
                  borderRadius: "8px", cursor: "pointer", transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.card)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  backgroundColor: colors.card,
                  backgroundImage: creator.avatar_url ? `url(${creator.avatar_url})` : undefined,
                  backgroundSize: "cover", backgroundPosition: "center",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: colors.textMuted
                }}>
                  {!creator.avatar_url && "👤"}
                </div>
                <span style={{ color: colors.text, fontSize: "14px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {creator.full_name || creator.username}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: "16px",
            padding: "10px",
            backgroundColor: "transparent",
            border: `1px solid ${colors.danger}`,
            color: colors.danger,
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span>🚪</span> Se déconnecter
        </button>
      </aside>

      {/* ==========================================
          4. CSS MEDIA QUERIES (Le secret du responsive)
      ========================================== */}
      <style>{`
        /* Par défaut (Desktop) : Tout est normal */
        .mobile-hamburger-btn { display: none !important; }
        .mobile-close-btn { display: none !important; }
        .mobile-overlay { display: none !important; }
        .sidebar-container { transform: translateX(0) !important; }

        /* Sur Mobile (écrans < 768px) */
        @media (max-width: 768px) {
          /* Afficher le bouton hamburger */
          .mobile-hamburger-btn { display: block !important; }
          
          /* Cacher la sidebar par défaut (la pousser hors de l'écran) */
          .sidebar-container {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%) !important; /* Caché à gauche */
            border-right: none;
            box-shadow: 4px 0 20px rgba(0,0,0,0.5);
          }
          
          /* Quand le menu est ouvert, le faire glisser */
          .sidebar-container.mobile-open {
            transform: translateX(0) !important;
          }
          
          /* Afficher le bouton fermer et l'overlay */
          .mobile-close-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}