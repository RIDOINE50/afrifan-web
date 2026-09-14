"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// ==========================================
// ✅ VRAIES ICÔNES SVG PROFESSIONNELLES
// ==========================================
const Icon = ({ path, size = 24, className = "", fill = "none" }: { path: React.ReactNode; size?: number; className?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const Icons = {
  X: (props: any) => <Icon {...props} path={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} />,
  Check: (props: any) => <Icon {...props} path={<><polyline points="20 6 9 17 4 12" /></>} />,
  Send: (props: any) => <Icon {...props} path={<><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>} />,
};

// ✅ Couleurs extraites exactement de ton code Flutter
const BG_COLORS = [
  "#424242", // Grey 800 (Défaut)
  "#1A1A1A", // Noir doux
  "#1976D2", // Blue 700
  "#303F9F", // Indigo 700
  "#D32F2F", // Red 700
  "#E65100", // Orange 800
  "#00796B", // Teal 700
  "#C2185B", // Pink 700
];

export default function TextPostScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
  const [text, setText] = useState("");
  const [selectedBgColor, setSelectedBgColor] = useState(BG_COLORS[0]);
  const [isPosting, setIsPosting] = useState(false);
  
  const MAX_CHARS = 500;
  const charCount = text.length;

  // Couleur de la bordure de sélection selon le thème
  const selectionBorderColor = isDark ? "#FFFFFF" : "#000000";

  const handlePublish = async () => {
       if (!text.trim()) {
      alert("Écrivez quelque chose d'abord !");
      return;
    }
    setIsPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: text.trim(),
        media_type: "text",
        background_color: selectedBgColor,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("✅ Publication réussie !");
      router.push("/"); // Retour à l'accueil après publication
      
    } catch (error: any) {
      console.error("❌ Erreur publication:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: isDark ? "#000000" : "#FFFFFF", 
      color: isDark ? "#FFFFFF" : "#000000",
      display: "flex", 
      flexDirection: "column" 
    }}>
      {/* ─── HEADER ─── */}
      <div style={{ 
        padding: "16px 20px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        borderBottom: `1px solid ${isDark ? "#333333" : "#E5E7EB"}`
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: "none", border: "none", color: isDark ? "#FFFFFF" : "#000000", cursor: "pointer", padding: "8px", display: "flex" }}
        >
          <Icons.X size={24} />
        </button>
        
        <button
          onClick={handlePublish}
          disabled={isPosting || charCount === 0}
          style={{
            background: "none",
            border: "none",
            color: isPosting || charCount === 0 ? (isDark ? "#666666" : "#9CA3AF") : (isDark ? "#FFFFFF" : "#000000"),
            fontWeight: "bold",
            fontSize: "16px",
            cursor: isPosting || charCount === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            transition: "opacity 0.2s"
          }}
        >
          {isPosting ? (
            <div style={{ width: "20px", height: "20px", border: `2px solid ${isDark ? "#FFFFFF" : "#000000"}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          ) : (
            <>
              Publier
              <Icons.Send size={18} />
            </>
          )}
        </button>
      </div>

      {/* ─── CONTENU PRINCIPAL ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        
        {/* ZONE DE TEXTE */}
        <div style={{
          flex: 1,
          backgroundColor: selectedBgColor,
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.1)"
        }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Quoi de neuf ?"
            maxLength={MAX_CHARS}
            style={{
              flex: 1,
              width: "100%",
              backgroundColor: "transparent",
              border: "none",
              color: "#FFFFFF",
              fontSize: "24px",
              fontWeight: 500,
              textAlign: "center",
              outline: "none",
              resize: "none",
              lineHeight: 1.4,
              fontFamily: "inherit"
            }}
          />
          
          {/* COMPTEUR DE CARACTÈRES */}
          <div style={{ textAlign: "right", marginTop: "12px" }}>
            <span style={{ 
              fontSize: "12px", 
              color: charCount > MAX_CHARS ? "#EF4444" : "rgba(255,255,255,0.6)" 
            }}>
              {charCount} / {MAX_CHARS}
            </span>
          </div>
        </div>

        {/* ─── PALETTE DE COULEURS ─── */}
        <div style={{ marginTop: "32px" }}>
          <h3 style={{ 
            fontSize: "16px", 
            fontWeight: "bold", 
            marginBottom: "16px",
            color: isDark ? "#FFFFFF" : "#000000"
          }}>
            Couleur de fond
          </h3>
          
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            overflowX: "auto", 
            paddingBottom: "12px",
            scrollbarWidth: "none" // Cache la scrollbar sur Firefox
          }}>
            {BG_COLORS.map((color, index) => {
              const isSelected = color === selectedBgColor;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedBgColor(color)}
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: isSelected ? `3px solid ${selectionBorderColor}` : "3px solid transparent",
                    boxShadow: isSelected ? `0 0 0 2px ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    padding: 0
                  }}
                >
                  {isSelected && <Icons.Check size={20} fill="none" stroke="#FFFFFF" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* Cache la scrollbar sur Chrome/Safari */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}