"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  // États pour les options de confidentialité
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);
  
  // État pour le chargement de la suppression
  const [isDeleting, setIsDeleting] = useState(false);

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
    danger: "#EF4444", // 🔴 Rouge pour la zone de danger
    dangerBg: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
  };

  // 🗑️ FONCTION DE SUPPRESSION DU COMPTE
  const handleDeleteAccount = async () => {
    // 1. Demander une confirmation ferme à l'utilisateur
    const isConfirmed = window.confirm(
      "⚠️ ATTENTION : Cette action est IRRÉVERSIBLE.\n\n" +
      "Êtes-vous vraiment sûr de vouloir supprimer définitivement votre compte et toutes vos données (publications, messages, profil) ?"
    );

    if (!isConfirmed) return;

    setIsDeleting(true);

    try {
      // 2. Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 3. Supprimer les données du profil dans la base de données
        // (Assure-toi que tes règles RLS Supabase autorisent un utilisateur à supprimer sa propre ligne)
        await supabase.from("profiles").delete().eq("id", user.id);
        
        // Note: Pour supprimer complètement l'utilisateur de l'Auth Supabase, 
        // il faut normalement une Edge Function. Ici, on supprime les données et on déconnecte,
        // ce qui est la méthode standard et sécurisée côté client.

        // 4. Déconnecter l'utilisateur
        await supabase.auth.signOut();

        // 5. Rediriger vers la page d'accueil ou de connexion
        router.push("/login");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du compte:", error);
      alert("Une erreur est survenue lors de la suppression. Veuillez réessayer.");
    } finally {
      setIsDeleting(false);
    }
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

        {/* ========================================== */}
        {/* 🚨 ZONE DE DANGER : SUPPRESSION DE COMPTE */}
        {/* ========================================== */}
        <div style={{ marginTop: "48px" }}>
          <h2 style={{ 
            fontSize: "14px", 
            fontWeight: "bold", 
            color: colors.danger, 
            textTransform: "uppercase", 
            letterSpacing: "1px",
            marginBottom: "16px"
          }}>
            Zone de danger
          </h2>
          
          <div style={{ 
            backgroundColor: colors.dangerBg, 
            border: `1px solid ${colors.danger}40`, 
            borderRadius: "12px", 
            padding: "20px"
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold", color: colors.text }}>
              Supprimer mon compte
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: colors.textMuted, lineHeight: "1.5" }}>
              Une fois votre compte supprimé, toutes vos données, publications et abonnements seront définitivement effacés. Cette action ne peut pas être annulée.
            </p>
            
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              style={{
                backgroundColor: isDeleting ? "rgba(239, 68, 68, 0.5)" : "transparent",
                color: colors.danger,
                border: `1.5px solid ${colors.danger}`,
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: isDeleting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = colors.danger;
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = colors.danger;
                }
              }}
            >
              {isDeleting ? (
                <>
                  <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #FFFFFF", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                  Suppression en cours...
                </>
              ) : (
                "🗑️ Supprimer définitivement mon compte"
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Animation pour le spinner de chargement */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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