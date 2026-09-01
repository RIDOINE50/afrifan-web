"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

export default function SuiviPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    green: "#10B981",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await fetchFollowers(session.user.id);
    };
    init();
  }, [router]);

  const fetchFollowers = async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Récupérer tous les follower_id qui suivent cet utilisateur
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("follower_id, created_at")
        .eq("following_id", userId)
        .order("created_at", { ascending: false });

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowers([]);
        setIsLoading(false);
        return;
      }

      // 2. Récupérer les profils de ces followers
      const followerIds = followsData.map((f: any) => f.follower_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, is_verified")
        .in("id", followerIds);

      if (profilesError) throw profilesError;

      // 3. Fusionner les données pour l'affichage
      const mergedFollowers = followsData.map((follow: any) => {
        const profile = profilesData?.find((p: any) => p.id === follow.follower_id);
        return {
          follower_id: follow.follower_id,
          followed_at: follow.created_at,
          profile: profile || { username: "Utilisateur", full_name: "Utilisateur", avatar_url: null, is_verified: false },
        };
      });

      setFollowers(mergedFollowers);
    } catch (error) {
      console.error("❌ Erreur chargement des followers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (targetUserId: string) => {
    if (user?.id === targetUserId) {
      router.push("/profile");
    } else {
      router.push(`/createur?id=${targetUserId}`);
    }
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
        
        {/* Header de la page */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: colors.text, margin: "0 0 8px 0" }}>
            Mes Abonnés
          </h1>
          <p style={{ fontSize: "14px", color: colors.textMuted, margin: 0 }}>
            {followers.length} {followers.length > 1 ? "personnes te suivent" : "personne te suit"}
          </p>
        </div>

        {/* Liste des followers */}
        {followers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
            <h3 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Aucun abonné pour le moment</h3>
            <p style={{ color: colors.textMuted, fontSize: "14px" }}>
              Quand des utilisateurs te suivront, ils apparaîtront ici.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {followers.map((follower: any) => (
              <div
                key={follower.follower_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  backgroundColor: colors.card,
                  borderRadius: "16px",
                  border: `1px solid ${colors.border}`,
                  transition: "transform 0.2s, background-color 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.backgroundColor = "#222222";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.backgroundColor = colors.card;
                }}
                onClick={() => handleViewProfile(follower.follower_id)}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: colors.border,
                    backgroundImage: follower.profile?.avatar_url ? `url(${follower.profile.avatar_url})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    flexShrink: 0,
                  }}
                >
                  {!follower.profile?.avatar_url && "👤"}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "16px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {follower.profile?.full_name || follower.profile?.username}
                    </span>
                    {follower.profile?.is_verified && (
                      <span style={{ color: colors.green, fontSize: "16px" }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.textMuted }}>
                    @{follower.profile?.username}
                  </div>
                </div>

                {/* Bouton Voir le profil */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Empêche le clic sur la carte de se déclencher
                    handleViewProfile(follower.follower_id);
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: `1px solid ${colors.primary}`,
                    color: colors.primary,
                    borderRadius: "20px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.primary;
                  }}
                >
                  Voir le profil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}