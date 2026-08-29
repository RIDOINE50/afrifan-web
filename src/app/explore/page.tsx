"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function ExplorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    purple: "#A855F7",
    orange: "#F97316",
    red: "#EF4444",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadData(session.user.id);
      }
    };
    init();
  }, []);

  const loadData = async (userId: string) => {
    if (hasLoadedOnce) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFollowedIds(userId),
        fetchSubscriptions(userId),
        fetchCreators(userId),
        fetchPosts(),
      ]);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error("❌ Erreur chargement Explore:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowedIds = async (userId: string) => {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    
    setFollowedIds(new Set(data?.map((f: any) => f.following_id) || []));
  };

  const fetchSubscriptions = async (userId: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('creator_id')
      .eq('fan_id', userId)
      .eq('status', 'active');
    
    setSubscribedCreatorIds(new Set(data?.map((s: any) => s.creator_id) || []));
  };

  const fetchCreators = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .neq('id', userId)
      .limit(50);
    
    setCreators(data || []);
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, user_id, media_url, media_type, content, likes_count, comments_count, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!postsData || postsData.length === 0) return;

    const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const profilesMap: Record<string, any> = {};
    profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });

    const mergedPosts = postsData.map((post: any) => ({
      ...post,
      profiles: profilesMap[post.user_id],
      likes_count: post.likes_count ?? 0,
    }));

    setPosts(mergedPosts);
  };

  const toggleFollow = async (creatorId: string) => {
    if (!user) return;
    const isFollowing = followedIds.has(creatorId);

    // Optimistic update
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (isFollowing) next.delete(creatorId);
      else next.add(creatorId);
      return next;
    });

    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
        // Ici tu pourrais ajouter la notification
      }
    } catch (error) {
      console.error("❌ Erreur toggle follow:", error);
      // Rollback
      setFollowedIds(prev => {
        const next = new Set(prev);
        if (isFollowing) next.add(creatorId);
        else next.delete(creatorId);
        return next;
      });
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setHasLoadedOnce(false);
    await loadData(user.id);
  };

  // Filtrage des résultats
  const filteredCreators = creators.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const username = (c.username || '').toLowerCase();
    const fullName = (c.full_name || '').toLowerCase();
    return username.includes(query) || fullName.includes(query);
  });

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const caption = (p.content || '').toLowerCase();
    const username = (p.profiles?.username || '').toLowerCase();
    return caption.includes(query) || username.includes(query);
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto", 
        padding: "20px", 
        backgroundColor: colors.bg,
        minHeight: "100vh"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ color: colors.text, fontSize: "28px", fontWeight: "bold", margin: 0 }}>Découvrir</h1>
          <button 
            onClick={() => router.push("/notifications")}
            style={{ 
              background: "none", 
              border: "none", 
              color: colors.text, 
              fontSize: "24px", 
              cursor: "pointer",
              padding: "8px"
            }}
          >
            🔔
          </button>
        </div>

        {/* Barre de recherche */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          backgroundColor: colors.card, 
          borderRadius: "999px", 
          padding: "12px 20px", 
          marginBottom: "32px",
          border: `1px solid ${colors.border}`
        }}>
          <span style={{ color: colors.textMuted, marginRight: "12px", fontSize: "18px" }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des créateurs, des vidéos..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: colors.text,
              width: "100%",
              fontSize: "15px",
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              style={{ 
                background: "none", 
                border: "none", 
                color: colors.textMuted, 
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px"
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Section Créateurs tendance */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: colors.purple, fontSize: "20px" }}>⭐</span>
              <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: 0 }}>Créateurs tendance</h2>
            </div>
            <button 
              onClick={() => router.push("/explore/creators")}
              style={{ 
                background: "none", 
                border: "none", 
                color: colors.primary, 
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              Voir tout →
            </button>
          </div>

          {/* Liste horizontale des créateurs */}
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            overflowX: "auto", 
            paddingBottom: "16px",
            scrollbarWidth: "thin",
            scrollbarColor: `${colors.border} ${colors.bg}`
          }}>
            {filteredCreators.length === 0 ? (
              <div style={{ color: colors.textMuted, padding: "20px" }}>Aucun créateur trouvé</div>
            ) : (
              filteredCreators.map((creator: any) => {
                const isFollowing = followedIds.has(creator.id);
                return (
                  <div
                    key={creator.id}
                    style={{
                      minWidth: "140px",
                      maxWidth: "140px",
                      padding: "16px",
                      backgroundColor: colors.card,
                      borderRadius: "16px",
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    onClick={() => router.push(`/profile?id=${creator.id}`)}
                  >
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      backgroundColor: colors.border,
                      backgroundImage: creator.avatar_url ? `url(${creator.avatar_url})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      color: colors.textMuted,
                    }}>
                      {!creator.avatar_url && "👤"}
                    </div>
                    
                    <div style={{ 
                      color: colors.text, 
                      fontWeight: "bold", 
                      fontSize: "14px", 
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%"
                    }}>
                      {creator.full_name || creator.username}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(creator.id);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        backgroundColor: isFollowing ? colors.border : colors.primary,
                        color: colors.text,
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "background 0.2s"
                      }}
                    >
                      {isFollowing ? "Suivi" : "Suivre"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section Pour toi (Posts) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: colors.orange, fontSize: "20px" }}>🔥</span>
              <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: 0 }}>Pour toi</h2>
            </div>
            <button 
              onClick={() => router.push("/explore/posts")}
              style={{ 
                background: "none", 
                border: "none", 
                color: colors.primary, 
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px"
              }}
            >
              Voir tout →
            </button>
          </div>

          {/* Grille de posts */}
          {filteredPosts.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              color: colors.textMuted, 
              padding: "60px 20px",
              backgroundColor: colors.card,
              borderRadius: "16px"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
              <p style={{ fontSize: "16px" }}>Aucun résultat trouvé</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}>
              {filteredPosts.map((post: any) => {
                const creatorId = post.user_id;
                const isMyOwnPost = user?.id === creatorId;
                const isLocked = !isMyOwnPost && !subscribedCreatorIds.has(creatorId);
                const username = post.profiles?.username || 'inconnu';
                const likesCount = post.likes_count || 0;

                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      if (isLocked) {
                        router.push(`/subscribe/${creatorId}?tier=premium&price=2000`);
                      } else {
                        router.push(`/post/${post.id}`);
                      }
                    }}
                    style={{
                      position: "relative",
                      aspectRatio: "3/4",
                      borderRadius: "16px",
                      overflow: "hidden",
                      backgroundColor: colors.card,
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Media */}
                    {post.media_url ? (
                      <>
                        {isLocked ? (
                          <>
                            <div style={{ 
                              filter: "blur(12px)",
                              width: "100%",
                              height: "100%",
                              backgroundImage: `url(${post.media_url})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }} />
                            <div style={{
                              position: "absolute",
                              inset: 0,
                              backgroundColor: "rgba(0,0,0,0.5)",
                            }} />
                          </>
                        ) : (
                          <div style={{
                            width: "100%",
                            height: "100%",
                            backgroundImage: `url(${post.media_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }} />
                        )}
                      </>
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: `linear-gradient(135deg, ${colors.purple}33, ${colors.bg})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "48px",
                        color: colors.textMuted,
                      }}>
                        📷
                      </div>
                    )}

                    {/* Overlay verrouillé */}
                    {isLocked && (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        zIndex: 10,
                      }}>
                        <div style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: colors.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                        }}>
                          🔒
                        </div>
                        <span style={{
                          color: colors.text,
                          fontWeight: "bold",
                          fontSize: "13px",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          padding: "6px 12px",
                          borderRadius: "20px",
                        }}>
                          Contenu Exclusif
                        </span>
                      </div>
                    )}

                    {/* Icône Play si vidéo */}
                    {post.media_type === 'video' && !isLocked && (
                      <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: "white",
                      }}>
                        ▶️
                      </div>
                    )}

                    {/* Infos en bas */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "16px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "13px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "60%",
                      }}>
                        @{username}
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "white",
                        fontSize: "13px",
                      }}>
                        <span style={{ color: colors.red }}>❤️</span>
                        <span>{formatCount(likesCount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton Refresh */}
        <div style={{ 
          marginTop: "40px", 
          textAlign: "center",
          paddingBottom: "40px"
        }}>
          <button
            onClick={handleRefresh}
            style={{
              padding: "12px 32px",
              backgroundColor: colors.primary,
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
             Actualiser
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}