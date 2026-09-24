"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Tentative de connexion
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (signInError) throw signInError;

      // 2. ✅ VÉRIFICATION DU STATUT
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_banned, is_deleted")
          .eq("id", data.user.id)
          .single();

        if (profile?.is_banned === true) {
          await supabase.auth.signOut();
          setError("Votre compte a été banni de la plateforme Afrifan. Veuillez contacter le support.");
          setIsLoading(false);
          return;
        }

        if (profile?.is_deleted === true) {
          await supabase.auth.signOut();
          setError("Ce compte a été supprimé. Veuillez créer un nouveau compte.");
          setIsLoading(false);
          return;
        }
      }

      // 3. Si tout est bon, on redirige
      router.push("/home");
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Styles professionnels
  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      position: "relative",
      padding: "24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    overlay: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(10, 10, 10, 0.85)",
      backdropFilter: "blur(8px)",
    },
    card: {
      position: "relative",
      width: "100%",
      maxWidth: "440px",
      backgroundColor: "rgba(26, 26, 26, 0.8)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "24px",
      padding: "40px 32px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
    },
    header: {
      textAlign: "center",
      marginBottom: "32px",
    },
    logoContainer: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "48px",
      height: "48px",
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      marginBottom: "16px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: "8px",
      letterSpacing: "-0.5px",
    },
    subtitle: {
      color: "#9CA3AF",
      fontSize: "15px",
      lineHeight: "1.5",
    },
    errorBox: {
      marginBottom: "24px",
      padding: "12px 16px",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: "12px",
      color: "#F87171",
      fontSize: "14px",
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#D1D5DB",
      marginBottom: "8px",
    },
    inputWrapper: {
      position: "relative",
      marginBottom: "20px",
    },
    inputIcon: {
      position: "absolute",
      left: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#6B7280",
      pointerEvents: "none" as const,
    },
    input: {
      width: "100%",
      backgroundColor: "rgba(10, 10, 10, 0.6)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: "#FFFFFF",
      borderRadius: "12px",
      padding: "14px 16px 14px 44px", // Padding gauche augmenté pour l'icône
      fontSize: "15px",
      outline: "none",
      transition: "all 0.2s ease",
      boxSizing: "border-box" as const,
    },
    passwordToggle: {
      position: "absolute",
      right: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#6B7280",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px",
      transition: "color 0.2s",
    },
    forgotPassword: {
      display: "block",
      textAlign: "right",
      color: "#9CA3AF",
      fontSize: "14px",
      fontWeight: "500",
      textDecoration: "none",
      marginBottom: "24px",
      cursor: "pointer",
      transition: "color 0.2s",
      background: "none",
      border: "none",
      padding: 0,
    },
    button: {
      width: "100%",
      backgroundColor: "#FFFFFF",
      color: "#0A0A0A",
      fontWeight: "600",
      padding: "14px",
      borderRadius: "12px",
      border: "none",
      fontSize: "16px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      boxShadow: "0 4px 6px -1px rgba(255, 255, 255, 0.1)",
    },
    footer: {
      textAlign: "center",
      marginTop: "32px",
      color: "#9CA3AF",
      fontSize: "14px",
    },
    link: {
      color: "#FFFFFF",
      fontWeight: "600",
      cursor: "pointer",
      background: "none",
      border: "none",
      fontSize: "14px",
      padding: 0,
      textDecoration: "underline",
      textDecorationColor: "rgba(255,255,255,0.3)",
      textUnderlineOffset: "4px",
      transition: "color 0.2s",
    },
  };

  return (
    <div style={styles.container}>
      {/* Overlay sombre pour lisibilité */}
      <div style={styles.overlay} />

      <div style={styles.card}>
        {/* En-tête avec Logo */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Zap color="#0A0A0A" size={24} strokeWidth={2.5} />
          </div>
          <h1 style={styles.title}>Connexion à Afrifan</h1>
          <p style={styles.subtitle}>Accédez à votre espace créateur et gérez votre communauté.</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Champ Email */}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Adresse email</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.input}
                placeholder="nom@exemple.com"
                onFocus={(e) => {
                  e.target.style.borderColor = "#FFFFFF";
                  e.target.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                onFocus={(e) => {
                  e.target.style.borderColor = "#FFFFFF";
                  e.target.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Lien Mot de passe oublié */}
          <button 
            type="button" 
            style={styles.forgotPassword}
            onClick={() => router.push("/forgot-password")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
          >
            Mot de passe oublié ?
          </button>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {isLoading ? (
              "Connexion en cours..."
            ) : (
              <>
                Se connecter
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Pied de page */}
        <div style={styles.footer}>
          Pas encore de compte ?{" "}
          <button
            type="button"
            style={styles.link}
            onClick={() => router.push("/register")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          >
            Créer un compte gratuitement
          </button>
        </div>
      </div>
    </div>
  );
}