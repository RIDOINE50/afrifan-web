"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function StatsTab() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState(7); // 7, 30, ou 90 jours
  const [stats, setStats] = useState<any>({
    totalViews: 0,
    newFollowers: 0,
    totalLikes: 0,
    totalFollowers: 0,
    viewsByDay: {},
  });
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
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

      // Calculer la date de coupure
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - selectedPeriod);
      const dateStr = cutoffDate.toISOString();

      // 1. Total Abonnés
      const { count: totalFollowers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      // 2. Nouveaux Abonnés (sur la période)
      const { count: newFollowers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)
        .gte('created_at', dateStr);

      // 3. Récupérer tous les posts pour calculer les likes, vues et le graphique
      const { data: posts } = await supabase
        .from('posts')
        .select('id, media_url, likes_count, views_count, created_at')
        .eq('user_id', user.id)
        .order('views_count', { ascending: false })
        .limit(50); // On prend les 50 derniers pour le graphique et le top 5

      let totalViews = 0;
      let totalLikes = 0;
      const viewsByDay: Record<string, number> = {};

      if (posts) {
        posts.forEach((post: any) => {
          totalViews += post.views_count || 0;
          totalLikes += post.likes_count || 0;

          // Agrégation pour le graphique (uniquement si dans la période)
          const postDate = new Date(post.created_at);
          if (postDate >= cutoffDate) {
            const dayKey = postDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            viewsByDay[dayKey] = (viewsByDay[dayKey] || 0) + (post.views_count || 0);
          }
        });
      }

      // Trier les données du graphique chronologiquement
      const sortedViewsByDay: Record<string, number> = {};
      Object.keys(viewsByDay)
        .sort((a, b) => {
          // Petit hack pour trier les dates "JJ/MM"
          const [dA, mA] = a.split('/');
          const [dB, mB] = b.split('/');
          return new Date(2024, parseInt(mB)-1, parseInt(dB)).getTime() - new Date(2024, parseInt(mA)-1, parseInt(dA)).getTime();
        })
        .reverse() // Du plus ancien au plus récent pour l'affichage gauche -> droite
        .forEach(key => { sortedViewsByDay[key] = viewsByDay[key]; });

      setStats({
        totalViews,
        newFollowers: newFollowers || 0,
        totalLikes,
        totalFollowers: totalFollowers || 0,
        viewsByDay: sortedViewsByDay,
      });

      // 4. Top 5 des posts
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

  // Calcul pour le graphique
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
              color: colors.text, fontWeight: "bold", fontSize: "14px", cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            {days} jours
          </button>
        ))}
      </div>

      {/* 2. CARTES DE STATISTIQUES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <StatCard title="Vues totales" value={formatNumber(stats.totalViews)} icon="👁️" color={colors.blue} />
        <StatCard title="Nouveaux abonnés" value={formatNumber(stats.newFollowers)} icon="👤+" color={colors.green} />
        <StatCard title="Total Likes" value={formatNumber(stats.totalLikes)} icon="❤️" color={colors.red} />
        <StatCard title="Total Abonnés" value={formatNumber(stats.totalFollowers)} icon="👥" color={colors.purple} />
      </div>

      {/* 3. GRAPHIQUE SIMPLE (Évolution des vues) */}
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
                    height: `${Math.max(heightPercent, 5)}%`, // Min 5% pour la visibilité
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
                onClick={() => router.push(`/creator/post-stats/${post.id}`)} // À adapter selon ta route
                style={{
                  backgroundColor: colors.card, borderRadius: "12px", padding: "12px",
                  border: `1px solid ${colors.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#252525"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.card}
              >
                {/* Miniature */}
                <div style={{
                  width: "60px", height: "60px", borderRadius: "8px", backgroundColor: "#2A2A2A",
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

// Composant Carte de Statistique réutilisable
function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <div style={{
      backgroundColor: "#1A1A1A", borderRadius: "16px", padding: "16px",
      border: "1px solid #2A2A2A", display: "flex", flexDirection: "column", gap: "12px"
    }}>
      <span style={{ fontSize: "28px" }}>{icon}</span>
      <div style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: "bold" }}>{value}</div>
      <div style={{ color: "#9CA3AF", fontSize: "12px" }}>{title}</div>
    </div>
  );
}