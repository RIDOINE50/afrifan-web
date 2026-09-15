"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useToast } from "@chakra-ui/react";

const availableColors = [
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Jaune", hex: "#FBBF24" },
  { name: "Rouge", hex: "#EF4444" },
  { name: "Bleu", hex: "#3B82F6" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Noir", hex: "#111827" },
];

const getTextColorHex = (hexColor: string) => {
  if (hexColor === "#FFFFFF" || hexColor === "#FBBF24") return "#000000";
  return "#FFFFFF";
};

export default function CreateStoryPage() {
  const router = useRouter();
  const toast = useToast();
  const { isDark, theme } = useAppTheme();
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isTextMode, setIsTextMode] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("#8B5CF6");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ✅ Couleurs dynamiques selon le thème
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
  };

  // Nettoyage de l'URL de prévisualisation au démontage
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setMediaType(type);
    setIsTextMode(false);
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handlePublish = async () => {
    if (isUploading) return;

    if (!isTextMode && !selectedFile) {
      toast({ title: "Fichier requis", description: "Veuillez choisir une photo ou une vidéo.", status: "warning" });
      return;
    }
    if (isTextMode && textContent.trim() === "") {
      toast({ title: "Texte requis", description: "Veuillez écrire quelque chose.", status: "warning" });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      let publicUrl = null;

      if (!isTextMode && selectedFile) {
        const fileExtension = selectedFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/story_${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("stories")
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("stories").getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const { error: dbError } = await supabase.from("stories").insert({
        creator_id: user.id,
        media_url: publicUrl,
        media_type: isTextMode ? "text" : mediaType,
        text_content: isTextMode ? textContent.trim() : null,
        background_color: isTextMode ? selectedColor : null,
      });

      if (dbError) throw dbError;

      toast({ title: "🎉 Statut publié !", description: "Visible pendant 24h.", status: "success" });
      router.push("/profile");
    } catch (error: any) {
      console.error("🚨 ERREUR PUBLICATION STATUT :", error);
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue", status: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100dvh", 
      backgroundColor: colors.bg, 
      color: colors.text, 
      display: "flex", 
      flexDirection: "column" 
    }}>
      {/* 1. HEADER */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "1rem 1.5rem", 
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.bg
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ 
            padding: "0.5rem", 
            backgroundColor: "transparent", 
            border: "none", 
            borderRadius: "50%", 
            cursor: "pointer", 
            color: colors.text, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.hover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 style={{ fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>Nouveau Statut</h1>
        <button 
          onClick={handlePublish} 
          disabled={isUploading}
          style={{ 
            color: colors.primary, 
            fontWeight: "bold", 
            fontSize: "1rem", 
            backgroundColor: "transparent", 
            border: "none", 
            cursor: isUploading ? "not-allowed" : "pointer",
            opacity: isUploading ? 0.5 : 1
          }}
        >
          {isUploading ? "Publication..." : "Publier"}
        </button>
      </div>

      {/* 2. TOGGLE MODE (Texte / Média) */}
      <div style={{ padding: "1rem 1.5rem", display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => setIsTextMode(true)}
          style={{ 
            flex: 1, 
            padding: "0.75rem", 
            borderRadius: "0.75rem", 
            fontWeight: "bold", 
            cursor: "pointer",
            backgroundColor: isTextMode ? colors.primary : colors.card,
            color: isTextMode ? colors.primaryText : colors.textMuted,
            border: `1px solid ${isTextMode ? 'transparent' : colors.border}`,
            transition: "all 0.2s"
          }}
        >
          Texte
        </button>
        <button
          onClick={() => setIsTextMode(false)}
          style={{ 
            flex: 1, 
            padding: "0.75rem", 
            borderRadius: "0.75rem", 
            fontWeight: "bold", 
            cursor: "pointer",
            backgroundColor: !isTextMode ? colors.primary : colors.card,
            color: !isTextMode ? colors.primaryText : colors.textMuted,
            border: `1px solid ${!isTextMode ? 'transparent' : colors.border}`,
            transition: "all 0.2s"
          }}
        >
          Photo / Vidéo
        </button>
      </div>

      {/* 3. CONTENU PRINCIPAL (Responsive) */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "1.5rem",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        {isTextMode ? (
          /* MODE ÉDITION DE TEXTE */
          <div 
            style={{ 
              width: "100%", 
              aspectRatio: "9/16",
              maxHeight: "70vh",
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "2rem",
              backgroundColor: selectedColor,
              borderRadius: "1rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              transition: "background-color 0.3s"
            }}
          >
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Quoi de neuf ?"
              maxLength={200}
              style={{ 
                width: "100%", 
                backgroundColor: "transparent", 
                textAlign: "center", 
                fontSize: "clamp(1.25rem, 4vw, 2rem)", 
                fontWeight: "bold", 
                lineHeight: 1.5, 
                resize: "none", 
                outline: "none",
                border: "none",
                color: getTextColorHex(selectedColor),
              }}
              rows={6}
            />
            
            {/* Sélecteur de couleurs */}
            <div style={{ 
              marginTop: "auto", 
              backgroundColor: "rgba(0,0,0,0.2)", 
              backdropFilter: "blur(8px)", 
              borderRadius: "9999px", 
              padding: "0.75rem 1rem", 
              display: "flex", 
              gap: "0.75rem",
              flexWrap: "wrap",
              justifyContent: "center"
            }}>
              {availableColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  style={{ 
                    width: "2.25rem", 
                    height: "2.25rem", 
                    borderRadius: "50%", 
                    border: selectedColor === color.hex ? "3px solid #FFFFFF" : "3px solid transparent",
                    backgroundColor: color.hex,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: selectedColor === color.hex ? "scale(1.15)" : "scale(1)",
                    boxShadow: selectedColor === color.hex ? "0 0 10px rgba(255,255,255,0.4)" : "none"
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        ) : (
          /* MODE SÉLECTION MÉDIA */
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
            {previewUrl ? (
              <div style={{ 
                position: "relative", 
                width: "100%", 
                maxWidth: "320px", 
                aspectRatio: "9/16", 
                borderRadius: "1rem", 
                overflow: "hidden", 
                border: `1px solid ${colors.border}`, 
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)", 
                backgroundColor: colors.card 
              }}>
                {mediaType === "video" ? (
                  <video src={previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} autoPlay loop muted playsInline />
                ) : (
                  <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                
                {/* Badge Vidéo */}
                {mediaType === "video" && (
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "0.375rem", borderRadius: "50%", color: "white" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Bouton supprimer */}
                <button 
                  onClick={() => { 
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setSelectedFile(null); 
                    setPreviewUrl(null); 
                  }}
                  style={{ position: "absolute", top: "0.75rem", left: "0.75rem", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "0.375rem", borderRadius: "50%", border: "none", cursor: "pointer", color: "#FFFFFF" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div style={{ 
                width: "100%", 
                maxWidth: "320px", 
                aspectRatio: "9/16", 
                borderRadius: "1rem", 
                border: `2px dashed ${colors.border}`, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                backgroundColor: colors.card,
                color: colors.textMuted
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginBottom: "1rem", opacity: 0.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p style={{ fontSize: "0.9rem", fontWeight: "500" }}>Aucun média sélectionné</p>
              </div>
            )}

            {/* Boutons de sélection */}
            <div style={{ display: "flex", gap: "3rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} ref={imageInputRef} onChange={(e) => handleFileSelect(e, "image")} id="pick-image" />
                <label 
                  htmlFor="pick-image"
                  style={{ 
                    width: "4.5rem", 
                    height: "4.5rem", 
                    backgroundColor: colors.primary, 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer",
                    boxShadow: `0 10px 20px -5px ${colors.primary}66`,
                    transition: "transform 0.2s",
                    color: colors.primaryText
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.text }}>Photo</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <input type="file" accept="video/*" style={{ display: "none" }} ref={videoInputRef} onChange={(e) => handleFileSelect(e, "video")} id="pick-video" />
                <label 
                  htmlFor="pick-video"
                  style={{ 
                    width: "4.5rem", 
                    height: "4.5rem", 
                    backgroundColor: colors.primary, 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer",
                    boxShadow: `0 10px 20px -5px ${colors.primary}66`,
                    transition: "transform 0.2s",
                    color: colors.primaryText
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </label>
                <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: colors.text }}>Vidéo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}