"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ─── COMPOSANT CONTENU (utilise useSearchParams) ──────────
function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // États de navigation interne
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);

  // États des données
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "photo" | null>(null);
  
  // États des sons
  const [sounds, setSounds] = useState<any[]>([]);
  const [selectedSound, setSelectedSound] = useState<any>(null);
  const [showSoundModal, setShowSoundModal] = useState(false);

  // États du formulaire Feed
  const [feedTitle, setFeedTitle] = useState("");
  const [feedCaption, setFeedCaption] = useState("");

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    pink: "#EC4899",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
  };

  // 1. Initialisation : Charger les sons ET vérifier si on vient de l'IA
  useEffect(() => {
    fetchSounds();
    
    // Détection de l'image venant de l'IA (via sessionStorage)
    const aiImageBase64 = sessionStorage.getItem('ai_generated_image');
    const aiDesc = sessionStorage.getItem('ai_generated_desc');

    if (aiImageBase64) {
      setPreviewUrl(aiImageBase64);
      setMediaType("photo");
      if (aiDesc) setFeedCaption(aiDesc);
      setStep("review"); // On passe directement à l'étape de review
      
      // Nettoyer le sessionStorage après récupération
      sessionStorage.removeItem('ai_generated_image');
      sessionStorage.removeItem('ai_generated_desc');
    }

    return () => {
      // Nettoyage sécurisé (ne pas révoquer les URLs base64 ou http)
      if (previewUrl && !previewUrl.startsWith('http') && !previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (audioRef.current) audioRef.current.pause();
    };
  }, []); // Retirer searchParams des dépendances

  const fetchSounds = async () => {
    const { data, error } = await supabase.from("sounds").select("*").limit(20);
    if (!error && data) setSounds(data);
  };

  // 2. Gestion de la sélection de fichier local
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else if (file.type.startsWith("image/")) {
      setMediaType("photo");
    } else {
      alert("Format non supporté. Veuillez choisir une image ou une vidéo.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep("upload"); // Reset à l'étape upload si on choisit un nouveau fichier
  };

  // 3. Gestion des sons
  const playSound = (sound: any) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (selectedSound?.id === sound.id) {
      setSelectedSound(null);
    } else {
      const audio = new Audio(sound.url);
      audioRef.current = audio;
      audio.play().catch(err => console.error("Erreur lecture audio:", err));
      setSelectedSound(sound);
    }
    setShowSoundModal(false);
  };

  // 4. LOGIQUE DE PUBLICATION (Gère à la fois les fichiers locaux ET les URLs IA)
  const handlePublish = async (target: "story" | "feed") => {
    if (!selectedFile && !previewUrl) {
      alert("Aucun média à publier.");
      return;
    }

    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Vous devez être connecté pour publier.");
        router.push("/login");
        return;
      }

      let fileToUpload: File | null = selectedFile;
      let mediaUrl = previewUrl;

      // Gestion spéciale pour les images IA (Conversion URL -> File)
      if (!fileToUpload && previewUrl) {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        fileToUpload = new File([blob], `ai_generated_${Date.now()}.jpg`, { 
          type: blob.type || "image/jpeg" 
        });
      }

      // Upload vers le bucket 'post-images'
      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const bucketName = "post-images";

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, fileToUpload);

        if (uploadError) throw new Error(`Échec de l'upload: ${uploadError.message}`);

        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        mediaUrl = data.publicUrl;
      }

      // Insertion en base de données
      if (target === "feed") {
        const { error: dbError } = await supabase.from("posts").insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          content: feedCaption || "",
          caption: feedCaption || "",
          music_url: selectedSound?.url || null,
          created_at: new Date().toISOString(),
        });
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase.from("stories").insert({
          creator_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: new Date().toISOString(),
        });
        if (dbError) throw dbError;
      }

      // Succès : Nettoyage et redirection
      alert(`✅ Publié avec succès dans ${target === "story" ? "vos Stories" : "votre Feed"} !`);
      
      // On nettoie l'URL des paramètres IA pour éviter de republier la même chose par erreur
      router.replace("/create"); 
      setSelectedFile(null);
      setPreviewUrl(null);
      setFeedCaption("");
      setFeedTitle("");
      setStep("upload");
      router.push("/"); 
      
    } catch (error: any) {
      console.error("❌ Erreur de publication:", error);
      alert(`Erreur : ${error.message || "Une erreur est survenue."}`);
    } finally {
      setIsPublishing(false);
      setShowFeedModal(false);
    }
  };

  if (isPublishing) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ color: colors.text, fontSize: "16px" }}>Publication en cours...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => step === "review" && !searchParams.get('ai_url') ? setStep("upload") : router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>
          {step === "review" && !searchParams.get('ai_url') ? "←" : "✕"}
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
          {step === "upload" ? "Nouvelle publication" : "Dernières vérifications"}
        </h1>
        <div style={{ width: "24px" }} />
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        
        {/* ZONE D'APERÇU */}
        <div style={{
          aspectRatio: "9/16",
          maxHeight: "500px",
          backgroundColor: colors.card,
          borderRadius: "16px",
          border: `2px dashed ${selectedFile || previewUrl ? "transparent" : colors.border}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: selectedFile || previewUrl ? "default" : "pointer",
          overflow: "hidden", position: "relative"
        }}>
          {!selectedFile && !previewUrl && (
            <input type="file" ref={fileInputRef} accept="image/*,video/*" onChange={handleFileSelect} style={{ display: "none" }} />
          )}

          {previewUrl ? (
            mediaType === "video" ? (
              <video src={previewUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }} />
            ) : (
              <img src={previewUrl} alt="Aperçu" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            )
          ) : (
            <div onClick={() => fileInputRef.current?.click()} style={{ textAlign: "center", padding: "20px", cursor: "pointer" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", color: colors.primary }}>📁</div>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Importer un média</h3>
              <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "20px" }}>Cliquez pour choisir une photo ou une vidéo</p>
              <button style={{ padding: "10px 24px", backgroundColor: colors.primary, color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                Sélectionner un fichier
              </button>
            </div>
          )}
        </div>

        {/* === ÉTAPE 1 : SÉLECTION DU SON (Si on n'est pas venu de l'IA avec un saut d'étape) === */}
        {step === "upload" && (selectedFile || previewUrl) && !searchParams.get('ai_url') && (
          <>
            <div style={{ backgroundColor: colors.card, borderRadius: "16px", padding: "16px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>🎵 Son</h3>
                <button onClick={() => setShowSoundModal(true)} style={{ background: "none", border: "none", color: colors.primary, fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
                  {selectedSound ? "Changer" : "Ajouter un son"}
                </button>
              </div>
              {selectedSound ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎶</div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSound.title}</div>
                    <div style={{ fontSize: "12px", color: colors.textMuted }}>{selectedSound.artist}</div>
                  </div>
                  <button onClick={() => { setSelectedSound(null); if(audioRef.current) audioRef.current.pause(); }} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "20px", cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "12px", color: colors.textMuted, fontSize: "14px", border: `1px dashed ${colors.border}`, borderRadius: "8px" }}>Aucun son sélectionné</div>
              )}
            </div>
            <button onClick={() => setStep("review")} style={{ width: "100%", padding: "16px", backgroundColor: colors.primary, border: "none", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
              Suivant
            </button>
          </>
        )}

        {/* === ÉTAPE 2 : CHOIX DE PUBLICATION === */}
        {step === "review" && (
          <>
            {selectedSound && (
              <div style={{ padding: "12px", backgroundColor: `${colors.primary}26`, borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "20px" }}>🎵</span>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSound.title}</div>
                  <div style={{ fontSize: "12px", color: colors.textMuted }}>{selectedSound.artist}</div>
                </div>
              </div>
            )}

            <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 20px 0" }}>Où voulez-vous publier ?</h2>
            <PublishCard icon="⚡" title="Ma Story" subtitle="Disparaît après 24h" color={colors.primary} onClick={() => handlePublish("story")} />
            <PublishCard icon="📱" title="Mon Feed" subtitle="Reste sur votre profil" color={colors.pink} onClick={() => setShowFeedModal(true)} />
          </>
        )}
      </div>

      {/* MODAL SÉLECTION DES SONS */}
      {showSoundModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowSoundModal(false)}>
          <div style={{ backgroundColor: colors.card, width: "100%", maxWidth: "500px", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px", maxHeight: "60vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "40px", height: "4px", backgroundColor: colors.textMuted, borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", textAlign: "center" }}>🎵 Choisir un son</h3>
            {sounds.length === 0 ? (
              <p style={{ textAlign: "center", color: colors.textMuted }}>Chargement des sons...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sounds.map((sound: any) => (
                  <div key={sound.id} onClick={() => playSound(sound)} style={{ padding: "12px", borderBottom: `1px solid ${colors.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", borderRadius: "8px", backgroundColor: selectedSound?.id === sound.id ? `${colors.primary}20` : "transparent" }}>
                    <span style={{ fontSize: "24px" }}>🎵</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>{sound.title}</div>
                      <div style={{ fontSize: "12px", color: colors.textMuted }}>{sound.artist}</div>
                    </div>
                    {selectedSound?.id === sound.id && <span style={{ color: colors.primary, fontWeight: "bold" }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS DU FEED */}
      {showFeedModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ backgroundColor: colors.card, width: "100%", maxWidth: "600px", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "40px", height: "4px", backgroundColor: colors.textMuted, borderRadius: "2px", margin: "0 auto 24px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold" }}>Détails de la publication</h3>
            <input type="text" value={feedTitle} onChange={(e) => setFeedTitle(e.target.value)} placeholder="Titre" style={{ width: "100%", padding: "14px 16px", marginBottom: "12px", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", color: colors.text, fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
            <textarea value={feedCaption} onChange={(e) => setFeedCaption(e.target.value)} placeholder="Légende (optionnel)" rows={3} style={{ width: "100%", padding: "14px 16px", marginBottom: "24px", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", color: colors.text, fontSize: "15px", outline: "none", resize: "none", boxSizing: "border-box" }} />
            <button onClick={() => handlePublish("feed")} style={{ width: "100%", padding: "16px", backgroundColor: colors.primary, border: "none", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Publier sur le Feed</button>
            <button onClick={() => setShowFeedModal(false)} style={{ width: "100%", padding: "16px", marginTop: "12px", backgroundColor: "transparent", border: `1px solid ${colors.border}`, borderRadius: "12px", color: colors.textMuted, fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── COMPOSANT D'ENVELOPPE AVEC SUSPENSE ──────────────────
function PublishCard({ icon, title, subtitle, color, onClick }: { icon: string; title: string; subtitle: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "16px", marginBottom: "12px", backgroundColor: `${color}26`, border: `1.5px solid ${color}80`, borderRadius: "16px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", textAlign: "left", transition: "transform 0.1s" }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>{title}</div>
        <div style={{ color: "#9CA3AF", fontSize: "13px" }}>{subtitle}</div>
      </div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "18px" }}>›</div>
    </button>
  );
}

// ─── EXPORT AVEC SUSPENSE ─────────────────────────────────
import { Suspense } from "react";

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF" }}>
        Chargement...
      </div>
    }>
      <CreateContent />
    </Suspense>
  );
}