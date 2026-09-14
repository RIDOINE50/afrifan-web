"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppTheme } from "@/contexts/ThemeContext";

// ✅ VRAIES ICÔNES SVG (Aucun émoji/sticker)
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const StarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const FireIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const LockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const PlayIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const HeartIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
const RefreshIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const BellIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function ExplorePage() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
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
      } else {
        setIsLoading(false);
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
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
    setFollowedIds(new Set(data?.map((f: any) => f.following_id) || []));
  };

  const fetchSubscriptions = async (userId: string) => {
    const { data } = await supabase.from('subscriptions').select('creator_id').eq('fan_id', userId).eq('status', 'active');
    setSubscribedCreatorIds(new Set(data?.map((s: any) => s.creator_id) || []));
  };

  const fetchCreators = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_verified, role') // ✅ Ajout de 'role'
      .neq('id', userId)
      .limit(50);
    
    setCreators(data || []);
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, user_id, media_url, media_type, caption, title, likes_count, comments_count, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!postsData || postsData.length === 0) return;

    const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, role, premium_price, pro_price') // ✅ Ajout de 'role'
      .in('id', userIds);

    const profilesMap: Record<string, any> = {};
    profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });

    const mergedPosts = postsData.map((post: any) => ({
      ...post,
      // ✅ Valeur par défaut avec role: 'user' pour éviter les erreurs
      profile: profilesMap[post.user_id] || { username: 'inconnu', full_name: null, avatar_url: null, role: 'user', premium_price: 0, pro_price: 0 },
      likes_count: post.likes_count ?? 0,
    }));

    setPosts(mergedPosts);
  };

  const toggleFollow = async (creatorId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    const isFollowing = followedIds.has(creatorId);

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
      }
    } catch (error) {
      console.error("❌ Erreur toggle follow:", error);
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
    const caption = (p.caption || p.title || '').toLowerCase();
    const username = (p.profile?.username || '').toLowerCase();
    return caption.includes(query) || username.includes(query);
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: colors.bg }}>
          <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ 
        maxWidth: "1400px", 
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
            style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: "8px", display: "flex" }}
          >
            <BellIcon />
          </button>
        </div>

        {/* Barre de recherche */}
        <div style={{ 
          display: "flex", alignItems: "center", backgroundColor: colors.card, borderRadius: "999px", 
          padding: "12px 20px", marginBottom: "32px", border: `1px solid ${colors.border}`
        }}>
          <span style={{ color: colors.textMuted, marginRight: "12px", display: "flex" }}><SearchIcon /></span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des créateurs, des vidéos..."
            style={{ background: "transparent", border: "none", outline: "none", color: colors.text, width: "100%", fontSize: "15px" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", display: "flex", padding: "4px" }}>
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Section Créateurs tendance */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: colors.orange, display: "flex" }}><StarIcon /></span>
              <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: 0 }}>Créateurs tendance</h2>
            </div>
            <button 
              onClick={() => router.push("/creators")}
              style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
            >
              Voir tout →
            </button>
          </div>

          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px", scrollbarWidth: "thin", scrollbarColor: `${colors.border} ${colors.bg}` }}>
            {filteredCreators.length === 0 ? (
              <div style={{ color: colors.textMuted, padding: "20px" }}>Aucun créateur trouvé</div>
            ) : (
              filteredCreators.map((creator: any) => {
                const isFollowing = followedIds.has(creator.id);
                const displayName = creator.full_name || creator.username;

                return (
                  <div
                    key={creator.id}
                    style={{
                      minWidth: "140px", maxWidth: "140px", padding: "16px", backgroundColor: colors.card,
                      borderRadius: "16px", border: `1px solid ${colors.border}`, display: "flex",
                      flexDirection: "column", alignItems: "center", gap: "12px", cursor: "pointer", transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                    onClick={() => router.push(`/createur?id=${creator.id}`)}
                  >
                    {/* ✅ PHOTO RÉELLE OU INITIALE (Plus de sticker "bonhomme") */}
                    {creator.avatar_url ? (
                      <img 
                        src={creator.avatar_url} 
                        alt={displayName} 
                        style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: "64px", height: "64px", borderRadius: "50%", 
                        backgroundColor: colors.primary, 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        fontSize: "28px", fontWeight: "bold", color: "white"
                      }}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div style={{ color: colors.text, fontWeight: "bold", fontSize: "14px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                      {displayName}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFollow(creator.id); }}
                      style={{
                        width: "100%", padding: "8px", 
                        backgroundColor: isFollowing ? colors.border : colors.primary,
                        color: isFollowing ? colors.textMuted : colors.primaryText, 
                        border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "12px", cursor: "pointer", transition: "background 0.2s"
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
              <span style={{ color: colors.red, display: "flex" }}><FireIcon /></span>
              <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: 0 }}>Pour toi</h2>
            </div>
            <button 
              onClick={() => router.push("/posts")}
              style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
            >
              Voir tout →
            </button>
          </div>

          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: "center", color: colors.textMuted, padding: "60px 20px", backgroundColor: colors.card, borderRadius: "16px" }}>
              <p style={{ fontSize: "16px" }}>Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="responsive-posts-grid">
              {filteredPosts.map((post: any) => {
                const creatorId = post.user_id;
                const isMyOwnPost = user?.id === creatorId;
                
                // ✅ LOGIQUE EXACTE DU FLUTTER :
                const creatorRole = post.profile?.role || 'user';
                const isCreator = creatorRole === 'creator';
                const isLocked = isCreator && !isMyOwnPost && !subscribedCreatorIds.has(creatorId);
                
                const username = post.profile?.username || 'inconnu';
                const displayName = post.profile?.full_name || username;
                const likesCount = post.likes_count || 0;
                const premiumPrice = post.profile?.premium_price || 0;

                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      if (isLocked) {
                        router.push(`/subscribe/${creatorId}?tier=premium&price=${premiumPrice}&name=${encodeURIComponent(displayName)}`);
                      } else {
                        router.push(`/post/${post.id}?creatorId=${creatorId}`);
                      }
                    }}
                    className="post-card"
                  >
                    {post.media_url ? (
                      <>
                        {isLocked ? (
                          <>
                            <div style={{ filter: "blur(25px) brightness(0.6)", width: "100%", height: "100%", backgroundImage: `url(${post.media_url})`, backgroundSize: "cover", backgroundPosition: "center", transform: "scale(1.1)" }} />
                            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} />
                          </>
                        ) : (
                          <div style={{ width: "100%", height: "100%", backgroundImage: `url(${post.media_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        )}
                      </>
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${colors.purple}33, ${colors.bg})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", color: colors.textMuted }}>📷</div>
                    )}

                    {isLocked && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", zIndex: 10 }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <LockIcon />
                        </div>
                        <span style={{ color: "white", fontWeight: "bold", fontSize: "13px", backgroundColor: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "20px" }}>Contenu Exclusif</span>
                        {premiumPrice > 0 && (
                          <span style={{ color: "white", fontSize: "11px", backgroundColor: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "12px" }}>
                            {premiumPrice.toFixed(0)} FCFA / mois
                          </span>
                        )}
                      </div>
                    )}

                    {post.media_type === 'video' && !isLocked && (
                      <div style={{ position: "absolute", top: "12px", right: "12px", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PlayIcon />
                      </div>
                    )}

                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px", background: "linear-gradient(transparent, rgba(0,0,0,0.9))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "white", fontWeight: "bold", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                        @{username}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "white", fontSize: "13px" }}>
                        <span style={{ display: "flex" }}><HeartIcon /></span>
                        <span>{formatCount(likesCount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: "40px", textAlign: "center", paddingBottom: "40px" }}>
          <button
            onClick={handleRefresh}
            style={{
              padding: "12px 32px", 
              backgroundColor: colors.primary, 
              color: colors.primaryText, 
              border: "none",
              borderRadius: "12px", fontWeight: "bold", fontSize: "14px", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "8px",
            }}
          >
            <span style={{ display: "flex" }}><RefreshIcon /></span> Actualiser
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .responsive-posts-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .post-card {
          position: relative;
          aspect-ratio: 9 / 16; 
          border-radius: 16px;
          overflow: hidden;
          background-color: ${colors.card};
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .post-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }

        @media (min-width: 1200px) {
          .responsive-posts-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        @media (max-width: 1199px) and (min-width: 768px) {
          .responsive-posts-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 767px) {
          .responsive-posts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}