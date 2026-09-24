"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// ─── COMPOSANT INTERNE (utilise useSearchParams) ─────────
function VerifyOtpResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useAppTheme();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState("");
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

  useEffect(() => {
    if (!email) router.push("/forgot-password");
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setMessage(" Le code doit contenir exactement 6 chiffres.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: "email",
    });

    if (error) {
      setMessage("❌ Code invalide ou expiré. Veuillez réessayer.");
    } else {
      router.push("/update-password");
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: colors.card, padding: "32px", borderRadius: "16px", border: `1px solid ${colors.border}` }}>
        
        <button onClick={() => router.push("/forgot-password")} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "24px", cursor: "pointer", marginBottom: "24px" }}>←</button>
        
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: colors.text }}>Vérification</h1>
        <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "24px", lineHeight: 1.5 }}>
          Entrez le code à 6 chiffres envoyé à <strong>{email}</strong>
        </p>

        {message && (
          <div style={{ 
            padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px",
            backgroundColor: message.includes("✅") ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: message.includes("✅") ? "#22C55E" : "#EF4444"
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: colors.text }}>Code de vérification</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="0 0 0 0 0 0"
              style={{ 
                width: "100%", padding: "12px 16px", backgroundColor: colors.bg, 
                border: `1px solid ${colors.border}`, borderRadius: "8px", 
                color: colors.text, fontSize: "24px", letterSpacing: "8px", textAlign: "center",
                outline: "none", boxSizing: "border-box", fontWeight: "bold"
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
            {isLoading ? "Vérification..." : "Valider le code"}
          </button>
        </form>
        
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button onClick={() => router.push("/forgot-password")} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: "14px" }}>
            Renvoyer le code
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EXPORT PRINCIPAL AVEC SUSPENSE ──────────────────────
export default function VerifyOtpResetPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A", color: "#FFFFFF" }}>
        Chargement...
      </div>
    }>
      <VerifyOtpResetContent />
    </Suspense>
  );
}