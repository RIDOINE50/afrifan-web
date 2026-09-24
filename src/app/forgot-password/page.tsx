"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // 🔑 shouldCreateUser: false empêche la création d'un nouveau compte
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false, 
        emailRedirectTo: `${window.location.origin}/update-password`
      }
    });

    if (error) {
      if (error.message.includes("User not found") || error.message.includes("not found")) {
        setMessage("❌ Aucun compte n'est associé à cette adresse email.");
      } else {
        setMessage(`❌ Erreur : ${error.message}`);
      }
    } else {
      setMessage("✅ Code de vérification envoyé à votre email !");
      // 👉 REDIRECTION VERS LE NOUVEAU DOSSIER
      setTimeout(() => {
        router.push(`/verify-otp-reset?email=${encodeURIComponent(email)}`);
      }, 1500);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: colors.card, padding: "32px", borderRadius: "16px", border: `1px solid ${colors.border}` }}>
        
        <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "24px", cursor: "pointer", marginBottom: "24px" }}>←</button>
        
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: colors.text }}>Mot de passe oublié</h1>
        <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "24px", lineHeight: 1.5 }}>
          Entrez l'email associé à votre compte. Nous vous enverrons un code de vérification.
        </p>

        {message && (
          <div style={{ 
            padding: "12px", 
            borderRadius: "8px", 
            marginBottom: "20px", 
            fontSize: "14px",
            backgroundColor: message.includes("✅") ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: message.includes("✅") ? "#22C55E" : "#EF4444"
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.text }}>Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
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
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? "Vérification..." : "Envoyer le code"}
          </button>
        </form>
      </div>
    </div>
  );
}