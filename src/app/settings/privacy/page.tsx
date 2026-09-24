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
  
  // États pour la suppression du compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    danger: "#EF4444",
    dangerBg: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
  };

  // 🗑️ Ouvre la modale de confirmation
  const handleDeleteClick = () => {
    setErrorMsg("");
    setShowDeleteModal(true);
  };

  // 🗑️ Exécute la suppression via l'Edge Function
 const confirmDeleteAccount = async () => {
  setIsDeleting(true);
  setErrorMsg("");
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Utilisateur non trouvé");

    // 1. Marquer le compte comme supprimé (au lieu de le supprimer)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_deleted: true })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // 2. Déconnecter l'utilisateur
    await supabase.auth.signOut();

    // 3. Rediriger vers la page de connexion
    router.push("/login");
    
  } catch (error: any) {
    console.error("Erreur:", error);
    setErrorMsg(error.message || "Une erreur est survenue");
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
              onClick={handleDeleteClick}
              disabled={isDeleting}
              style={{
                backgroundColor: "transparent",
                color: colors.danger,
                border: `1.5px solid ${colors.danger}`,
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.danger;
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = colors.danger;
              }}
            >
              🗑️ Supprimer définitivement mon compte
            </button>
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* 🎯 MODALE DE CONFIRMATION PERSONNALISÉE */}
      {/* ========================================== */}
      {showDeleteModal && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", 
          zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: colors.card, border: `1px solid ${colors.border}`,
            borderRadius: "16px", padding: "24px", maxWidth: "400px", width: "100%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: colors.danger, marginBottom: "12px" }}>
              Supprimer le compte ?
            </h3>
            <p style={{ fontSize: "14px", color: colors.textMuted, lineHeight: "1.5", marginBottom: "20px" }}>
              Cette action est <strong>irréversible</strong>. Toutes vos données, publications et messages seront définitivement effacés de nos serveurs.
            </p>
            
            {errorMsg && (
              <div style={{
                padding: "10px", backgroundColor: "rgba(239, 68, 68, 0.1)", 
                border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px",
                color: colors.danger, fontSize: "13px", marginBottom: "16px"
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{
                  padding: "10px 16px", borderRadius: "8px", border: `1px solid ${colors.border}`,
                  backgroundColor: "transparent", color: colors.text, fontWeight: "bold", cursor: "pointer"
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={isDeleting}
                style={{
                  padding: "10px 16px", borderRadius: "8px", border: "none",
                  backgroundColor: colors.danger, color: "#FFFFFF", fontWeight: "bold", 
                  cursor: isDeleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                {isDeleting ? (
                  <>
                    <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid #FFFFFF", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                    Suppression...
                  </>
                ) : (
                  "Oui, supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", cursor: "pointer" }}
    >
      <div style={{ flex: 1, paddingRight: "16px" }}>
        <div style={{ color: colors.text, fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{title}</div>
        <div style={{ color: colors.textMuted, fontSize: "14px" }}>{subtitle}</div>
      </div>
      <div 
        onClick={(e) => { e.stopPropagation(); onChange(!value); }}
        style={{
          width: "50px", height: "30px", borderRadius: "15px",
          backgroundColor: value ? colors.primary : colors.switchBgOff,
          position: "relative", transition: "background-color 0.3s ease", flexShrink: 0
        }}
      >
        <div style={{
          width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "#FFFFFF",
          position: "absolute", top: "2px", left: value ? "22px" : "2px",
          transition: "left 0.3s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }} />
      </div>
    </div>
  );
}

function Divider({ color }: { color: string }) {
  return <div style={{ height: "1px", backgroundColor: color, margin: "0" }} />;
}