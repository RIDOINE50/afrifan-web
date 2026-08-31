"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AboutAppPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const colors = {
    bg: "#000000",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    primary: "#8B5CF6",
    red: "#EF4444",
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm(
      "⚠️ Êtes-vous sûr de vouloir supprimer votre compte ?\n\nCette action est irréversible. Toutes vos données, publications et abonnements seront définitivement perdus."
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // TODO: Appeler ta fonction de suppression de compte Supabase ici
      // await supabase.auth.admin.deleteUser(user.id);
      // ou via une Edge Function pour plus de sécurité
      
      alert("Compte supprimé avec succès.");
      router.push("/login");
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      alert("Erreur lors de la suppression du compte.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: colors.bg, 
      color: colors.text, 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: "1px solid #1A1A1A", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>À propos</h1>
      </div>

      {/* Contenu centré */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "20px"
      }}>
        
        {/* Icône étoile dans cercle violet */}
        <div style={{ 
          padding: "20px", 
          backgroundColor: `${colors.primary}1A`, // 0.1 opacity en hex
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px"
        }}>
          <span style={{ fontSize: "60px", color: colors.primary }}>⭐</span>
        </div>

        {/* Nom de l'application */}
        <h2 style={{ 
          color: colors.text, 
          fontSize: "28px", 
          fontWeight: "bold", 
          margin: "0 0 8px 0" 
        }}>
          Afrifan
        </h2>

        {/* Version */}
        <p style={{ 
          color: colors.textMuted, 
          fontSize: "16px", 
          margin: "0 0 40px 0" 
        }}>
          Version 1.0.0
        </p>

        {/* Description */}
        <p style={{ 
          color: colors.textMuted, 
          fontSize: "15px", 
          lineHeight: 1.5, 
          textAlign: "center",
          maxWidth: "400px",
          margin: "0 0 40px 0"
        }}>
          Développé avec ❤️ pour connecter les créateurs et leurs fans.
        </p>

        {/* Bouton Supprimer mon compte */}
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          style={{
            background: "none",
            border: "none",
            color: colors.red,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isDeleting ? "not-allowed" : "pointer",
            padding: "12px 24px",
            textDecoration: "underline",
            opacity: isDeleting ? 0.5 : 1,
            transition: "opacity 0.2s"
          }}
        >
          {isDeleting ? "Suppression en cours..." : "Supprimer mon compte"}
        </button>

      </div>
    </div>
  );
}