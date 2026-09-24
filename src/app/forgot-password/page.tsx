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

    // L'URL vers laquelle l'utilisateur sera redirigé après avoir cliqué dans l'email
    const redirectUrl = `${window.location.origin}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    } else {
      setMessage("✅ Un lien de réinitialisation a été envoyé à votre email. Vérifiez vos spams !");
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: colors.card, padding: "32px", borderRadius: "16px", border: `1px solid ${colors.border}` }}>
        
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "24px", cursor: "pointer", marginBottom: "24px" }}>←</button>
        
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: colors.text }}>Mot de passe oublié ?</h1>
        <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "24px", lineHeight: 1.5 }}>
          Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
              placeholder="exemple@email.com"
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
            {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: "14px" }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}