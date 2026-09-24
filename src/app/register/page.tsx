"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, User, Mail, AlertCircle, CheckCircle, Loader2, Zap, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // ✅ Vérification en temps réel
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Debounce pour la vérification email (500ms)
  useEffect(() => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setEmailExists(false);
      setEmailError("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      setEmailError("");
      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", trimmedEmail)
          .maybeSingle();

        if (existingProfile) {
          setEmailExists(true);
          setEmailError("Cet email est déjà utilisé.");
        } else {
          setEmailExists(false);
          setEmailError("");
        }
      } catch (err) {
        console.error("Erreur vérification email:", err);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!accepted) {
      setGeneralError("Veuillez accepter les conditions d'utilisation.");
      return;
    }
    if (!fullName.trim() || !email.trim()) {
      setGeneralError("Veuillez remplir tous les champs.");
      return;
    }
    if (!isValidEmail(email)) {
      setGeneralError("Veuillez entrer une adresse email valide.");
      return;
    }
    if (emailExists) {
      setGeneralError("Cet email est déjà enregistré. Veuillez vous connecter.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).slice(-8), // Mot de passe temporaire sécurisé
        options: { data: { full_name: fullName.trim() } },
      });

      if (signUpError) throw signUpError;

      // Redirection vers la page de vérification OTP
      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      setGeneralError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || emailExists || isCheckingEmail;

  // ✅ Styles professionnels (identiques à LoginPage pour la cohérence)
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
      padding: "14px 16px 14px 44px",
      fontSize: "15px",
      outline: "none",
      transition: "all 0.2s ease",
      boxSizing: "border-box" as const,
    },
    validationIcon: {
      position: "absolute",
      right: "14px",
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxWrapper: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      marginBottom: "24px",
      cursor: "pointer",
    },
    checkbox: {
      appearance: "none" as const,
      width: "20px",
      height: "20px",
      border: "2px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "6px",
      backgroundColor: "rgba(10, 10, 10, 0.6)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
      marginTop: "2px",
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: "#FFFFFF",
      borderColor: "#FFFFFF",
    },
    checkboxText: {
      fontSize: "14px",
      color: "#9CA3AF",
      lineHeight: "1.5",
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
    backLink: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      color: "#9CA3AF",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: 0,
      marginBottom: "24px",
      transition: "color 0.2s",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />

      <div style={styles.card}>
        <button 
          style={styles.backLink} 
          onClick={() => router.push("/")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
        >
          <ArrowLeft size={18} />
          Retour à l'accueil
        </button>

        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Zap color="#0A0A0A" size={24} strokeWidth={2.5} />
          </div>
          <h1 style={styles.title}>Créer un compte</h1>
          <p style={styles.subtitle}>Rejoignez la première plateforme de Creator Economy en Afrique.</p>
        </div>

        {generalError && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} />
            {generalError}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Champ Nom complet */}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Nom complet</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
                placeholder="Jean Dupont"
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

          {/* Champ Email */}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Adresse email</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  ...styles.input,
                  borderColor: emailError ? "rgba(239, 68, 68, 0.5)" : undefined,
                }}
                placeholder="nom@exemple.com"
                onFocus={(e) => {
                  e.target.style.borderColor = emailError ? "rgba(239, 68, 68, 0.5)" : "#FFFFFF";
                  e.target.style.boxShadow = emailError ? "none" : "0 0 0 2px rgba(255,255,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = emailError ? "rgba(239, 68, 68, 0.5)" : "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
              
              {/* Icône de validation à droite */}
              <div style={styles.validationIcon}>
                {isCheckingEmail ? (
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#9CA3AF" }} />
                ) : emailExists ? (
                  <AlertCircle size={18} color="#EF4444" />
                ) : email.trim() && isValidEmail(email) ? (
                  <CheckCircle size={18} color="#22C55E" />
                ) : null}
              </div>
            </div>
            
            {/* Message d'erreur email */}
            {emailError && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={14} color="#EF4444" />
                <span style={{ fontSize: "13px", color: "#EF4444" }}>
                  {emailError}{" "}
                  <button 
                    type="button" 
                    style={{ background: "none", border: "none", color: "#FFFFFF", fontWeight: "600", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: "13px" }}
                    onClick={() => router.push("/login")}
                  >
                    Se connecter
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Checkbox Conditions */}
          <label style={styles.checkboxWrapper}>
            <div 
              style={{
                ...styles.checkbox,
                ...(accepted ? styles.checkboxChecked : {})
              }}
              onClick={() => setAccepted(!accepted)}
            >
              {accepted && <CheckCircle size={14} color="#0A0A0A" strokeWidth={3} />}
            </div>
            <span style={styles.checkboxText}>
              J'accepte les{" "}
              <span style={{ color: "#FFFFFF", fontWeight: "600" }}>Conditions d'utilisation</span>{" "}
              et la{" "}
              <span style={{ color: "#FFFFFF", fontWeight: "600" }}>Politique de confidentialité</span>
            </span>
          </label>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isButtonDisabled}
            style={{
              ...styles.button,
              backgroundColor: isButtonDisabled ? "rgba(255,255,255,0.1)" : "#FFFFFF",
              color: isButtonDisabled ? "#6B7280" : "#0A0A0A",
              cursor: isButtonDisabled ? "not-allowed" : "pointer",
              boxShadow: isButtonDisabled ? "none" : "0 4px 6px -1px rgba(255, 255, 255, 0.1)",
            }}
            onMouseEnter={(e) => {
              if (!isButtonDisabled) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!isButtonDisabled) e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Création en cours...
              </>
            ) : isCheckingEmail ? (
              "Vérification de l'email..."
            ) : emailExists ? (
              "Email déjà utilisé"
            ) : (
              <>
                Recevoir le code
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Pied de page */}
        <div style={styles.footer}>
          Déjà un compte ?{" "}
          <button
            type="button"
            style={styles.link}
            onClick={() => router.push("/login")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          >
            Se connecter
          </button>
        </div>
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