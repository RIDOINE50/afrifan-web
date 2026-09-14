"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useToast } from "@chakra-ui/react"; // ✅ Import du système de notification élégant

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
  "#424242", // Gris 800 (Défaut)
  "#1A1A1A", // Noir doux
  "#1976D2", // Bleu 700
  "#303F9F", // Indigo 700
  "#D32F2F", // Rouge 700
  "#E65100", // Orange 800
  "#00796B", // Sarcelle 700
  "#C2185B", // Rose 700
];

export default function TextPostScreen() {
  const router = useRouter();
  const toast = useToast(); // ✅ Initialisation du Toast
  const { isDark, theme } = useAppTheme();
  
  const [text, setText] = useState("");
  const [selectedBgColor, setSelectedBgColor] = useState(BG_COLORS[0]);
  const [isPosting, setIsPosting] = useState(false);
  
  const MAX_CHARS = 500;
  const charCount = text.length;

  const selectionBorderColor = isDark ? "#FFFFFF" : "#000000";

  const handlePublish = async () => {
    if (text.trim().length === 0) {
      // ✅ Message d'avertissement élégant au lieu de alert()
      toast({
        title: "Oups !",
        description: "Veuillez écrire quelque chose avant de publier.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setIsPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté pour publier.");

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: text.trim(),
        media_type: "text",
        background_color: selectedBgColor,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // ✅ Message de succès élégant au lieu de alert()
      toast({
        title: "Publication réussie ! 🎉",
        description: "Votre post a été ajouté à votre fil d'actualité.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      // ✅ Redirection propre vers l'Accueil après un court délai pour laisser le temps de voir le message
      setTimeout(() => {
        router.push("/");
      }, 1000);
      
    } catch (error: any) {
      console.error("❌ Erreur publication:", error);
      // ✅ Message d'erreur élégant
      toast({
        title: "Erreur de publication",
        description: error.message || "Une erreur inattendue est survenue.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
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
          aria-label="Fermer"
        >
          <Icons.X size={24} />
        </button>
        
        <button
          onClick={handlePublish}
          disabled={isPosting || charCount === 0}
          style={{
            background: isPosting || charCount === 0 ? "transparent" : (isDark ? "#FFFFFF" : "#000000"),
            border: "none",
            color: isPosting || charCount === 0 ? (isDark ? "#666666" : "#9CA3AF") : (isDark ? "#000000" : "#FFFFFF"),
            fontWeight: "bold",
            fontSize: "15px",
            cursor: isPosting || charCount === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "24px",
            transition: "all 0.2s ease"
          }}
        >
          {isPosting ? (
            <div style={{ width: "18px", height: "18px", border: `2px solid ${isDark ? "#000000" : "#FFFFFF"}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <>
              Publier
              <Icons.Send size={16} fill={isPosting || charCount === 0 ? "none" : (isDark ? "#000000" : "#FFFFFF")} stroke="none" />
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
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.6)" : "0 8px 30px rgba(0,0,0,0.1)"
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
              fontSize: "26px",
              fontWeight: 600,
              textAlign: "center",
              outline: "none",
              resize: "none",
              lineHeight: 1.4,
              fontFamily: "inherit"
            }}
          />
          
          {/* COMPTEUR DE CARACTÈRES */}
          <div style={{ textAlign: "right", marginTop: "16px" }}>
            <span style={{ 
              fontSize: "13px", 
              fontWeight: 500,
              color: charCount > MAX_CHARS ? "#FCA5A5" : "rgba(255,255,255,0.7)" 
            }}>
              {charCount} / {MAX_CHARS}
            </span>
          </div>
        </div>

        {/* ─── PALETTE DE COULEURS ─── */}
        <div style={{ marginTop: "32px" }}>
          <h3 style={{ 
            fontSize: "15px", 
            fontWeight: "bold", 
            marginBottom: "16px",
            color: isDark ? "#FFFFFF" : "#000000",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Couleur de fond
          </h3>
          
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            overflowX: "auto", 
            paddingBottom: "12px",
            scrollbarWidth: "none"
          }}>
            {BG_COLORS.map((color, index) => {
              const isSelected = color === selectedBgColor;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedBgColor(color)}
                  aria-label={`Choisir la couleur ${color}`}
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: isSelected ? `3px solid ${selectionBorderColor}` : "3px solid transparent",
                    boxShadow: isSelected ? `0 0 0 2px ${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"}` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                    padding: 0
                  }}
                >
                  {isSelected && <Icons.Check size={22} fill="none" stroke="#FFFFFF" strokeWidth={3} />}
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
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}