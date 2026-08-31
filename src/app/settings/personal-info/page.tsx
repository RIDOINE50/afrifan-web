"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PersonalInfoPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const colors = {
    bg: "#000000",
    card: "#1A1A1A",
    cardDisabled: "#151515",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    success: "#22C55E",
    error: "#EF4444",
  };

  // 1. Récupération des vraies données au chargement
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/login");
        return;
      }

      setUser(session.user);
      setEmail(session.user.email || "");

      // Récupérer le username depuis la table profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        setUsername(profile.username || "");
      }

      setIsLoading(false);
    };

    fetchData();
  }, [router]);

  // 2. Sauvegarde des modifications
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage({ type: 'error', text: "Le nom d'utilisateur ne peut pas être vide" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: "Informations mises à jour avec succès !" });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erreur lors de l'enregistrement : ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: `1px solid ${colors.border}`, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px" }}>←</button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Informations personnelles</h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}>
        
        <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "24px" }}>
          Modifiez vos informations publiques visibles par les autres utilisateurs.
        </p>

        <form onSubmit={handleSave}>
          {/* Message de succès ou d'erreur */}
          {message && (
            <div style={{ 
              padding: "12px 16px", 
              borderRadius: "8px", 
              marginBottom: "20px", 
              backgroundColor: message.type === 'success' ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === 'success' ? colors.success : colors.error}`,
              color: message.type === 'success' ? colors.success : colors.error,
              fontSize: "14px"
            }}>
              {message.text}
            </div>
          )}

          {/* CHAMP NOM D'UTILISATEUR */}
          <label style={{ display: "block", fontWeight: "bold", color: colors.text, fontSize: "14px", marginBottom: "8px" }}>
            Nom d'utilisateur
          </label>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.textMuted, fontSize: "20px" }}>👤</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
              placeholder="Ton pseudo"
              style={{
                width: "100%",
                padding: "14px 16px 14px 48px",
                backgroundColor: colors.card,
                border: `1.5px solid ${isUsernameFocused ? colors.primary : colors.border}`,
                borderRadius: "12px",
                color: colors.text,
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* CHAMP EMAIL (Lecture seule) */}
          <label style={{ display: "block", fontWeight: "bold", color: colors.text, fontSize: "14px", marginBottom: "8px" }}>
            Adresse Email (Non modifiable)
          </label>
          <div style={{ position: "relative", marginBottom: "32px" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.textMuted, fontSize: "20px" }}>✉️</span>
            <input
              type="text"
              value={email}
              readOnly
              style={{
                width: "100%",
                padding: "14px 16px 14px 48px",
                backgroundColor: colors.cardDisabled,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                color: colors.textMuted,
                fontSize: "15px",
                cursor: "not-allowed",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* BOUTON ENREGISTRER */}
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
              "Enregistrer les modifications"
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