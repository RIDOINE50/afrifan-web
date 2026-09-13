"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

interface PostSelectionProps {
  file?: File | null;
  mediaType?: "video" | "image";
  selectedSound?: { title: string; artist: string; url: string } | null;
}

export default function PostSelectionScreen({ 
  file = null, 
  mediaType = "image", 
  selectedSound = null 
}: PostSelectionProps) {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  
  const [feedTitle, setFeedTitle] = useState("");
  const [feedCaption, setFeedCaption] = useState("");

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
    overlay: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
    pink: "#EC4899",
    mediaBg: "#111111",
  };

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(mediaType === "video" 
        ? "https://www.w3schools.com/html/mov_bbb.mp4" 
        : "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600");
    }
  }, [file, mediaType]);

  const handlePublish = async (target: "story" | "feed", title?: string, caption?: string) => {
    if (!file && !previewUrl?.startsWith("http")) {
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

      let mediaUrl = previewUrl;
      let fileName = "";

      if (file && !previewUrl?.startsWith("http")) {
        const fileExt = file.name.split('.').pop();
        fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const bucket = target === "story" ? "stories" : "posts";

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        mediaUrl = data.publicUrl;
      }

      const table = target === "story" ? "stories" : "posts";
      const record: any = {
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
      };

      if (target === "feed") {
        record.title = title || "";
        record.content = caption || "";
        record.music_url = selectedSound?.url || null;
      } else {
        record.creator_id = user.id;
        if (selectedSound) record.music_url = selectedSound.url;
      }

      const { error: dbError } = await supabase.from(table).insert(record);
      if (dbError) throw dbError;

      alert(`✅ Publié avec succès dans ${target === "story" ? "vos Stories" : "votre Feed"} !`);
      router.push("/");
      
    } catch (error) {
      console.error("❌ Erreur de publication:", error);
      alert("Une erreur est survenue lors de la publication.");
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
      
      {/* 1. ZONE D'APERÇU */}
      <div style={{ 
        flex: 3, 
        backgroundColor: colors.mediaBg, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        borderBottomLeftRadius: "32px",
        borderBottomRightRadius: "32px",
        overflow: "hidden",
        position: "relative"
      }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            position: "absolute", top: "20px", left: "20px", 
            background: "rgba(0,0,0,0.5)", border: "none", 
            color: "white", borderRadius: "50%", 
            width: "40px", height: "40px", cursor: "pointer", 
            fontSize: "20px", zIndex: 10 
          }}
        >
          ←
        </button>

        {mediaType === "video" ? (
          <video 
            src={previewUrl || ""} 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        ) : (
          <img 
            src={previewUrl || ""} 
            alt="Aperçu" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        )}
      </div>

      {/* 2. ZONE DE CONTRÔLE */}
      <div style={{ flex: 2, padding: "24px", display: "flex", flexDirection: "column" }}>
        
        {selectedSound && (
          <div style={{ 
            padding: "12px", 
            backgroundColor: colors.hover, 
            borderRadius: "12px", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            marginBottom: "20px"
          }}>
            <span style={{ fontSize: "20px" }}>🎵</span>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: colors.text }}>
                {selectedSound.title}
              </div>
              <div style={{ fontSize: "12px", color: colors.textMuted }}>
                {selectedSound.artist}
              </div>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 20px 0" }}>Où voulez-vous publier ?</h2>

        <PublishCard 
          icon="⚡"
          title="Ma Story"
          subtitle="Disparaît après 24h"
          color={colors.primary}
          textColor={colors.primaryText}
          textMuted={colors.textMuted}
          onClick={() => handlePublish("story")}
        />

        <PublishCard 
          icon="📱"
          title="Mon Feed"
          subtitle="Reste sur votre profil"
          color={colors.pink}
          textColor="#FFFFFF"
          textMuted={colors.textMuted}
          onClick={() => setShowFeedModal(true)}
        />
      </div>

      {/* 3. MODAL PUBLICATION FEED */}
      {showFeedModal && (
        <div style={{ 
          position: "fixed", inset: 0, backgroundColor: colors.overlay, zIndex: 100, 
          display: "flex", alignItems: "flex-end", justifyContent: "center" 
        }}>
          <div style={{ 
            backgroundColor: colors.card, width: "100%", maxWidth: "600px", 
            borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "24px" 
          }}>
            <div style={{ width: "40px", height: "4px", backgroundColor: colors.border, borderRadius: "2px", margin: "0 auto 24px" }} />
            
            <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "bold", color: colors.text }}>Détails de la publication</h3>
            
            <input
              type="text"
              value={feedTitle}
              onChange={(e) => setFeedTitle(e.target.value)}
              placeholder="Titre"
              style={{
                width: "100%", padding: "14px 16px", marginBottom: "12px",
                backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: "12px", color: colors.text, fontSize: "15px", 
                outline: "none", boxSizing: "border-box"
              }}
            />
            
            <textarea
              value={feedCaption}
              onChange={(e) => setFeedCaption(e.target.value)}
              placeholder="Légende (optionnel)"
              rows={3}
              style={{
                width: "100%", padding: "14px 16px", marginBottom: "24px",
                backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: "12px", color: colors.text, fontSize: "15px", 
                outline: "none", resize: "none", boxSizing: "border-box"
              }}
            />

            <button
              onClick={() => handlePublish("feed", feedTitle, feedCaption)}
              style={{
                width: "100%", padding: "16px", backgroundColor: colors.primary,
                border: "none", borderRadius: "12px", color: colors.primaryText,
                fontWeight: "bold", fontSize: "16px", cursor: "pointer"
              }}
            >
              Publier sur le Feed
            </button>
            
            <button
              onClick={() => setShowFeedModal(false)}
              style={{
                width: "100%", padding: "16px", marginTop: "12px", 
                backgroundColor: "transparent",
                border: `1px solid ${colors.border}`, 
                borderRadius: "12px", color: colors.textMuted,
                fontWeight: "bold", fontSize: "14px", cursor: "pointer"
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function PublishCard({ 
  icon, title, subtitle, color, textColor, textMuted, onClick 
}: { 
  icon: string; title: string; subtitle: string; color: string; 
  textColor: string; textMuted: string; onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "16px", marginBottom: "12px",
        backgroundColor: `${color}26`,
        border: `1.5px solid ${color}80`,
        borderRadius: "16px",
        display: "flex", alignItems: "center", gap: "16px",
        cursor: "pointer", textAlign: "left", transition: "transform 0.1s"
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ 
        width: "48px", height: "48px", borderRadius: "12px", 
        backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "24px", color: textColor
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: textColor === "#FFFFFF" ? "#FFFFFF" : textColor, fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>{title}</div>
        <div style={{ color: textMuted, fontSize: "13px" }}>{subtitle}</div>
      </div>
      <div style={{ color: textMuted, fontSize: "18px" }}>›</div>
    </button>
  );
}