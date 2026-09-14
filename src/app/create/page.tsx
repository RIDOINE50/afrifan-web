"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// ─── VRAIES ICÔNES SVG ─────────────────────────────────────
const Icon = ({ path, size = 22, strokeWidth = 2 }: { path: React.ReactNode; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  Ai: (props: any) => <Icon {...props} path={<>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.2" fill="currentColor" />
    <circle cx="15" cy="9" r="1.2" fill="currentColor" />
    <path d="M8 15c1 1 2.5 1.5 4 1.5s3-.5 4-1.5" />
    <path d="M12 3V1M12 23v-2M3 12H1M23 12h-2" />
  </>} />,
  Text: (props: any) => <Icon {...props} path={<>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>} />,
  Upload: (props: any) => <Icon {...props} path={<>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>} />,
  Music: (props: any) => <Icon {...props} path={<>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>} />,
  X: (props: any) => <Icon {...props} path={<>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </>} />,
  ArrowLeft: (props: any) => <Icon {...props} path={<>
    <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
  </>} />,
  Close: (props: any) => <Icon {...props} path={<>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </>} />,
  Story: (props: any) => <Icon {...props} path={<>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </>} />,
  Feed: (props: any) => <Icon {...props} path={<>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </>} />,
  Check: (props: any) => <Icon {...props} path={<>
    <polyline points="20 6 9 17 4 12" />
  </>} />,
  Sparkles: (props: any) => <Icon {...props} path={<>
    <path d="m12 3-1.9 5.8L4 10.7l5.8 1.9L12 18.4l2.1-5.8L20 10.7l-6.1-1.9Z" />
  </>} />,
};

// ─── COMPOSANT CONTENU (utilise useSearchParams) ──────────
function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isDark, theme } = useAppTheme();

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "photo" | null>(null);
  
  const [sounds, setSounds] = useState<any[]>([]);
  const [selectedSound, setSelectedSound] = useState<any>(null);
  const [showSoundModal, setShowSoundModal] = useState(false);

  const [feedTitle, setFeedTitle] = useState("");
  const [feedCaption, setFeedCaption] = useState("");

  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    overlay: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
    pink: "#EC4899",
    mediaBg: "#000000",
  };

  useEffect(() => {
    fetchSounds();
    
    const aiImageBase64 = sessionStorage.getItem('ai_generated_image');
    const aiDesc = sessionStorage.getItem('ai_generated_desc');

    if (aiImageBase64) {
      setPreviewUrl(aiImageBase64);
      setMediaType("photo");
      if (aiDesc) setFeedCaption(aiDesc);
      setStep("review");
      
      sessionStorage.removeItem('ai_generated_image');
      sessionStorage.removeItem('ai_generated_desc');
    }

    return () => {
      if (previewUrl && !previewUrl.startsWith('http') && !previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const fetchSounds = async () => {
    const { data, error } = await supabase.from("sounds").select("*").limit(20);
    if (!error && data) setSounds(data);
  };

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
    setStep("upload");
  };

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

      if (!fileToUpload && previewUrl) {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        fileToUpload = new File([blob], `ai_generated_${Date.now()}.jpg`, { 
          type: blob.type || "image/jpeg" 
        });
      }

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

      alert(`✅ Publié avec succès dans ${target === "story" ? "vos Stories" : "votre Feed"} !`);
      
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
        <button onClick={() => step === "review" && !searchParams.get('ai_url') ? setStep("upload") : router.back()} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", display: "flex", alignItems: "center" }}>
          {step === "review" && !searchParams.get('ai_url') ? <Icons.ArrowLeft size={24} /> : <Icons.Close size={24} />}
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
          {step === "upload" ? "Nouvelle publication" : "Dernières vérifications"}
        </h1>
        <div style={{ width: "24px" }} />
      </div>

      {/* ONGLETS DYNAMIQUES */}
      <div style={{ display: "flex", gap: "12px", padding: "16px 24px" }}>
        <button
          onClick={() => router.push("/create/ai")}
          onMouseEnter={() => setHoveredTab("ai")}
          onMouseLeave={() => setHoveredTab(null)}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{
            flex: 1,
            padding: "20px 12px",
            background: hoveredTab === "ai"
              ? `linear-gradient(135deg, ${colors.primary}26, ${colors.pink}26)`
              : colors.card,
            border: `1.5px solid ${hoveredTab === "ai" ? colors.primary : colors.border}`,
            borderRadius: "16px",
            color: colors.text,
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.25s ease",
            boxShadow: hoveredTab === "ai" ? `0 8px 24px ${colors.primary}33` : "none",
          }}
        >
          <span style={{ color: hoveredTab === "ai" ? colors.primary : colors.textMuted, transition: "color 0.25s" }}>
            <Icons.Ai size={28} />
          </span>
          <span>Image IA</span>
        </button>

        <button
          onClick={() => router.push("/create/text")}
          onMouseEnter={() => setHoveredTab("text")}
          onMouseLeave={() => setHoveredTab(null)}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{
            flex: 1,
            padding: "20px 12px",
            background: hoveredTab === "text"
              ? `linear-gradient(135deg, ${colors.primary}26, ${colors.pink}26)`
              : colors.card,
            border: `1.5px solid ${hoveredTab === "text" ? colors.primary : colors.border}`,
            borderRadius: "16px",
            color: colors.text,
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.25s ease",
            boxShadow: hoveredTab === "text" ? `0 8px 24px ${colors.primary}33` : "none",
          }}
        >
          <span style={{ color: hoveredTab === "text" ? colors.primary : colors.textMuted, transition: "color 0.25s" }}>
            <Icons.Text size={28} />
          </span>
          <span>Texte</span>
        </button>
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
              <video src={previewUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: colors.mediaBg }} />
            ) : (
              <img src={previewUrl} alt="Aperçu" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            )
          ) : (
            <div onClick={() => fileInputRef.current?.click()} style={{ textAlign: "center", padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ color: colors.primary, marginBottom: "16px" }}>
                <Icons.Upload size={56} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Importer un média</h3>
              <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "20px" }}>Cliquez pour choisir une photo ou une vidéo</p>
              <button style={{ padding: "10px 24px", backgroundColor: colors.primary, color: colors.primaryText, border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                Sélectionner un fichier
              </button>
            </div>
          )}
        </div>

        {/* ÉTAPE 1 : SÉLECTION DU SON */}
        {step === "upload" && (selectedFile || previewUrl) && !searchParams.get('ai_url') && (
          <>
            <div style={{ backgroundColor: colors.card, borderRadius: "16px", padding: "16px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icons.Music size={18} /> Son
                </h3>
                <button onClick={() => setShowSoundModal(true)} style={{ background: "none", border: "none", color: colors.primary, fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
                  {selectedSound ? "Changer" : "Ajouter un son"}
                </button>
              </div>
              {selectedSound ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
                    <Icons.Music size={20} />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSound.title}</div>
                    <div style={{ fontSize: "12px", color: colors.textMuted }}>{selectedSound.artist}</div>
                  </div>
                  <button onClick={() => { setSelectedSound(null); if(audioRef.current) audioRef.current.pause(); }} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", display: "flex" }}>
                    <Icons.X size={18} />
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "12px", color: colors.textMuted, fontSize: "14px", border: `1px dashed ${colors.border}`, borderRadius: "8px" }}>Aucun son sélectionné</div>
              )}
            </div>
            <button onClick={() => setStep("review")} style={{ width: "100%", padding: "16px", backgroundColor: colors.primary, border: "none", borderRadius: "12px", color: colors.primaryText, fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
              Suivant
            </button>
          </>
        )}

        {/* ÉTAPE 2 : CHOIX DE PUBLICATION */}
        {step === "review" && (
          <>
            {selectedSound && (
              <div style={{ padding: "12px", backgroundColor: colors.hover, borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ color: colors.primary, display: "flex" }}><Icons.Music size={20} /></span>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSound.title}</div>
                  <div style={{ fontSize: "12px", color: colors.textMuted }}>{selectedSound.artist}</div>
                </div>
              </div>
            )}

            <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 20px 0" }}>Où voulez-vous publier ?</h2>
            <PublishCard icon={<Icons.Story size={24} />} title="Ma Story" subtitle="Disparaît après 24h" color={colors.primary} textColor={colors.primaryText} textMuted={colors.textMuted} onClick={() => handlePublish("story")} />
            <PublishCard icon={<Icons.Feed size={24} />} title="Mon Feed" subtitle="Reste sur votre profil" color={colors.pink} textColor="#FFFFFF" textMuted={colors.textMuted} onClick={() => setShowFeedModal(true)} />
          </>
        )}
      </div>

      {/* MODAL SONS */}
      {showSoundModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: colors.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowSoundModal(false)}>
          <div style={{ backgroundColor: colors.card, width: "100%", maxWidth: "500px", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px", maxHeight: "60vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "40px", height: "4px", backgroundColor: colors.border, borderRadius: "2px", margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", textAlign: "center" }}>Choisir un son</h3>
            {sounds.length === 0 ? (
              <p style={{ textAlign: "center", color: colors.textMuted }}>Chargement des sons...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sounds.map((sound: any) => (
                  <div key={sound.id} onClick={() => playSound(sound)} style={{ padding: "12px", borderBottom: `1px solid ${colors.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", borderRadius: "8px", backgroundColor: selectedSound?.id === sound.id ? colors.hover : "transparent" }}>
                    <span style={{ color: colors.primary, display: "flex" }}><Icons.Music size={22} /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>{sound.title}</div>
                      <div style={{ fontSize: "12px", color: colors.textMuted }}>{sound.artist}</div>
                    </div>
                    {selectedSound?.id === sound.id && <span style={{ color: colors.primary, display: "flex" }}><Icons.Check size={18} /></span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL FEED */}
      {showFeedModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: colors.overlay, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ backgroundColor: colors.card, width: "100%", maxWidth: "600px", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: "40px", height: "4px", backgroundColor: colors.border, borderRadius: "2px", margin: "0 auto 24px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold" }}>Détails de la publication</h3>
            <input type="text" value={feedTitle} onChange={(e) => setFeedTitle(e.target.value)} placeholder="Titre" style={{ width: "100%", padding: "14px 16px", marginBottom: "12px", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", color: colors.text, fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
            <textarea value={feedCaption} onChange={(e) => setFeedCaption(e.target.value)} placeholder="Légende (optionnel)" rows={3} style={{ width: "100%", padding: "14px 16px", marginBottom: "24px", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "12px", color: colors.text, fontSize: "15px", outline: "none", resize: "none", boxSizing: "border-box" }} />
            <button onClick={() => handlePublish("feed")} style={{ width: "100%", padding: "16px", backgroundColor: colors.primary, border: "none", borderRadius: "12px", color: colors.primaryText, fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Publier sur le Feed</button>
            <button onClick={() => setShowFeedModal(false)} style={{ width: "100%", padding: "16px", marginTop: "12px", backgroundColor: "transparent", border: `1px solid ${colors.border}`, borderRadius: "12px", color: colors.textMuted, fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PublishCard({ 
  icon, title, subtitle, color, textColor, textMuted, onClick 
}: { 
  icon: React.ReactNode; title: string; subtitle: string; color: string; 
  textColor: string; textMuted: string; onClick: () => void 
}) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "16px", marginBottom: "12px", backgroundColor: `${color}26`, border: `1.5px solid ${color}80`, borderRadius: "16px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", textAlign: "left", transition: "transform 0.1s" }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", color: textColor }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: textColor, fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>{title}</div>
        <div style={{ color: textMuted, fontSize: "13px" }}>{subtitle}</div>
      </div>
      <div style={{ color: textMuted, fontSize: "18px" }}>›</div>
    </button>
  );
}

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