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
  TrendingUp: (props: any) => <Icon {...props} path={<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>} />,
  Clock: (props: any) => <Icon {...props} path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />,
  Calendar: (props: any) => <Icon {...props} path={<><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />,
  Users: (props: any) => <Icon {...props} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  User: (props: any) => <Icon {...props} path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  ChevronRight: (props: any) => <Icon {...props} path={<><path d="m9 18 6-6-6-6" /></>} />,
};

export default function SubscribersTab() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedPeriodTrigger, setSelectedPeriodTrigger] = useState(0);
  
  const [metrics, setMetrics] = useState({
    currentMonth: 0,
    lastMonth: 0,
    last6Months: 0,
  });

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
    blue: "#3B82F6",
    orange: "#F97316",
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriodTrigger]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allSubs, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          fan_id,
          tier_type,
          end_date,
          created_at,
          profiles!subscriptions_fan_id_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('creator_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      let currentMonth = 0;
      let lastMonth = 0;
      let last6Months = 0;

      allSubs?.forEach((sub: any) => {
        const createdAt = new Date(sub.created_at);
        if (createdAt >= startOfMonth) currentMonth++;
        if (createdAt >= startOfLastMonth && createdAt < startOfMonth) lastMonth++;
        if (createdAt >= sixMonthsAgo) last6Months++;
      });

      setMetrics({ currentMonth, lastMonth, last6Months });

      let filteredSubs = allSubs || [];
      if (selectedFilter !== "all") {
        filteredSubs = filteredSubs.filter((sub: any) => sub.tier_type === selectedFilter);
      }

      filteredSubs.sort((a: any, b: any) => 
        new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      );

      setSubscribers(filteredSubs);
    } catch (error) {
      console.error("❌ Erreur chargement abonnés:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setSelectedPeriodTrigger(prev => prev + 1);
  };

  const getDaysLeft = (endDateStr: string) => {
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return "Date inconnue";
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* 1. SECTION MÉTRIQUES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <MiniMetricCard label="Ce mois" value={metrics.currentMonth} icon={<Icons.TrendingUp size={20} color={colors.green} />} color={colors.green} colors={colors} />
        <MiniMetricCard label="Mois dernier" value={metrics.lastMonth} icon={<Icons.Clock size={20} color={colors.blue} />} color={colors.blue} colors={colors} />
        <MiniMetricCard label="6 derniers mois" value={metrics.last6Months} icon={<Icons.Calendar size={20} color={colors.primary} />} color={colors.primary} colors={colors} />
      </div>

      {/* 2. SECTION FILTRES */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
        {['all', 'premium', 'pro'].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: `1px solid ${selectedFilter === filter ? colors.primary : colors.border}`,
              backgroundColor: selectedFilter === filter ? colors.primary : colors.card,
              color: selectedFilter === filter ? colors.primaryText : colors.textMuted,
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
          >
            {filter === 'all' ? 'Tous' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* 3. LISTE DES ABONNÉS */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {subscribers.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: colors.textMuted }}>
            {/* ✅ Icône Users SVG au lieu de l'émoji 👥 */}
            <div style={{ marginBottom: "16px", opacity: 0.6 }}>
              <Icons.Users size={48} color={colors.textMuted} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: "16px" }}>Aucun abonné actif {selectedFilter !== 'all' ? 'dans cette catégorie' : ''}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {subscribers.map((sub: any) => {
              const profile = sub.profiles;
              const daysLeft = getDaysLeft(sub.end_date);
              const isExpiringSoon = daysLeft <= 7;

              return (
                <div
                  key={sub.id}
                  onClick={() => router.push(`/profile?id=${sub.fan_id}`)}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: "16px",
                    border: `1px solid ${colors.border}`,
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "background 0.2s, transform 0.1s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.card; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    backgroundColor: colors.hover,
                    backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: colors.primary, flexShrink: 0
                  }}>
                    {/* ✅ Icône User SVG au lieu de l'émoji 👤 */}
                    {!profile?.avatar_url && <Icons.User size={22} color={colors.primary} />}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: colors.text, fontSize: "15px", fontWeight: 600, marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profile?.full_name || profile?.username || 'Utilisateur'}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        backgroundColor: sub.tier_type === 'pro' ? colors.primary : colors.border,
                        color: sub.tier_type === 'pro' ? colors.primaryText : colors.text,
                        fontSize: "10px",
                        fontWeight: "bold"
                      }}>
                        {sub.tier_type === 'pro' ? 'PRO' : 'PREMIUM'}
                      </span>

                      {/* ✅ Icône Calendar SVG au lieu de l'émoji 📅 */}
                      <span style={{ 
                        color: isExpiringSoon ? colors.orange : colors.textMuted, 
                        fontSize: "12px",
                        display: "flex", alignItems: "center", gap: "4px"
                      }}>
                        <Icons.Calendar size={12} color={isExpiringSoon ? colors.orange : colors.textMuted} />
                        {isExpiringSoon ? `Expire dans ${daysLeft}j` : `Expire le ${formatDate(sub.end_date)}`}
                      </span>
                    </div>
                  </div>

                  {/* ✅ Icône ChevronRight SVG au lieu du caractère › */}
                  <Icons.ChevronRight size={20} color={colors.textMuted} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ✅ MiniMetricCard accepte maintenant un ReactNode comme icône
function MiniMetricCard({ label, value, icon, color, colors }: { label: string; value: number; icon: React.ReactNode; color: string; colors: any }) {
  return (
    <div style={{
      backgroundColor: colors.card,
      borderRadius: "12px",
      border: `1px solid ${colors.border}`,
      padding: "12px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center"
    }}>
      <span style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>{icon}</span>
      <div style={{ color: colors.text, fontSize: "18px", fontWeight: "bold" }}>{value}</div>
      <div style={{ color: colors.textMuted, fontSize: "10px", marginTop: "2px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </div>
    </div>
  );
}