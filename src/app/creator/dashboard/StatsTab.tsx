"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function StatsTab() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [stats, setStats] = useState<any>({
    totalViews: 0,
    newFollowers: 0,
    totalLikes: 0,
    totalFollowers: 0,
    viewsByDay: {},
  });
  const [topPosts, setTopPosts] = useState<any[]>([]);
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
    blue: "#3B82F6",
    green: "#22C55E",
    red: "#EF4444",
    purple: "#A855F7",
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - selectedPeriod);
      const dateStr = cutoffDate.toISOString();

      const { count: totalFollowers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: newFollowers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)
        .gte('created_at', dateStr);

      const { data: posts } = await supabase
        .from('posts')
        .select('id, media_url, likes_count, views_count, created_at')
        .eq('user_id', user.id)
        .order('views_count', { ascending: false })
        .limit(50);

      let totalViews = 0;
      let totalLikes = 0;
      const viewsByDay: Record<string, number> = {};

      if (posts) {
        posts.forEach((post: any) => {
          totalViews += post.views_count || 0;
          totalLikes += post.likes_count || 0;

          const postDate = new Date(post.created_at);
          if (postDate >= cutoffDate) {
            const dayKey = postDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            viewsByDay[dayKey] = (viewsByDay[dayKey] || 0) + (post.views_count || 0);
          }
        });
      }

      const sortedViewsByDay: Record<string, number> = {};
      Object.keys(viewsByDay)
        .sort((a, b) => {
          const [dA, mA] = a.split('/');
          const [dB, mB] = b.split('/');
          return new Date(2024, parseInt(mB)-1, parseInt(dB)).getTime() - new Date(2024, parseInt(mA)-1, parseInt(dA)).getTime();
        })
        .reverse()
        .forEach(key => { sortedViewsByDay[key] = viewsByDay[key]; });

      setStats({
        totalViews,
        newFollowers: newFollowers || 0,
        totalLikes,
        totalFollowers: totalFollowers || 0,
        viewsByDay: sortedViewsByDay,
      });

      setTopPosts(posts ? posts.slice(0, 5) : []);

    } catch (error) {
      console.error("❌ Erreur chargement stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Inconnue';
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  const chartEntries = Object.entries(stats.viewsByDay);
  const maxValue = Math.max(1, ...chartEntries.map(([_, val]) => val as number));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* 1. SÉLECTEUR DE PÉRIODE */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setSelectedPeriod(days)}
            style={{
              flex: 1, padding: "12px", borderRadius: "12px", border: "none",
              backgroundColor: selectedPeriod === days ? colors.primary : colors.card,
              color: selectedPeriod === days ? colors.primaryText : colors.text,
              fontWeight: "bold", fontSize: "14px", cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            {days} jours
          </button>
        ))}
      </div>

      {/* 2. CARTES DE STATISTIQUES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <StatCard title="Vues totales" value={formatNumber(stats.totalViews)} icon="👁️" color={colors.blue} colors={colors} />
        <StatCard title="Nouveaux abonnés" value={formatNumber(stats.newFollowers)} icon="👤+" color={colors.green} colors={colors} />
        <StatCard title="Total Likes" value={formatNumber(stats.totalLikes)} icon="❤️" color={colors.red} colors={colors} />
        <StatCard title="Total Abonnés" value={formatNumber(stats.totalFollowers)} icon="👥" color={colors.purple} colors={colors} />
      </div>

      {/* 3. GRAPHIQUE */}
      <div>
        <h3 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Évolution des vues</h3>
        <div style={{ backgroundColor: colors.card, borderRadius: "12px", padding: "16px", height: "180px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "8px" }}>
          {chartEntries.length === 0 ? (
            <div style={{ width: "100%", textAlign: "center", color: colors.textMuted, fontSize: "14px" }}>Pas assez de données</div>
          ) : (
            chartEntries.map(([day, value], index) => {
              const heightPercent = ((value as number) / maxValue) * 100;
              return (
                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ color: colors.textMuted, fontSize: "10px", marginBottom: "4px" }}>{formatNumber(value as number)}</span>
                  <div style={{ 
                    width: "100%", maxWidth: "30px", 
                    height: `${Math.max(heightPercent, 5)}%`,
                    backgroundColor: colors.primary, 
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.5s ease"
                  }} />
                  <span style={{ color: colors.textMuted, fontSize: "10px", marginTop: "6px" }}>{day}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. TOP POSTS */}
      <div>
        <h3 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Vos meilleurs posts</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {topPosts.length === 0 ? (
            <div style={{ textAlign: "center", color: colors.textMuted, padding: "20px" }}>Aucun post pour le moment</div>
          ) : (
            topPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => router.push(`/creator/post-stats/${post.id}`)}
                style={{
                  backgroundColor: colors.card, borderRadius: "12px", padding: "12px",
                  border: `1px solid ${colors.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.card}
              >
                {/* Miniature */}
                <div style={{
                  width: "60px", height: "60px", borderRadius: "8px", backgroundColor: colors.hover,
                  backgroundImage: post.media_url ? `url(${post.media_url})` : undefined,
                  backgroundSize: "cover", backgroundPosition: "center",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  {!post.media_url && <span style={{ fontSize: "24px", color: colors.textMuted }}>🖼️</span>}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                    <span style={{ color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                      👁️ {formatNumber(post.views_count || 0)}
                    </span>
                    <span style={{ color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                      ❤️ {formatNumber(post.likes_count || 0)}
                    </span>
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: "11px" }}>
                    Publié le {formatDate(post.created_at)}
                  </div>
                </div>

                <span style={{ color: colors.textMuted, fontSize: "20px" }}>›</span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, color, colors }: { title: string; value: string; icon: string; color: string; colors: any }) {
  return (
    <div style={{
      backgroundColor: colors.card, borderRadius: "16px", padding: "16px",
      border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", gap: "12px"
    }}>
      <span style={{ fontSize: "28px" }}>{icon}</span>
      <div style={{ color: colors.text, fontSize: "24px", fontWeight: "bold" }}>{value}</div>
      <div style={{ color: colors.textMuted, fontSize: "12px" }}>{title}</div>
    </div>
  );
}