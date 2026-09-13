"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  // États pour les options de confidentialité
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);

  // ✅ Couleurs dynamiques
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    divider: theme.border,
    switchBgOff: isDark ? "#4B5563" : "#D1D5DB",
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: colors.bg, 
      color: colors.text, 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    }}>
      
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: `1px solid ${colors.divider}`, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Confidentialité</h1>
      </div>

      {/* Liste des paramètres */}
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        
        <SettingItem 
          title="Profil privé" 
          subtitle="Seuls vos abonnés peuvent voir vos publications" 
          value={isPrivateProfile} 
          onChange={setIsPrivateProfile} 
          colors={colors} 
        />
        
        <Divider color={colors.divider} />

        <SettingItem 
          title="Statut en ligne" 
          subtitle="Afficher quand vous êtes connecté" 
          value={showOnlineStatus} 
          onChange={setShowOnlineStatus} 
          colors={colors} 
        />

        <Divider color={colors.divider} />

        <SettingItem 
          title="Messages directs" 
          subtitle="Autoriser les fans à vous envoyer des messages" 
          value={allowDirectMessages} 
          onChange={setAllowDirectMessages} 
          colors={colors} 
        />

      </div>
    </div>
  );
}

// --- Composants Helpers ---

function SettingItem({ title, subtitle, value, onChange, colors }: any) {
  return (
    <div 
      onClick={() => onChange(!value)}
      style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "16px 0", 
        cursor: "pointer" 
      }}
    >
      <div style={{ flex: 1, paddingRight: "16px" }}>
        <div style={{ color: colors.text, fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>
          {title}
        </div>
        <div style={{ color: colors.textMuted, fontSize: "14px" }}>
          {subtitle}
        </div>
      </div>
      
      {/* Switch personnalisé */}
      <div 
        onClick={(e) => { e.stopPropagation(); onChange(!value); }}
        style={{
          width: "50px",
          height: "30px",
          borderRadius: "15px",
          backgroundColor: value ? colors.primary : colors.switchBgOff,
          position: "relative",
          transition: "background-color 0.3s ease",
          flexShrink: 0
        }}
      >
        <div style={{
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          backgroundColor: "#FFFFFF",
          position: "absolute",
          top: "2px",
          left: value ? "22px" : "2px",
          transition: "left 0.3s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }} />
      </div>
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return <div style={{ height: "1px", backgroundColor: color, margin: "0" }} />;
}