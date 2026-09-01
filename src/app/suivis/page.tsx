"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

export default function SuivisPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [followings, setFollowings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set());

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    green: "#10B981",
    danger: "#EF4444",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await fetchFollowings(session.user.id);
    };
    init();
  }, [router]);

  const fetchFollowings = async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Récupérer tous les following_id que cet utilisateur suit
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following_id, created_at")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false });

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowings([]);
        setIsLoading(false);
        return;
      }

      // 2. Récupérer les profils de ces personnes suivies
      const followingIds = followsData.map((f: any) => f.following_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, is_verified")
        .in("id", followingIds);

      if (profilesError) throw profilesError;

      // 3. Fusionner les données pour l'affichage
      const mergedFollowings = followsData.map((follow: any) => {
        const profile = profilesData?.find((p: any) => p.id === follow.following_id);
        return {
          following_id: follow.following_id,
          followed_at: follow.created_at,
          profile: profile || { username: "Utilisateur", full_name: "Utilisateur", avatar_url: null, is_verified: false },
        };
      });

      setFollowings(mergedFollowings);
    } catch (error) {
      console.error("❌ Erreur chargement des suivis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fonction pour se désabonner d'un utilisateur
  const handleUnfollow = async (targetUserId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    // État de chargement pour le bouton
    setUnfollowingIds(prev => new Set(prev).add(targetUserId));

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;

      // Retirer de la liste immédiatement
      setFollowings(prev => prev.filter(f => f.following_id !== targetUserId));
    } catch (error) {
      console.error("❌ Erreur unfollow:", error);
      alert("Impossible de se désabonner pour le moment.");
    } finally {
      setUnfollowingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
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
            Mes Suivis
          </h1>
          <p style={{ fontSize: "14px", color: colors.textMuted, margin: 0 }}>
            {followings.length} {followings.length > 1 ? "personnes suivies" : "personne suivie"}
          </p>
        </div>

        {/* Liste des suivis */}
        {followings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
            <h3 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Tu ne suis personne pour le moment</h3>
            <p style={{ color: colors.textMuted, fontSize: "14px" }}>
              Explore la page Découvrir pour trouver des créateurs à suivre.
            </p>
            <button
              onClick={() => router.push("/explore")}
              style={{
                marginTop: "20px",
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
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {followings.map((following: any) => (
              <div
                key={following.following_id}
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
                onClick={() => handleViewProfile(following.following_id)}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: colors.border,
                    backgroundImage: following.profile?.avatar_url ? `url(${following.profile.avatar_url})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    flexShrink: 0,
                  }}
                >
                  {!following.profile?.avatar_url && "👤"}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "16px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {following.profile?.full_name || following.profile?.username}
                    </span>
                    {following.profile?.is_verified && (
                      <span style={{ color: colors.green, fontSize: "16px" }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.textMuted }}>
                    @{following.profile?.username}
                  </div>
                </div>

                {/* Bouton Se désabonner */}
                <button
                  onClick={(e) => handleUnfollow(following.following_id, e)}
                  disabled={unfollowingIds.has(following.following_id)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: `1px solid ${colors.danger}`,
                    color: colors.danger,
                    borderRadius: "20px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: unfollowingIds.has(following.following_id) ? "wait" : "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                    opacity: unfollowingIds.has(following.following_id) ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!unfollowingIds.has(following.following_id)) {
                      e.currentTarget.style.backgroundColor = colors.danger;
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.danger;
                  }}
                >
                  {unfollowingIds.has(following.following_id) ? "..." : "Se désabonner"}
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