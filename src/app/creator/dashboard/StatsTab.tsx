"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// ==========================================
// ✅ VRAIES ICÔNES SVG PROFESSIONNELLES
// ==========================================
const Icon = ({ path, size = 20, className = "", fill = "none", color = "currentColor", strokeWidth = 2 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const Icons = {
  Eye: (props: any) => <Icon {...props} path={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>} />,
  UserPlus: (props: any) => <Icon {...props} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>} />,
  Heart: (props: any) => <Icon {...props} fill="currentColor" stroke="none" path={<><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></>} />,
  Users: (props: any) => <Icon {...props} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  Image: (props: any) => <Icon {...props} path={<><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>} />,
  ChevronRight: (props: any) => <Icon {...props} path={<><path d="m9 18 6-6-6-6" /></>} />,
};

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
        <StatCard title="Vues totales" value={formatNumber(stats.totalViews)} icon={<Icons.Eye size={28} color={colors.blue} />} color={colors.blue} colors={colors} />
        <StatCard title="Nouveaux abonnés" value={formatNumber(stats.newFollowers)} icon={<Icons.UserPlus size={28} color={colors.green} />} color={colors.green} colors={colors} />
        <StatCard title="Total Likes" value={formatNumber(stats.totalLikes)} icon={<Icons.Heart size={28} color={colors.red} />} color={colors.red} colors={colors} />
        <StatCard title="Total Abonnés" value={formatNumber(stats.totalFollowers)} icon={<Icons.Users size={28} color={colors.purple} />} color={colors.purple} colors={colors} />
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
                  {/* ✅ Icône Image SVG au lieu de l'émoji 🖼️ */}
                  {!post.media_url && <Icons.Image size={24} color={colors.textMuted} />}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                    {/* ✅ Icône Eye SVG + Heart SVG */}
                    <span style={{ color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icons.Eye size={14} color={colors.textMuted} /> {formatNumber(post.views_count || 0)}
                    </span>
                    <span style={{ color: colors.text, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icons.Heart size={14} color={colors.red} /> {formatNumber(post.likes_count || 0)}
                    </span>
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: "11px" }}>
                    Publié le {formatDate(post.created_at)}
                  </div>
                </div>

                {/* ✅ ChevronRight SVG au lieu du caractère › */}
                <Icons.ChevronRight size={20} color={colors.textMuted} />
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

// ✅ StatCard accepte maintenant un ReactNode comme icône (au lieu d'un emoji string)
function StatCard({ title, value, icon, color, colors }: { title: string; value: string; icon: React.ReactNode; color: string; colors: any }) {
  return (
    <div style={{
      backgroundColor: colors.card, borderRadius: "16px", padding: "16px",
      border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", gap: "12px"
    }}>
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      <div style={{ color: colors.text, fontSize: "24px", fontWeight: "bold" }}>{value}</div>
      <div style={{ color: colors.textMuted, fontSize: "12px" }}>{title}</div>
    </div>
  );
}