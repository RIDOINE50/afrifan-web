"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    green: "#22C55E",
    red: "#EF4444",
  };

  // Vérifier si l'utilisateur a bien cliqué sur le lien de l'email
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage("️ Lien invalide ou expiré. Veuillez refaire une demande.");
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("❌ Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("❌ Le mot de passe doit contenir au moins 6 caractères.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    } else {
      setMessage("✅ Mot de passe mis à jour avec succès ! Redirection...");
      setTimeout(() => router.push("/login"), 2000);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: colors.card, padding: "32px", borderRadius: "16px", border: `1px solid ${colors.border}` }}>
        
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: colors.text }}>Nouveau mot de passe</h1>
        <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "24px", lineHeight: 1.5 }}>
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>

        {message && (
          <div style={{ 
            padding: "12px", 
            borderRadius: "8px", 
            marginBottom: "20px", 
            fontSize: "14px",
            backgroundColor: message.includes("✅") ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: message.includes("✅") ? colors.green : colors.red
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.text }}>Nouveau mot de passe</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={{ 
                width: "100%", padding: "12px 16px", backgroundColor: colors.bg, 
                border: `1px solid ${colors.border}`, borderRadius: "8px", 
                color: colors.text, fontSize: "15px", outline: "none", boxSizing: "border-box" 
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.text }}>Confirmer le mot de passe</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{ 
                width: "100%", padding: "12px 16px", backgroundColor: colors.bg, 
                border: `1px solid ${colors.border}`, borderRadius: "8px", 
                color: colors.text, fontSize: "15px", outline: "none", boxSizing: "border-box" 
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: "100%", padding: "14px", backgroundColor: colors.primary, 
              color: colors.primaryText, border: "none", borderRadius: "8px", 
              fontWeight: "bold", fontSize: "16px", cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              marginTop: "8px"
            }}
          >
            {isLoading ? "Mise à jour..." : "Valider le nouveau mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}