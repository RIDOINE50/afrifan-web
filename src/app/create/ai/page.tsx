"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AICreationScreen() {
  const router = useRouter();
  
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const colors = {
    bg: "#0A0A0A", card: "#1A1A1A", border: "#2A2A2A",
    primary: "#8B5CF6", primaryDark: "#4A148C",
    text: "#FFFFFF", textMuted: "#9CA3AF", green: "#22C55E",
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
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) URL.revokeObjectURL(generatedImageUrl);
    setGeneratedImageUrl(null);

    try {
      const userPrompt = prompt.trim() || "A beautiful landscape";
      const simplePrompt = `${userPrompt} ${stylePrompt}`;
      const seed = Date.now() % 1000000;
      
      const cleanPrompt = simplePrompt.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_'); 
      
      // ✅ UTILISATION DU PROXY SERVEUR (Créé à l'étape précédente) pour éviter les 403
      // Si tu n'as pas créé le proxy, remplace la ligne ci-dessous par l'URL Unsplash de test :
      // const apiUrl = `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=512&h=512&fit=crop&q=80`;
      const apiUrl = `/api/generate-image?prompt=${cleanPrompt}&seed=${seed}`;
      
      console.log("🔍 Génération via proxy:", apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);

      const blob = await response.blob();
      setGeneratedImageUrl(URL.createObjectURL(blob));
    } catch (error: any) {
      console.error("❌ Erreur génération IA:", error);
      alert(`Erreur : ${error.message || "Veuillez réessayer."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ ACTION DE PUBLICATION : Redirection vers l'écran unifié avec les paramètres
    // ✅ ACTION DE PUBLICATION : Sauvegarde dans sessionStorage avant redirection
  const handlePublish = () => {
    if (!generatedImageUrl) return;
    
    // Convertir le blob URL en base64 pour le stockage
    fetch(generatedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          
          // Sauvegarder dans sessionStorage
          sessionStorage.setItem('ai_generated_image', base64String);
          sessionStorage.setItem('ai_generated_desc', description);
          
          // Rediriger vers l'écran de création
          router.push('/create?from_ai=true');
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error("Erreur conversion image:", err);
        alert("Erreur lors de la préparation de l'image");
      });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>←</button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>✨ Création IA</h1>
        <div style={{ width: "24px" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0" }}>Transforme tes idées avec l'IA</h2>
        <p style={{ color: colors.textMuted, margin: "0 0 24px 0" }}>Décris ton idée et choisis un style</p>
        
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex: un lion cool avec des lunettes de soleil" rows={2}
          style={{ width: "100%", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "12px 16px", color: colors.text, fontSize: "15px", outline: "none", resize: "none", boxSizing: "border-box" }} />

        <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "24px 0 16px 0" }}>Choisis un style</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {styles.map((style, index) => (
            <button key={index} onClick={() => !isGenerating && generateImage(style.prompt)} disabled={isGenerating}
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`, border: `2px solid ${colors.primary}`, borderRadius: "12px", padding: "16px 8px", cursor: isGenerating ? "not-allowed" : "pointer", opacity: isGenerating ? 0.6 : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ fontSize: "28px" }}>{isGenerating ? "⏳" : "✨"}</span>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "15px" }}>{style.name}</span>
            </button>
          ))}
        </div>

        {isGenerating && (
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <div style={{ width: "40px", height: "40px", margin: "0 auto 16px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            <p style={{ color: colors.text, fontSize: "14px" }}>L'IA travaille sa magie... (10-20s)</p>
          </div>
        )}

        {generatedImageUrl && !isGenerating && (
          <div style={{ marginTop: "32px" }}>
            <div style={{ backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.primary}`, padding: "16px" }}>
              <p style={{ color: colors.green, fontWeight: "bold", margin: "0 0 12px 0" }}>✅ Image générée ! Vérifie avant de publier</p>
              <img src={generatedImageUrl} alt="Generated AI" style={{ width: "100%", borderRadius: "12px", objectFit: "cover", backgroundColor: "#000" }} />
              
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ajoute une description pour ta publication..." rows={3}
                style={{ width: "100%", marginTop: "16px", backgroundColor: "rgba(0,0,0,0.3)", border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "12px 16px", color: colors.text, fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box" }} />

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button onClick={() => generateImage(styles[0].prompt)} style={{ flex: 1, padding: "14px", backgroundColor: "transparent", border: `1px solid rgba(255,255,255,0.3)`, borderRadius: "12px", color: colors.text, fontWeight: "bold", cursor: "pointer" }}>🔄 Régénérer</button>
                <button onClick={handlePublish} style={{ flex: 1, padding: "14px", backgroundColor: colors.primary, border: "none", borderRadius: "12px", color: "white", fontWeight: "bold", cursor: "pointer" }}>📤 Publier</button>
              </div>
            </div>
          </div>
        )}
        <div style={{ height: "40px" }} />
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}