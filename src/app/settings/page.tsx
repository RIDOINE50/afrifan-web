"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFrench, setIsFrench] = useState(true);

  const colors = {
    bg: "#000000",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    red: "#EF4444",
    gradientStart: "#1E1B4B",
    gradientEnd: "#4338CA",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', session.user.id)
          .single();
        
        setUser({
          ...session.user,
          displayName: profile?.full_name || profile?.username || session.user.email?.split('@')[0] || 'l\'artiste'
        });
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("❌ Erreur déconnexion:", error);
      alert("Erreur lors de la déconnexion. Veuillez réessayer.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ✅ NAVIGATION RÉELLE ACTIVÉE
  const handleNavigation = (path: string, featureName: string) => {
    // Liste des pages qui n'existent pas encore
    const unavailablePages = ['/settings/notifications'];
    
    if (unavailablePages.includes(path)) {
      alert(`La section "${featureName}" est bientôt disponible !`);
    } else {
      router.push(path);
    }
  };

  if (isLoading || isLoggingOut) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  const firstName = user?.displayName?.split(' ')[0] || 'l\'artiste';

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: `1px solid ${colors.border}`, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px" }}>←</button>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>Paramètres</h1>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 16px" }}>
        
        {/* 🟪 BANNIÈRE DÉGRADÉE VIOLETTE */}
        <div style={{
          width: "100%",
          padding: "20px",
          background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px"
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: colors.text, fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0" }}>
              Bonjour, {firstName} 👋
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0 }}>
              Gérez votre compte et vos préférences
            </p>
          </div>
          <div style={{ opacity: 0.6, fontSize: "48px", color: "rgba(255,255,255,0.5)" }}>⚙️</div>
        </div>

        {/* 👤 SECTION : PARAMÈTRES DU COMPTE */}
        <SectionTitle title="Paramètres du compte" />
        <SettingsGroup>
          <SettingItem 
            icon="👤" 
            title="Informations personnelles" 
            onClick={() => handleNavigation("/settings/personal-info", "Informations personnelles")} 
          />
          <SettingItem 
            icon="🔓" 
            title="Sécurité" 
            onClick={() => handleNavigation("/settings/security", "Sécurité")} 
          />
          <SettingItem 
            icon="🛡️" 
            title="Confidentialité" 
            onClick={() => handleNavigation("/settings/privacy", "Confidentialité")} 
          />
          <SettingItem 
            icon="🔔" 
            title="Notifications" 
            onClick={() => handleNavigation("/settings/notifications", "Notifications")} 
          />
          
          {/* Toggle Mode Sombre */}
          <div style={{ 
            display: "flex", alignItems: "center", padding: "12px 16px", 
            borderBottom: `1px solid ${colors.border}`, cursor: "pointer" 
          }} onClick={() => setIsDarkMode(!isDarkMode)}>
            <span style={{ fontSize: "22px", marginRight: "16px", color: colors.primary }}>🌙</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: "15px", fontWeight: 500 }}>Mode sombre</div>
              <div style={{ color: colors.textMuted, fontSize: "12px" }}>Apparence de l'application</div>
            </div>
            <ToggleSwitch value={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
          </div>

          {/* Toggle Langue */}
          <div style={{ 
            display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer" 
          }} onClick={() => setIsFrench(!isFrench)}>
            <span style={{ fontSize: "22px", marginRight: "16px", color: colors.primary }}>🌍</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: "15px", fontWeight: 500 }}>
                {isFrench ? "Langue : Français" : "Language: English"}
              </div>
              <div style={{ color: colors.textMuted, fontSize: "12px" }}>Change language / Changer de langue</div>
            </div>
            <ToggleSwitch value={isFrench} onChange={() => setIsFrench(!isFrench)} />
          </div>
        </SettingsGroup>

        <div style={{ height: "28px" }} />

        {/* ℹ️ SECTION : ASSISTANCE & INFORMATIONS */}
        <SectionTitle title="Assistance & Informations" />
        <SettingsGroup>
          <SettingItem 
            icon="❓" 
            title="Aide / FAQ" 
            onClick={() => handleNavigation("/settings/faq", "Aide / FAQ")} 
          />
          <SettingItem 
            icon="📄" 
            title="Conditions Générales d'Utilisation" 
            onClick={() => handleNavigation("/settings/terms", "CGU")} 
          />
          <SettingItem 
            icon="🔒" 
            title="Politique de confidentialité" 
            onClick={() => handleNavigation("/settings/privacy-policy", "Politique de confidentialité")} 
          />
          <SettingItem 
            icon="ℹ️" 
            title="À propos de l'application" 
            onClick={() => handleNavigation("/settings/about", "À propos")} 
          />
        </SettingsGroup>

        <div style={{ height: "32px" }} />

        {/* 🛑 BOUTON SE DÉCONNECTER */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: colors.card,
            border: `1px solid rgba(239, 68, 68, 0.3)`,
            borderRadius: "12px",
            color: colors.red,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.card}
        >
          <span>🚪</span>
          Se déconnecter
        </button>

        <div style={{ height: "40px" }} />
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// --- Composants Helpers ---

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#FFFFFF", marginBottom: "10px", marginTop: "0" }}>
      {title}
    </h3>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "#1A1A1A",
      borderRadius: "14px",
      border: "1px solid #2A2A2A",
      overflow: "hidden"
    }}>
      {children}
    </div>
  );
}

function SettingItem({ icon, title, onClick }: { icon: string, title: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: "flex", alignItems: "center", padding: "12px 16px", 
        borderBottom: "1px solid #2A2A2A", cursor: "pointer", transition: "background 0.2s"
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    >
      <span style={{ fontSize: "22px", marginRight: "16px", color: "#8B5CF6" }}>{icon}</span>
      <span style={{ flex: 1, color: "#FFFFFF", fontSize: "15px", fontWeight: 500 }}>{title}</span>
      <span style={{ color: "#9CA3AF", fontSize: "20px" }}>›</span>
    </div>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean, onChange: () => void }) {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        backgroundColor: value ? "#8B5CF6" : "#4B5563",
        position: "relative",
        cursor: "pointer",
        transition: "background-color 0.3s"
      }}
    >
      <div style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "#FFFFFF",
        position: "absolute",
        top: "2px",
        left: value ? "22px" : "2px",
        transition: "left 0.3s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
      }} />
    </div>
  );
}