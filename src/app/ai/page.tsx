"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function AICreationScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // ✅ Couleurs dynamiques
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    green: "#22C55E",
  };

  const styles = [
    { name: 'Anime', prompt: 'anime style, vibrant colors' },
    { name: 'Pro', prompt: 'professional headshot, studio lighting' },
    { name: 'Cyberpunk', prompt: 'cyberpunk style, neon lights' },
    { name: 'Vintage', prompt: 'vintage film photo, 1990s' },
    { name: 'Artistique', prompt: 'oil painting style, artistic' },
  ];

  useEffect(() => {
    return () => {
      if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(generatedImageUrl);
      }
    };
  }, [generatedImageUrl]);

  const generateImage = async (stylePrompt: string) => {
    setIsGenerating(true);
    setDescription("");
    
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    setGeneratedImageUrl(null);

    try {
      const userPrompt = prompt.trim() || "African portrait";
      const simplePrompt = `${userPrompt} ${stylePrompt}`;
      const seed = Date.now() % 1000000;
      
      const encodedPrompt = encodeURIComponent(
        simplePrompt.replace(/[^\w\s-]/g, '').trim()
      );
      
      const apiUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&nologo=true&noCache=true`;
      console.log("🔍 Génération URL:", apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setGeneratedImageUrl(objectUrl);
    } catch (error) {
      console.error("❌ Erreur génération IA:", error);
      alert("Erreur lors de la génération de l'image. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!generatedImageUrl) return;

    const params = new URLSearchParams({
      type: 'ai_photo',
      url: generatedImageUrl,
      description: description
    });
    
    alert(`✅ Prêt à publier !\nDescription: ${description || "(Aucune)"}\n(La redirection vers l'écran de publication sera ajoutée ici)`);
  };

  const handleRegenerate = () => {
    if (prompt) {
      generateImage(styles[0].prompt); 
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>←</button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>✨ Création IA</h1>
        <div style={{ width: "24px" }} />
      </div>

      {/* Contenu Principal */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0" }}>Transforme tes idées avec l'IA</h2>
        <p style={{ color: colors.textMuted, margin: "0 0 24px 0" }}>Décris ton idée et choisis un style</p>
        
        {/* Champ Prompt */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: un lion cool avec des lunettes de soleil"
          rows={2}
          style={{
            width: "100%",
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "12px 16px",
            color: colors.text,
            fontSize: "15px",
            outline: "none",
            resize: "none",
            boxSizing: "border-box"
          }}
        />

        {/* Grille des Styles */}
        <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "24px 0 16px 0" }}>Choisis un style</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {styles.map((style, index) => (
            <button
              key={index}
              onClick={() => !isGenerating && generateImage(style.prompt)}
              disabled={isGenerating}
              style={{
                background: colors.primary,
                border: `2px solid ${colors.primary}`,
                borderRadius: "12px",
                padding: "16px 8px",
                cursor: isGenerating ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.6 : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.1s"
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
              onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <span style={{ fontSize: "28px" }}>{isGenerating ? "⏳" : "✨"}</span>
              <span style={{ color: colors.primaryText, fontWeight: "bold", fontSize: "15px" }}>{style.name}</span>
            </button>
          ))}
        </div>

        {/* État de Chargement */}
        {isGenerating && (
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <div style={{ 
              width: "40px", height: "40px", margin: "0 auto 16px",
              border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, 
              borderRadius: "50%", animation: "spin 1s linear infinite" 
            }}></div>
            <p style={{ color: colors.text, fontSize: "14px" }}>L'IA travaille sa magie... (10-20s)</p>
          </div>
        )}

        {/* Résultat Généré */}
        {generatedImageUrl && !isGenerating && (
          <div style={{ marginTop: "32px" }}>
            <div style={{ 
              backgroundColor: colors.card, 
              borderRadius: "16px", 
              border: `1px solid ${colors.border}`,
              padding: "16px" 
            }}>
              <p style={{ color: colors.green, fontWeight: "bold", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                ✅ Image générée ! Vérifie avant de publier
              </p>
              
              <img 
                src={generatedImageUrl} 
                alt="Generated AI" 
                style={{ 
                  width: "100%", 
                  borderRadius: "12px", 
                  objectFit: "cover",
                  backgroundColor: "#000"
                }} 
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoute une description pour ta publication..."
                rows={3}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: colors.text,
                  fontSize: "14px",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box"
                }}
              />

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  onClick={handleRegenerate}
                  style={{
                    flex: 1,
                    padding: "14px",
                    backgroundColor: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "12px",
                    color: colors.text,
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  🔄 Régénérer
                </button>
                <button
                  onClick={handlePublish}
                  style={{
                    flex: 1,
                    padding: "14px",
                    backgroundColor: colors.primary,
                    border: "none",
                    borderRadius: "12px",
                    color: colors.primaryText,
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  📤 Publier
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: "40px" }} />
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