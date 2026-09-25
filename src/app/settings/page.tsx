"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// === ICÔNES SVG ===
const SvgIcon = ({ path, size = 20, color = "currentColor", fill = "none" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  User:     (p: any) => <SvgIcon {...p} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  Lock:     (p: any) => <SvgIcon {...p} path={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />,
  Shield:   (p: any) => <SvgIcon {...p} path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>} />,
  Bell:     (p: any) => <SvgIcon {...p} path={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />,
  Moon:     (p: any) => <SvgIcon {...p} path={<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>} />,
  Sun:      (p: any) => <SvgIcon {...p} path={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>} />,
  Globe:    (p: any) => <SvgIcon {...p} path={<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />,
  Help:     (p: any) => <SvgIcon {...p} path={<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />,
  File:     (p: any) => <SvgIcon {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>} />,
  Info:     (p: any) => <SvgIcon {...p} path={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>} />,
  Logout:   (p: any) => <SvgIcon {...p} path={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>} />,
  Settings: (p: any) => <SvgIcon {...p} path={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>} />,
  ChevronLeft: (p: any) => <SvgIcon {...p} path={<><path d="m15 18-6-6 6-6" /></>} />,
};

export default function SettingsPage() {
  const router = useRouter();
  const { isDark, theme, toggleTheme } = useAppTheme();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isFrench, setIsFrench] = useState(true);

  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    red: "#EF4444",
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

  const handleNavigation = (path: string, featureName: string) => {
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
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: "4px", display: "flex" }}>
          <Icons.ChevronLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>Paramètres</h1>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 16px" }}>
        
        {/* BANNIÈRE */}
        <div style={{
          width: "100%",
          padding: "20px",
          background: isDark 
            ? "linear-gradient(135deg, #1E1B4B, #4338CA)" 
            : "linear-gradient(135deg, #000000, #374151)",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px"
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0" }}>
              Bonjour, {firstName}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0 }}>
              Gérez votre compte et vos préférences
            </p>
          </div>
          <div style={{ opacity: 0.5, color: "#FFFFFF", display: "flex" }}>
            <Icons.Settings size={48} color="#FFFFFF" />
          </div>
        </div>

        {/* SECTION COMPTE */}
        <SectionTitle title="Paramètres du compte" color={colors.text} />
        <SettingsGroup bg={colors.card} border={colors.border}>
          <SettingItem 
            icon={<Icons.User size={22} color={colors.primary} />} 
            title="Informations personnelles" 
            onClick={() => handleNavigation("/settings/personal-info", "Informations personnelles")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
          <SettingItem 
            icon={<Icons.Lock size={22} color={colors.primary} />} 
            title="Sécurité" 
            onClick={() => handleNavigation("/settings/security", "Sécurité")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
          <SettingItem 
            icon={<Icons.Shield size={22} color={colors.primary} />} 
            title="Confidentialité" 
            onClick={() => handleNavigation("/settings/privacy", "Confidentialité")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
          <SettingItem 
            icon={<Icons.Bell size={22} color={colors.primary} />} 
            title="Notifications" 
            onClick={() => handleNavigation("/settings/notifications", "Notifications")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
          
          {/* Toggle Mode Sombre */}
          <div style={{ 
            display: "flex", alignItems: "center", padding: "12px 16px", 
            borderBottom: `1px solid ${colors.border}`, cursor: "pointer" 
          }} onClick={toggleTheme}>
            <span style={{ marginRight: "16px", color: colors.primary, display: "flex" }}>
              {isDark ? <Icons.Moon size={22} /> : <Icons.Sun size={22} />}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: "15px", fontWeight: 500 }}>
                {isDark ? "Mode sombre" : "Mode clair"}
              </div>
              <div style={{ color: colors.textMuted, fontSize: "12px" }}>Apparence de l'application</div>
            </div>
            <ToggleSwitch value={isDark} onChange={toggleTheme} primary={colors.primary} border={colors.border} />
          </div>

          {/* Toggle Langue */}
          <div style={{ 
            display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer" 
          }} onClick={() => setIsFrench(!isFrench)}>
            <span style={{ marginRight: "16px", color: colors.primary, display: "flex" }}>
              <Icons.Globe size={22} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ color: colors.text, fontSize: "15px", fontWeight: 500 }}>
                {isFrench ? "Langue : Français" : "Language: English"}
              </div>
              <div style={{ color: colors.textMuted, fontSize: "12px" }}>Change language / Changer de langue</div>
            </div>
            <ToggleSwitch value={isFrench} onChange={() => setIsFrench(!isFrench)} primary={colors.primary} border={colors.border} />
          </div>
        </SettingsGroup>

        <div style={{ height: "28px" }} />

        {/* SECTION ASSISTANCE */}
        <SectionTitle title="Assistance & Informations" color={colors.text} />
        <SettingsGroup bg={colors.card} border={colors.border}>
          <SettingItem 
            icon={<Icons.Help size={22} color={colors.primary} />} 
            title="Aide / FAQ" 
            onClick={() => handleNavigation("/settings/faq", "Aide / FAQ")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
          <SettingItem 
            icon={<Icons.File size={22} color={colors.primary} />} 
            title="Conditions Générales d'Utilisation" 
            onClick={() => handleNavigation("/settings/terms", "CGU")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
          <SettingItem 
            icon={<Icons.Lock size={22} color={colors.primary} />} 
            title="Politique de confidentialité" 
            onClick={() => handleNavigation("/settings/privacy-policy", "Politique de confidentialité")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
          <SettingItem 
            icon={<Icons.Info size={22} color={colors.primary} />} 
            title="À propos de l'application" 
            onClick={() => handleNavigation("/settings/about", "À propos")} 
            text={colors.text}
            textMuted={colors.textMuted}
            border={colors.border}
            hover={colors.hover}
          />
        </SettingsGroup>

        <div style={{ height: "32px" }} />

        {/* BOUTON SE DÉCONNECTER */}
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
          <Icons.Logout size={20} color={colors.red} />
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

function SectionTitle({ title, color }: { title: string, color: string }) {
  return (
    <h3 style={{ fontSize: "15px", fontWeight: "bold", color, marginBottom: "10px", marginTop: "0" }}>
      {title}
    </h3>
  );
}

function SettingsGroup({ children, bg, border }: { children: React.ReactNode, bg: string, border: string }) {
  return (
    <div style={{
      backgroundColor: bg,
      borderRadius: "14px",
      border: `1px solid ${border}`,
      overflow: "hidden"
    }}>
      {children}
    </div>
  );
}

function SettingItem({ 
  icon, title, onClick, text, textMuted, border, hover 
}: { 
  icon: React.ReactNode, 
  title: string, 
  onClick: () => void,
  text: string,
  textMuted: string,
  border: string,
  hover: string
}) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: "flex", alignItems: "center", padding: "12px 16px", 
        borderBottom: `1px solid ${border}`, cursor: "pointer", transition: "background 0.2s"
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hover}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
    >
      <span style={{ marginRight: "16px", display: "flex" }}>{icon}</span>
      <span style={{ flex: 1, color: text, fontSize: "15px", fontWeight: 500 }}>{title}</span>
      <span style={{ color: textMuted, fontSize: "20px" }}>›</span>
    </div>
  );
}

function ToggleSwitch({ 
  value, onChange, primary, border 
}: { 
  value: boolean, 
  onChange: () => void,
  primary: string,
  border: string
}) {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: "44px",
        height: "24px",
        borderRadius: "12px",
        backgroundColor: value ? primary : border,
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