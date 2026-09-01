"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

export default function AbonnementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    green: "#10B981",
    orange: "#F97316",
    red: "#EF4444",
    gold: "#F59E0B",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await fetchSubscriptions(session.user.id);
    };
    init();
  }, [router]);

  const fetchSubscriptions = async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Récupérer tous les abonnements de l'utilisateur
      const { data: subsData, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("fan_id", userId)
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;

      if (!subsData || subsData.length === 0) {
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }

      // 2. Récupérer les profils des créateurs
      const creatorIds = [...new Set(subsData.map((s: any) => s.creator_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, is_verified")
        .in("id", creatorIds);

      if (profilesError) throw profilesError;

      // 3. Grouper les abonnements par créateur (garder le plus récent/élevé)
      const groupedSubs: Record<string, any> = {};
      
      subsData.forEach((sub: any) => {
        const creatorId = sub.creator_id;
        
        if (!groupedSubs[creatorId]) {
          groupedSubs[creatorId] = {
            creator_id: creatorId,
            subscriptions: [],
            profile: profilesData?.find((p: any) => p.id === creatorId) || {
              username: "Utilisateur",
              full_name: "Utilisateur",
              avatar_url: null,
              is_verified: false,
            },
          };
        }
        
        groupedSubs[creatorId].subscriptions.push(sub);
      });

      // 4. Pour chaque créateur, déterminer le statut global
      const now = new Date();
      const finalSubscriptions = Object.values(groupedSubs).map((group: any) => {
        // Trouver l'abonnement le plus récent ou actif
        const activeSub = group.subscriptions.find((s: any) => s.status === "active");
        const latestSub = group.subscriptions[0]; // Le plus récent (trié par created_at DESC)
        
        const currentSub = activeSub || latestSub;
        const endDate = new Date(currentSub.end_date);
        const isExpired = endDate < now;
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Déterminer le statut d'affichage
        let displayStatus = "active";
        if (isExpired) displayStatus = "expired";
        else if (daysRemaining <= 7) displayStatus = "expiring_soon";
        
        // Obtenir le tier le plus élevé
        const tiers = group.subscriptions.map((s: any) => s.tier_type);
        const highestTier = tiers.includes("pro") ? "pro" : tiers.includes("premium") ? "premium" : "basic";
        
        return {
          ...group,
          current_subscription: currentSub,
          all_tiers: tiers,
          highest_tier: highestTier,
          end_date: endDate,
          is_expired: isExpired,
          days_remaining: daysRemaining,
          display_status: displayStatus,
        };
      });

      // Trier : actifs d'abord, puis expirés
      finalSubscriptions.sort((a: any, b: any) => {
        if (a.display_status === "active" && b.display_status !== "active") return -1;
        if (a.display_status !== "active" && b.display_status === "active") return 1;
        return b.end_date.getTime() - a.end_date.getTime();
      });

      setSubscriptions(finalSubscriptions);
    } catch (error) {
      console.error("❌ Erreur chargement des abonnements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenew = (creatorId: string) => {
    router.push(`/subscribe/${creatorId}`);
  };

  const handleViewProfile = (creatorId: string) => {
    router.push(`/createur?id=${creatorId}`);
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "pro": return "Pro";
      case "premium": return "Premium";
      case "basic": return "Basic";
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "pro": return "#F59E0B"; // Or
      case "premium": return "#8B5CF6"; // Violet
      case "basic": return "#10B981"; // Vert
      default: return "#9CA3AF";
    }
  };

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === "expired") {
      return { label: "Expiré", color: colors.red, bgColor: "rgba(239, 68, 68, 0.1)" };
    }
    if (status === "expiring_soon") {
      return { label: `Expire dans ${daysRemaining}j`, color: colors.orange, bgColor: "rgba(249, 115, 22, 0.1)" };
    }
    return { label: "Actif", color: colors.green, bgColor: "rgba(16, 185, 129, 0.1)" };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ height: "100dvh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px", minHeight: "100dvh", backgroundColor: colors.bg }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: colors.text, margin: "0 0 8px 0" }}>
            Mes Abonnements
          </h1>
          <p style={{ fontSize: "14px", color: colors.textMuted, margin: 0 }}>
            {subscriptions.length} {subscriptions.length > 1 ? "créateurs abonnés" : "créateur abonné"}
          </p>
        </div>

        {/* Liste des abonnements */}
        {subscriptions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⭐</div>
            <h3 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Aucun abonnement actif</h3>
            <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "20px" }}>
              Abonnez-vous à des créateurs pour accéder à leur contenu exclusif.
            </p>
            <button
              onClick={() => router.push("/explore")}
              style={{
                padding: "12px 24px",
                backgroundColor: colors.primary,
                border: "none",
                borderRadius: "20px",
                color: "#FFFFFF",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Découvrir des créateurs
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {subscriptions.map((sub: any) => {
              const statusBadge = getStatusBadge(sub.display_status, sub.days_remaining);
              const tierColor = getTierColor(sub.highest_tier);
              
              return (
                <div
                  key={sub.creator_id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: "16px",
                    border: `1px solid ${colors.border}`,
                    overflow: "hidden",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {/* Header de la carte */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleViewProfile(sub.creator_id)}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        backgroundColor: colors.border,
                        backgroundImage: sub.profile?.avatar_url ? `url(${sub.profile.avatar_url})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        flexShrink: 0,
                        border: `3px solid ${tierColor}`,
                      }}
                    >
                      {!sub.profile?.avatar_url && "👤"}
                    </div>

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "bold", fontSize: "18px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sub.profile?.full_name || sub.profile?.username}
                        </span>
                        {sub.profile?.is_verified && (
                          <span style={{ color: colors.green, fontSize: "16px" }}>✓</span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: colors.textMuted, marginBottom: "8px" }}>
                        @{sub.profile?.username}
                      </div>
                      
                      {/* Badge de statut */}
                      <div
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          backgroundColor: statusBadge.bgColor,
                          color: statusBadge.color,
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {statusBadge.label}
                      </div>
                    </div>

                    {/* Badge Tier */}
                    <div
                      style={{
                        padding: "8px 16px",
                        backgroundColor: `${tierColor}20`,
                        border: `1px solid ${tierColor}`,
                        borderRadius: "12px",
                        color: tierColor,
                        fontWeight: "bold",
                        fontSize: "14px",
                        flexShrink: 0,
                      }}
                    >
                      {getTierLabel(sub.highest_tier)}
                    </div>
                  </div>

                  {/* Footer avec infos et bouton */}
                  <div
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "rgba(0, 0, 0, 0.2)",
                      borderTop: `1px solid ${colors.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    {/* Date d'expiration */}
                    <div style={{ fontSize: "13px", color: colors.textMuted }}>
                      {sub.is_expired ? (
                        <span style={{ color: colors.red }}>
                          Expiré le {formatDate(sub.end_date)}
                        </span>
                      ) : (
                        <span>
                          Expire le {formatDate(sub.end_date)}
                        </span>
                      )}
                    </div>

                    {/* Bouton Renouveler */}
                    {sub.is_expired && (
                      <button
                        onClick={() => handleRenew(sub.creator_id)}
                        style={{
                          padding: "8px 20px",
                          backgroundColor: colors.primary,
                          border: "none",
                          borderRadius: "20px",
                          color: "#FFFFFF",
                          fontWeight: "bold",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
                      >
                        🔄 Renouveler
                      </button>
                    )}

                    {!sub.is_expired && sub.display_status === "expiring_soon" && (
                      <button
                        onClick={() => handleRenew(sub.creator_id)}
                        style={{
                          padding: "8px 20px",
                          backgroundColor: "transparent",
                          border: `1px solid ${colors.orange}`,
                          borderRadius: "20px",
                          color: colors.orange,
                          fontWeight: "bold",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.orange;
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = colors.orange;
                        }}
                      >
                        Prolonger
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}