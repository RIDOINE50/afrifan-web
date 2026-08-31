"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ChangePasswordPage() {
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    error: "#EF4444",
    success: "#22C55E",
  };

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    let isValid = true;

    if (!password.trim()) {
      newErrors.password = "Veuillez entrer un mot de passe";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) throw error;

      setMessage({ type: 'success', text: "Mot de passe mis à jour avec succès ! 🔐" });
      setPassword("");
      setConfirmPassword("");
      setErrors({});
      
      // Optionnel : rediriger vers les paramètres après 1.5s
      setTimeout(() => {
        router.push("/settings");
      }, 1500);

    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.message || "Erreur lors de la mise à jour du mot de passe." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: `1px solid ${colors.border}`, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px" }}>←</button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Sécurité</h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}>
        
        <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "24px" }}>
          Choisissez un mot de passe fort pour protéger l'accès à votre compte.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Message global de succès ou d'erreur */}
          {message && (
            <div style={{ 
              padding: "12px 16px", 
              borderRadius: "8px", 
              marginBottom: "24px", 
              backgroundColor: message.type === 'success' ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === 'success' ? colors.success : colors.error}`,
              color: message.type === 'success' ? colors.success : colors.error,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              {message.type === 'success' ? "✅" : "⚠️"} {message.text}
            </div>
          )}

          {/* --- NOUVEAU MOT DE PASSE --- */}
          <label style={{ display: "block", fontWeight: "bold", color: colors.text, fontSize: "14px", marginBottom: "8px" }}>
            Nouveau mot de passe
          </label>
          <div style={{ position: "relative", marginBottom: errors.password ? "4px" : "20px" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.textMuted, fontSize: "20px" }}>🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              style={{
                width: "100%",
                padding: "14px 48px 14px 48px",
                backgroundColor: colors.card,
                border: `1.5px solid ${errors.password ? colors.error : colors.border}`,
                borderRadius: "12px",
                color: colors.text,
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textMuted,
                fontSize: "20px",
                padding: "4px"
              }}
              title={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.password && (
            <p style={{ color: colors.error, fontSize: "12px", marginTop: "4px", marginBottom: "20px" }}>
              {errors.password}
            </p>
          )}

          {/* --- CONFIRMER LE MOT DE PASSE --- */}
          <label style={{ display: "block", fontWeight: "bold", color: colors.text, fontSize: "14px", marginBottom: "8px" }}>
            Confirmer le nouveau mot de passe
          </label>
          <div style={{ position: "relative", marginBottom: errors.confirmPassword ? "4px" : "32px" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.textMuted, fontSize: "20px" }}>🔒</span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              style={{
                width: "100%",
                padding: "14px 48px 14px 48px",
                backgroundColor: colors.card,
                border: `1.5px solid ${errors.confirmPassword ? colors.error : colors.border}`,
                borderRadius: "12px",
                color: colors.text,
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: colors.textMuted,
                fontSize: "20px",
                padding: "4px"
              }}
              title={showConfirmPassword ? "Masquer" : "Afficher"}
            >
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          {errors.confirmPassword && (
            <p style={{ color: colors.error, fontSize: "12px", marginTop: "4px", marginBottom: "32px" }}>
              {errors.confirmPassword}
            </p>
          )}

          {/* --- BOUTON DE SAUVEGARDE --- */}
          <button
            type="submit"
            disabled={isSaving}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: isSaving ? "#374151" : colors.primary,
              border: "none",
              borderRadius: "12px",
              color: colors.text,
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isSaving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
          >
            {isSaving ? (
              <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #FFFFFF", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            ) : (
              "Mettre à jour le mot de passe"
            )}
          </button>

        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}