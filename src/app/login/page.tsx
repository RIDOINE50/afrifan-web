"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

      // 2. ✅ VÉRIFICATION DU STATUT DE BANNISSEMENT
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_banned")
          .eq("id", data.user.id)
          .single();

        // Si le profil existe et est marqué comme banni
        if (profile?.is_banned === true) {
          // On déconnecte immédiatement l'utilisateur
          await supabase.auth.signOut();
          
          // On affiche le message d'erreur spécifique
          setError("🚫 Votre compte a été banni de la plateforme Afrifan. Veuillez contacter le support pour plus d'informations.");
          setIsLoading(false);
          return; // ⛔ ON ARRÊTE TOUT ICI. Pas de redirection vers /home.
        }
      }

      // 3. Si tout est bon (pas banni), on redirige vers l'accueil
      router.push("/home");       
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ STYLES TYPSÉS POUR ÉVITER LES ERREURS VERCEL/TYPESCRIPT
  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0A0A0A",
      padding: "16px",
    },
    card: {
      width: "100%",
      maxWidth: "448px",
      backgroundColor: "#1A1A1A",
      border: "1px solid #2A2A2A",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    },
    title: {
      fontSize: "30px",
      fontWeight: "bold",
      color: "#FFFFFF",
      marginBottom: "8px",
      textAlign: "center",
    },
    subtitle: {
      color: "#9CA3AF",
      textAlign: "center",
      marginBottom: "32px",
    },
    errorBox: {
      marginBottom: "24px",
      padding: "12px",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.5)",
      borderRadius: "8px",
      color: "#F87171",
      fontSize: "14px",
      textAlign: "center",
      lineHeight: "1.5",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#9CA3AF",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      backgroundColor: "#0A0A0A",
      border: "1px solid #2A2A2A",
      color: "#FFFFFF",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "16px",
      outline: "none",
      transition: "all 0.2s",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      backgroundColor: "#8B5CF6",
      color: "#FFFFFF",
      fontWeight: "bold",
      padding: "14px",
      borderRadius: "12px",
      border: "none",
      fontSize: "16px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    divider: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginTop: "32px",
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      backgroundColor: "#2A2A2A",
    },
    dividerText: {
      color: "#9CA3AF",
      fontSize: "14px",
    },
    socialButton: {
      padding: "12px",
      borderRadius: "9999px",
      backgroundColor: "#0A0A0A",
      border: "1px solid #2A2A2A",
      cursor: "pointer",
      transition: "all 0.2s",
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    footer: {
      textAlign: "center",
      marginTop: "32px",
      color: "#9CA3AF",
      fontSize: "14px",
    },
    link: {
      color: "#8B5CF6",
      fontWeight: "600",
      cursor: "pointer",
      background: "none",
      border: "none",
      fontSize: "14px",
      padding: 0,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Connexion</h1>
        <p style={styles.subtitle}>Heureux de vous revoir 👋</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={styles.label}>Email ou numéro de téléphone</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={styles.input}
              placeholder="ton@email.com"
              onFocus={(e) => (e.target.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
            />
          </div>

          <div>
            <label style={styles.label}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                onFocus={(e) => (e.target.style.borderColor = "#8B5CF6")}
                onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
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
                  color: "#9CA3AF",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "left" as const }}>
            <button type="button" style={styles.link}>
              Mot de passe oublié ?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>Ou continuer avec</span>
          <div style={styles.dividerLine}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
          <button style={styles.socialButton}>G</button>
          <button style={styles.socialButton}>f</button>
          <button style={styles.socialButton}>X</button>
        </div>

        <div style={styles.footer}>
          Pas encore de compte ?{" "}
          <button 
            type="button"
            style={styles.link}
            onClick={() => router.push("/register")} // Assure-toi que cette route existe
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
}