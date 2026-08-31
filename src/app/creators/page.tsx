"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TrendingCreatorsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<any[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const colors = {
    bg: "#000000",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    textSecondary: "#D1D5DB",
  };

  // ✅ Équivalent de initState : se lance une seule fois au montage du composant
  useEffect(() => {
    if (!hasLoadedOnce) {
      loadData();
    }
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      setUser(session?.user || null);

      // 1. Récupérer les IDs des créateurs déjà suivis
      let newFollowedIds = new Set<string>();
      if (currentUserId) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId);
        
        if (follows) {
          newFollowedIds = new Set(follows.map((f: any) => f.following_id));
        }
      }
      setFollowedIds(newFollowedIds);

      // 2. Récupérer les profils (en excluant l'utilisateur actuel)
      let query = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .limit(50);
      
      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }

      const { data: profiles, error } = await query;
      
      if (error) throw error;
      setCreators(profiles || []);
      setHasLoadedOnce(true);

    } catch (error) {
      console.error("❌ Erreur chargement créateurs:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ✅ Mise à jour optimiste (Optimistic UI) exactement comme dans Flutter
  const toggleFollow = async (creatorId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const isFollowing = followedIds.has(creatorId);

    // 1. Mise à jour immédiate de l'interface
    const newFollowedIds = new Set(followedIds);
    if (isFollowing) {
      newFollowedIds.delete(creatorId);
    } else {
      newFollowedIds.add(creatorId);
    }
    setFollowedIds(newFollowedIds);

    try {
      // 2. Requête Supabase
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: user.id, following_id: creatorId });
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: creatorId });
      }
    } catch (error) {
      console.error("❌ Erreur toggle follow:", error);
      // 3. Rollback en cas d'erreur
      const rollbackIds = new Set(followedIds);
      if (isFollowing) {
        rollbackIds.add(creatorId);
      } else {
        rollbackIds.delete(creatorId);
      }
      setFollowedIds(rollbackIds);
    }
  };

  const handleCreatorClick = (creatorId: string) => {
    router.push(`/createur?id=${creatorId}`);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: `1px solid ${colors.border}`, padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px" }}>←</button>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Créateurs Populaires</h1>
        </div>
        <button 
          onClick={() => loadData(true)} 
          disabled={isRefreshing}
          style={{ 
            background: "none", border: "none", color: colors.textMuted, 
            fontSize: "20px", cursor: isRefreshing ? "wait" : "pointer",
            animation: isRefreshing ? "spin 1s linear infinite" : "none"
          }}
        >
          🔄
        </button>
      </div>

      {/* Liste des créateurs */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "12px 16px" }}>
        {creators.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <p>Aucun créateur trouvé.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {creators.map((creator) => {
              const creatorId = creator.id;
              const username = creator.username || 'Anonyme';
              const fullName = creator.full_name || '';
              const avatarUrl = creator.avatar_url;
              const isFollowing = followedIds.has(creatorId);
              const isVerified = creator.is_verified;

              return (
                <div 
                  key={creatorId}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#252525"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.card}
                >
                  {/* Avatar cliquable */}
                  <div 
                    onClick={() => handleCreatorClick(creatorId)}
                    style={{ 
                      width: "52px", height: "52px", borderRadius: "50%", 
                      backgroundColor: "#374151", flexShrink: 0, cursor: "pointer",
                      backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    {!avatarUrl && <span style={{ fontSize: "24px", color: colors.textMuted }}>👤</span>}
                  </div>

                  {/* Nom et Username (avec troncature) */}
                  <div 
                    onClick={() => handleCreatorClick(creatorId)}
                    style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  >
                    <div style={{ 
                      display: "flex", alignItems: "center", gap: "6px",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
                    }}>
                      <span style={{ fontWeight: "bold", fontSize: "15px", color: colors.text }}>
                        {fullName || username}
                      </span>
                      {isVerified && <span style={{ color: colors.primary, fontSize: "16px" }}>✓</span>}
                   0</div>
                    <div style={{ 
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      color: colors.textMuted, fontSize: "13px", marginTop: "4px"
                    }}>
                      @{username}
                    </div>
                  </div>

                  {/* Bouton Suivre / Suivi */}
                  <button
                    onClick={() => toggleFollow(creatorId)}
                    style={{
                      width: "85px",
                      height: "34px",
                      borderRadius: "20px",
                      border: isFollowing ? `1px solid ${colors.border}` : "none",
                      backgroundColor: isFollowing ? colors.card : colors.primary,
                      color: colors.text,
                      fontSize: "13px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s"
                    }}
                  >
                    {isFollowing ? "Suivi" : "Suivre"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}