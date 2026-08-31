"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TrendingPostsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const colors = {
    bg: "#000000",
    card: "#1A1A1A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
  };

  // ✅ Équivalent de initState + AutomaticKeepAliveClientMixin
  useEffect(() => {
    if (!hasLoadedOnce) {
      loadData();
    }
  }, []);

  const loadData = async (forceRefresh = false) => {
    if (hasLoadedOnce && !forceRefresh) {
      console.log("⏭️ TrendingPosts déjà en mémoire, pas de rechargement");
      return;
    }

    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      setUser(session?.user || null);

      // 1. Récupérer les abonnements actifs de l'utilisateur
      let newSubscribedIds = new Set<string>();
      if (currentUserId) {
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('creator_id')
          .eq('fan_id', currentUserId)
          .eq('status', 'active');
        
        if (subs) {
          newSubscribedIds = new Set(subs.map((s: any) => s.creator_id));
        }
      }
      setSubscribedCreatorIds(newSubscribedIds);

      // 2. Récupérer les posts les plus populaires
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, user_id, media_url, media_type, caption, title, likes_count, comments_count, created_at')
        .order('likes_count', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setHasLoadedOnce(true);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // 3. Récupérer les profils des créateurs de ces posts
      const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap: Record<string, any> = {};
      profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });

      // 4. Fusionner les posts avec les profils
      const mergedPosts = postsData.map((post: any) => ({
        ...post,
        profile: profilesMap[post.user_id] || { username: 'Créateur', full_name: 'Créateur' },
      }));

      setPosts(mergedPosts);
      setHasLoadedOnce(true);

    } catch (error) {
      console.error("❌ Erreur chargement TrendingPosts:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handlePostClick = (post: any) => {
    const creatorId = post.user_id;
    const isMyOwnPost = user?.id === creatorId;
    const isLocked = !isMyOwnPost && !subscribedCreatorIds.has(creatorId);
    const creatorName = post.profile?.full_name || post.profile?.username || 'Créateur';

    if (isLocked) {
      // Si verrouillé, on ouvre l'écran de paiement
      router.push(`/subscribe/${creatorId}?tier=premium&price=2000&name=${encodeURIComponent(creatorName)}`);
    } else {
      // Si déverrouillé, on ouvre le détail du post
      router.push(`/post/${post.id}?creatorId=${creatorId}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.card}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: `1px solid ${colors.card}`, padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px" }}>←</button>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Contenu Populaire</h1>
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

      {/* Grille de posts */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "12px" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📷</div>
            <p>Aucun contenu populaire pour le moment.</p>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "12px" 
          }}>
            {posts.map((post) => {
              const creatorId = post.user_id;
              const mediaUrl = post.media_url;
              const likesCount = post.likes_count || 0;
              const creatorName = post.profile?.username || 'Créateur';
              
              const isMyOwnPost = user?.id === creatorId;
              const isLocked = !isMyOwnPost && !subscribedCreatorIds.has(creatorId);

              return (
                <div 
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  style={{
                    position: "relative",
                    aspectRatio: "0.75",
                    borderRadius: "16px",
                    overflow: "hidden",
                    backgroundColor: colors.card,
                    cursor: "pointer",
                    transition: "transform 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  {/* 1. IMAGE / VIDÉO DE FOND */}
                  {mediaUrl ? (
                    <img 
                      src={mediaUrl} 
                      alt="Post" 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover", 
                        filter: isLocked ? "blur(12px)" : "none",
                        transition: "filter 0.3s"
                      }} 
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: "#374151" }} />
                  )}

                  {/* 2. OVERLAY SOMBRE SI VERROUILLÉ */}
                  {isLocked && (
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />
                  )}

                  {/* 3. ICÔNE CADENAS + TEXTE (SI VERROUILLÉ) */}
                  {isLocked && (
                    <div style={{ 
                      position: "absolute", inset: 0, 
                      display: "flex", flexDirection: "column", 
                      alignItems: "center", justifyContent: "center",
                      zIndex: 10
                    }}>
                      <div style={{ 
                        padding: "12px", 
                        backgroundColor: `${colors.primary}E6`, 
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <span style={{ fontSize: "24px", color: "white" }}>🔒</span>
                      </div>
                      <span style={{ 
                        color: "white", fontSize: "12px", fontWeight: "bold", 
                        marginTop: "8px", textShadow: "0 1px 2px rgba(0,0,0,0.8)"
                      }}>
                        Contenu Exclusif
                      </span>
                    </div>
                  )}

                  {/* 4. ICÔNE PLAY SI C'EST UNE VIDÉO ET DÉVERROUILLÉ */}
                  {post.media_type === 'video' && !isLocked && (
                    <div style={{ 
                      position: "absolute", inset: 0, 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: 5
                    }}>
                      <span style={{ fontSize: "40px", color: "rgba(255,255,255,0.8)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>▶️</span>
                    </div>
                  )}

                  {/* 5. INFOS EN BAS (NOM + LIKES) */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "8px",
                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    zIndex: 20
                  }}>
                    <span style={{ 
                      color: "white", fontSize: "11px", fontWeight: "bold",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      maxWidth: "60%"
                    }}>
                      @{creatorName}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12px" }}>❤️</span>
                      <span style={{ color: "white", fontSize: "11px" }}>
                        {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
                      </span>
                    </div>
                  </div>
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
        @media (min-width: 768px) {
          /* Sur PC, on peut afficher 3 ou 4 colonnes pour mieux utiliser l'espace */
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}