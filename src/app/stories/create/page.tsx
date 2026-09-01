"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const availableColors = [
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Jaune", hex: "#FBBF24" },
  { name: "Rouge", hex: "#EF4444" },
  { name: "Bleu", hex: "#3B82F6" },
  { name: "Blanc", hex: "#FFFFFF" },
];

// Détermine si le texte doit être noir ou blanc selon le fond
const getTextColorHex = (hexColor: string) => {
  if (hexColor === "#FFFFFF" || hexColor === "#FBBF24") return "#000000";
  return "#FFFFFF";
};

export default function CreateStoryPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isTextMode, setIsTextMode] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("#8B5CF6");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ CORRECTION : Nettoyage de l'ancienne URL pour éviter les fuites de mémoire
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(file);
    setMediaType(type);
    setIsTextMode(false);
    
    // Créer une URL de prévisualisation locale
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handlePublish = async () => {
    // ✅ CORRECTION : Protection contre le double clic
    if (isUploading) return;

    if (!isTextMode && !selectedFile) {
      alert("Veuillez choisir une photo, une vidéo ou écrire un texte.");
      return;
    }
    if (isTextMode && textContent.trim() === "") {
      alert("Veuillez écrire quelque chose.");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      let publicUrl = null;

      // 1. Upload du fichier si on n'est pas en mode texte
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

      // 2. Enregistrement en base de données
      const { error: dbError } = await supabase.from("stories").insert({
        creator_id: user.id,
        media_url: publicUrl,
        media_type: isTextMode ? "text" : mediaType,
        text_content: isTextMode ? textContent.trim() : null,
        background_color: isTextMode ? selectedColor : null,
      });

      if (dbError) throw dbError;

      alert("🎉 Statut publié avec succès ! (Visible 24h)");
      router.push("/profile"); // Retour au profil après publication
    } catch (error: any) {
      console.error("🚨 ERREUR PUBLICATION STATUT :", error);
      alert(`Erreur : ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000000", color: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* 1. HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button 
          onClick={() => router.back()} 
          style={{ padding: "0.5rem", backgroundColor: "transparent", border: "none", borderRadius: "50%", cursor: "pointer", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}
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
            color: "#8B5CF6", 
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
      <div style={{ padding: "1rem", display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => setIsTextMode(true)}
          style={{ 
            flex: 1, 
            padding: "0.75rem", 
            borderRadius: "0.5rem", 
            fontWeight: "bold", 
            cursor: "pointer",
            backgroundColor: isTextMode ? "#8B5CF6" : "#111827",
            color: isTextMode ? "#FFFFFF" : "#9CA3AF",
            border: "none",
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
            borderRadius: "0.5rem", 
            fontWeight: "bold", 
            cursor: "pointer",
            backgroundColor: !isTextMode ? "#8B5CF6" : "#111827",
            color: !isTextMode ? "#FFFFFF" : "#9CA3AF",
            border: "none",
            transition: "all 0.2s"
          }}
        >
          Photo / Vidéo
        </button>
      </div>

      {/* 3. CONTENU PRINCIPAL */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {isTextMode ? (
          /* MODE ÉDITION DE TEXTE */
          <div 
            style={{ 
              width: "100%", 
              height: "100%", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "2rem",
              backgroundColor: selectedColor,
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
                maxWidth: "28rem", 
                backgroundColor: "transparent", 
                textAlign: "center", 
                fontSize: "1.5rem", 
                fontWeight: "bold", 
                lineHeight: 1.75, 
                resize: "none", 
                outline: "none",
                border: "none",
                color: getTextColorHex(selectedColor),
              }}
              rows={6}
            />
            
            {/* Sélecteur de couleurs */}
            <div style={{ marginTop: "auto", backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", borderRadius: "9999px", padding: "0.75rem 1rem", display: "flex", gap: "1rem" }}>
              {availableColors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  style={{ 
                    width: "2.5rem", 
                    height: "2.5rem", 
                    borderRadius: "50%", 
                    border: selectedColor === color.hex ? "2px solid #FFFFFF" : "2px solid transparent",
                    backgroundColor: color.hex,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: selectedColor === color.hex ? "scale(1.1)" : "scale(1)",
                    boxShadow: selectedColor === color.hex ? "0 0 8px rgba(255,255,255,0.5)" : "none"
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        ) : (
          /* MODE SÉLECTION MÉDIA */
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            {previewUrl ? (
              <div style={{ position: "relative", width: "16rem", height: "24rem", borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", backgroundColor: "#111827" }}>
                {mediaType === "video" ? (
                  <video src={previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} autoPlay loop muted playsInline />
                ) : (
                  <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                
                {/* Badge Vidéo */}
                {mediaType === "video" && (
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "0.375rem", borderRadius: "50%" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Bouton supprimer */}
                <button 
                  onClick={() => { 
                    // ✅ CORRECTION : Révocation de l'URL lors de la suppression
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
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "rgba(255,255,255,0.12)", marginBottom: "2rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}

            {/* Boutons de sélection */}
            <div style={{ display: "flex", gap: "2.5rem", marginTop: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} ref={imageInputRef} onChange={(e) => handleFileSelect(e, "image")} id="pick-image" />
                <label 
                  htmlFor="pick-image"
                  style={{ 
                    width: "4rem", 
                    height: "4rem", 
                    backgroundColor: "#8B5CF6", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer",
                    boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.3)",
                    transition: "all 0.2s"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#FFFFFF" }}>Photo</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <input type="file" accept="video/*" style={{ display: "none" }} ref={videoInputRef} onChange={(e) => handleFileSelect(e, "video")} id="pick-video" />
                <label 
                  htmlFor="pick-video"
                  style={{ 
                    width: "4rem", 
                    height: "4rem", 
                    backgroundColor: "#8B5CF6", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer",
                    boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.3)",
                    transition: "all 0.2s"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </label>
                <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#FFFFFF" }}>Vidéo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}