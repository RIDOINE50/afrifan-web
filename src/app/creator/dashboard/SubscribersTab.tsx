"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SubscribersTab() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedPeriodTrigger, setSelectedPeriodTrigger] = useState(0);
  
  const [metrics, setMetrics] = useState({
    currentMonth: 0,
    lastMonth: 0,
    last6Months: 0,
  });

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
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

      // ✅ CORRECTION ICI : On précise !subscriptions_fan_id_fkey pour cibler le profil du fan
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

      // Calculer les métriques
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

      // Filtrer la liste
      let filteredSubs = allSubs || [];
      if (selectedFilter !== "all") {
        filteredSubs = filteredSubs.filter((sub: any) => sub.tier_type === selectedFilter);
      }

      // Trier par date de fin d'abonnement
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
        <MiniMetricCard label="Ce mois" value={metrics.currentMonth} icon="📈" color={colors.green} />
        <MiniMetricCard label="Mois dernier" value={metrics.lastMonth} icon="🕒" color={colors.blue} />
        <MiniMetricCard label="6 derniers mois" value={metrics.last6Months} icon="📅" color={colors.primary} />
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
              color: selectedFilter === filter ? colors.text : colors.textMuted,
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
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
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
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#252525"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.card; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    backgroundColor: `${colors.primary}33`,
                    backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", color: colors.primary, flexShrink: 0
                  }}>
                    {!profile?.avatar_url && "👤"}
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
                        color: colors.text,
                        fontSize: "10px",
                        fontWeight: "bold"
                      }}>
                        {sub.tier_type === 'pro' ? 'PRO' : 'PREMIUM'}
                      </span>

                      <span style={{ 
                        color: isExpiringSoon ? colors.orange : colors.textMuted, 
                        fontSize: "12px",
                        display: "flex", alignItems: "center", gap: "4px"
                      }}>
                        📅 {isExpiringSoon ? `Expire dans ${daysLeft}j` : `Expire le ${formatDate(sub.end_date)}`}
                      </span>
                    </div>
                  </div>

                  <span style={{ color: colors.textMuted, fontSize: "20px" }}>›</span>
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

// Composant Carte Métrique Réutilisable
function MiniMetricCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div style={{
      backgroundColor: "#1A1A1A",
      borderRadius: "12px",
      border: "1px solid #2A2A2A",
      padding: "12px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center"
    }}>
      <span style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</span>
      <div style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: "bold" }}>{value}</div>
      <div style={{ color: "#9CA3AF", fontSize: "10px", marginTop: "2px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </div>
    </div>
  );
}