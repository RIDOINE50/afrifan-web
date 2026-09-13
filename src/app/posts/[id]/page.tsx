"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Play, 
  Image as ImageIcon,
  User
} from "lucide-react";

export default function PostStatsPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { isDark, theme } = useAppTheme();

  const [post, setPost] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

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
    overlay: isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
    blue: "#3B82F6",
    red: "#EF4444",
    orange: "#F97316",
    green: "#10B981",
  };

  useEffect(() => {
    if (postId) {
      loadPostStats();
    }
  }, [postId]);

  const loadPostStats = async () => {
    setIsLoading(true);
    try {
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError || !postData) throw new Error("Post introuvable");
      setPost(postData);

      if (postData.user_id) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", postData.user_id)
          .single();
        setCreator(creatorData);
      }

      const views = postData.views_count || 0;
      const likes = postData.likes_count || 0;
      const comments = postData.comments_count || 0;
      const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

      setStats({ views, likes, comments, engagementRate });
    } catch (error) {
      console.error("❌ Erreur chargement stats post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatorClick = () => {
    router.push("/profile");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Inconnue";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Inconnue";
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.text }}>
        <p>Post introuvable</p>
      </div>
    );
  }

  const mediaUrl = post.media_url;
  const caption = post.content || post.caption || "";
  const createdAt = post.created_at;
  const creatorName = creator?.full_name || creator?.username || "Utilisateur";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      {/* 1. HEADER */}
      <div style={{ 
        display: "flex", alignItems: "center", gap: "16px", padding: "16px", 
        borderBottom: `1px solid ${colors.border}`, position: "sticky", top: 0, 
        backgroundColor: colors.overlay, backdropFilter: "blur(10px)", zIndex: 10 
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ padding: "8px", background: "none", border: "none", color: colors.text, borderRadius: "50%", cursor: "pointer" }}
        >
          <ArrowLeft style={{ width: "24px", height: "24px" }} />
        </button>
        <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Statistiques du post</h1>
      </div>

      {/* 2. CONTENU SCROLLABLE */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "32px", maxWidth: "672px", margin: "0 auto", width: "100%" }}>
        
        {/* APERÇU DU POST */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ 
            width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", 
            backgroundColor: colors.hover, flexShrink: 0, border: `1px solid ${colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {mediaUrl ? (
              <img 
                src={mediaUrl} 
                alt="Post" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <ImageIcon style={{ width: "32px", height: "32px", color: colors.textMuted }} />
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div 
              onClick={handleCreatorClick}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "4px" }}
            >
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: colors.hover, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {creator?.avatar_url ? (
                  <img src={creator.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <User style={{ width: "100%", height: "100%", padding: "4px", color: colors.textMuted }} />
                )}
              </div>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: colors.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {creatorName}
              </span>
            </div>

            <p style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.5, marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {caption || "(Pas de légende)"}
            </p>
            <p style={{ fontSize: "10px", color: colors.textMuted }}>
              Publié le {formatDate(createdAt)}
            </p>
          </div>
        </div>

        {/* MÉTRIQUES */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Performance</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <MetricCard title="Vues" value={stats.views.toLocaleString("fr-FR")} icon={<Eye style={{ width: "24px", height: "24px", color: colors.blue }} />} colors={colors} />
            <MetricCard title="Likes" value={stats.likes.toLocaleString("fr-FR")} icon={<Heart style={{ width: "24px", height: "24px", color: colors.red }} />} colors={colors} />
            <MetricCard title="Commentaires" value={stats.comments.toLocaleString("fr-FR")} icon={<MessageCircle style={{ width: "24px", height: "24px", color: colors.orange }} />} colors={colors} />
            <MetricCard title="Engagement" value={`${stats.engagementRate.toFixed(1)}%`} icon={<TrendingUp style={{ width: "24px", height: "24px", color: colors.green }} />} colors={colors} />
          </div>
        </div>

        {/* SOURCES DE TRAFIC */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>D'où viennent vos vues ?</h2>
          <div style={{ backgroundColor: colors.card, borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "20px", border: `1px solid ${colors.border}` }}>
            <TrafficBar label="Pour toi (Découverte)" percentage={0.65} color={colors.primary} colors={colors} />
            <TrafficBar label="Abonnés" percentage={0.25} color={colors.blue} colors={colors} />
            <TrafficBar label="Profil & Partages" percentage={0.10} color={colors.textMuted} colors={colors} />
          </div>
        </div>

        {/* BOUTON D'ACTION */}
        <button
          onClick={() => router.push(`/post/${postId}`)}
          style={{
            width: "100%",
            backgroundColor: colors.primary,
            color: colors.primaryText,
            fontWeight: "bold",
            padding: "16px",
            border: "none",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "opacity 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <Play style={{ width: "20px", height: "20px" }} />
          Voir le post
        </button>
        
        <div style={{ height: "32px" }}></div>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function MetricCard({ title, value, icon, colors }: { title: string; value: string; icon: React.ReactNode; colors: any }) {
  return (
    <div style={{ 
      backgroundColor: colors.card, 
      borderRadius: "16px", 
      padding: "16px", 
      border: `1px solid ${colors.border}`, 
      display: "flex", flexDirection: "column", gap: "12px" 
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: colors.hover, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "24px", fontWeight: "bold", color: colors.text, margin: 0 }}>{value}</p>
        <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "4px", margin: 0 }}>{title}</p>
      </div>
    </div>
  );
}

function TrafficBar({ label, percentage, color, colors }: { label: string; percentage: number; color: string; colors: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
        <span style={{ color: colors.textMuted }}>{label}</span>
        <span style={{ fontWeight: "bold", color: colors.text }}>{Math.round(percentage * 100)}%</span>
      </div>
      <div style={{ height: "8px", backgroundColor: colors.hover, borderRadius: "999px", overflow: "hidden" }}>
        <div 
          style={{ 
            height: "100%", 
            borderRadius: "999px", 
            backgroundColor: color,
            width: `${percentage * 100}%`,
            transition: "width 1s ease-out"
          }}
        />
      </div>
    </div>
  );
}