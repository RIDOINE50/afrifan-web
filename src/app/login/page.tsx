"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
// ✅ Ajout des composants Chakra UI pour le bouton Google (comme dans Register)
import { Button, Flex, Text, Box } from "@chakra-ui/react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOUVEAU : Fonction pour la connexion Google
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || "Impossible de se connecter avec Google.");
    } finally {
      setIsLoading(false);
    }
  };

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
          await supabase.auth.signOut();
          setError("🚫 Votre compte a été banni de la plateforme Afrifan. Veuillez contacter le support.");
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

  // ✅ TES STYLES (inchangés)
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
            <label style={styles.label}>Email</label>
            <input
              type="email"
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

        {/* ✅ NOUVEAU : Séparateur et Vrai Bouton Google (Style Chakra UI) */}
        <Flex align="center" w="100%" my={8}>
          <Box flex="1" h="1px" bg="#2A2A2A" />
          <Text px={4} color="#9CA3AF" fontSize="14px">Ou continuer avec</Text>
          <Box flex="1" h="1px" bg="#2A2A2A" />
        </Flex>

        <Button
          w="100%"
          h="50px"
          bg="white"
          color="#1A1A1A"
          _hover={{ bg: "gray.100" }}
          fontWeight="medium"
          onClick={handleGoogleSignIn}
          isLoading={isLoading}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
          }
        >
          Continuer avec Google
        </Button>

        <div style={styles.footer}>
          Pas encore de compte ?{" "}
          <button 
            type="button"
            style={styles.link}
            onClick={() => router.push("/register")}
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
}