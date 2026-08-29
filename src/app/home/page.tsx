"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

function formatCount(num: number | null | undefined): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [heartAnimation, setHeartAnimation] = useState(false);
  
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [followedCreatorIds, setFollowedCreatorIds] = useState<Set<string>>(new Set());
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());
  
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await fetchData(session.user.id);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.push("/login");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: followsData } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      setFollowedCreatorIds(new Set(followsData?.map((f: any) => f.following_id) || []));

      const { data: subsData } = await supabase.from('subscriptions').select('creator_id').eq('fan_id', userId).eq('status', 'active');
      setSubscribedCreatorIds(new Set(subsData?.map((s: any) => s.creator_id) || []));

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, user_id, content, media_url, media_type, likes_count, comments_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
        
        const { data: profilesData } = await supabase.from('profiles').select('id, username, full_name, avatar_url, is_verified').in('id', userIds);
        
        const profilesMap: Record<string, any> = {};
        profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });

        const postIds = postsData.map((p: any) => p.id);
        const { data: likesData } = await supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', userId);
        
        setLikedPostIds(new Set(likesData?.map((l: any) => l.post_id) || []));

        const mergedPosts = postsData.map((post: any) => ({
          ...post,
          profiles: profilesMap[post.user_id] || { username: 'Utilisateur', full_name: 'Utilisateur', avatar_url: null, is_verified: false },
        }));

        setPosts(mergedPosts);
      }
    } catch (error) {
      console.error(" Erreur chargement feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:profiles(username, full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    
    setComments(data || []);
  };

  useEffect(() => {
    if (posts.length === 0) return;
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideoIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentVideoIndex, posts]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPostIds.has(postId);
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        setLikedPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        setLikedPostIds(prev => { const next = new Set(prev); next.add(postId); return next; });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      }
    } catch (error) {
      console.error(" Erreur like:", error);
    }
  };

  const handleDoubleTap = (postId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!likedPostIds.has(postId)) {
        handleLike(postId);
      }
      setHeartAnimation(true);
      setTimeout(() => setHeartAnimation(false), 800);
    }
    lastTapRef.current = now;
  };

  const openComments = async () => {
    setShowComments(true);
    await fetchComments(posts[currentVideoIndex].id);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    
    const currentPost = posts[currentVideoIndex];
    
    try {
      await supabase.from('comments').insert({
        post_id: currentPost.id,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Utilisateur',
        content: newComment.trim(),
      });

      await supabase.from('posts').update({ 
        comments_count: (currentPost.comments_count || 0) + 1 
      }).eq('id', currentPost.id);

      setNewComment("");
      await fetchComments(currentPost.id);
      
      setPosts(prev => prev.map(p => 
        p.id === currentPost.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
      ));
    } catch (error) {
      console.error("❌ Erreur commentaire:", error);
    }
  };

  const goToNext = () => {
    if (currentVideoIndex < posts.length - 1) setCurrentVideoIndex(currentVideoIndex + 1);
  };

  const goToPrev = () => {
    if (currentVideoIndex > 0) setCurrentVideoIndex(currentVideoIndex - 1);
  };

  const colors = {
    bg: "#0A0A0A", sidebar: "#0A0A0A", card: "#1A1A1A", border: "#2A2A2A",
    primary: "#8B5CF6", primaryHover: "#7C3AED", text: "#FFFFFF",
    textMuted: "#9CA3AF", danger: "#EF4444", pink: "#EC4899",
  };

  if (!user || isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.text }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p>Chargement du feed...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, flexDirection: "column", gap: "16px" }}>
        <span style={{ fontSize: "48px" }}>🎬</span>
        <p>Aucune publication pour le moment.</p>
      </div>
    );
  }

  const currentPost = posts[currentVideoIndex];
  const creator = currentPost.profiles;
  const isMyOwnPost = user?.id === currentPost.user_id;
  const isLocked = !isMyOwnPost && !subscribedCreatorIds.has(currentPost.user_id);
  const isLiked = likedPostIds.has(currentPost.id);

  return (
    <DashboardLayout>
      {/* ZONE VIDÉO CENTRALE - STYLE TIKTOK */}
      <main style={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        position: "relative", 
        backgroundColor: "#000",
        overflow: "hidden"
      }}>
        {/* Conteneur vidéo plus grand */}
        <div style={{ 
          height: "95vh", 
          maxHeight: "850px", 
          aspectRatio: "9/16", 
          position: "relative", 
          borderRadius: "0px",
          overflow: "hidden", 
          backgroundColor: "#000"
        }}>
          
          {currentPost.media_type === 'video' ? (
            <video
              ref={el => { videoRefs.current[currentVideoIndex] = el; }}
              src={currentPost.media_url}
              loop
              muted={isMuted}
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: isLocked ? "blur(15px)" : "none" }}
              onClick={() => setIsMuted(!isMuted)}
            />
          ) : (
            <img
              src={currentPost.media_url}
              alt="Contenu"
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: isLocked ? "blur(15px)" : "none" }}
            />
          )}

          {isLocked && (
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <div style={{ padding: "16px", backgroundColor: colors.primary, borderRadius: "50%", marginBottom: "12px" }}>
                <span style={{ fontSize: "32px" }}>🔒</span>
              </div>
              <h3 style={{ color: "white", fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>Contenu réservé aux abonnés</h3>
              <p style={{ color: colors.textMuted, fontSize: "14px" }}>Abonne-toi pour débloquer</p>
            </div>
          )}

          {heartAnimation && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 100, pointerEvents: "none" }}>
              <span style={{ fontSize: "120px", animation: "heartPop 0.8s ease-out forwards" }}>❤️</span>
            </div>
          )}

          {/* Bouton Mute en haut à gauche */}
          <button onClick={() => setIsMuted(!isMuted)} style={{ position: "absolute", top: "16px", left: "16px", backgroundColor: "rgba(0,0,0,0.3)", border: "none", color: "white", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
            {isMuted ? "🔇" : "🔊"}
          </button>

          {/* BOUTONS D'INTERACTION - STYLE TIKTOK (Collés à droite de la vidéo) */}
          <div style={{ 
            position: "absolute", 
            right: "12px", 
            bottom: "100px", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: "16px", 
            zIndex: 30 
          }}>
            {/* Avatar créateur */}
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <div 
                onClick={() => router.push(`/profile?id=${currentPost.user_id}`)}
                style={{ 
                  width: "52px", height: "52px", borderRadius: "50%", 
                  backgroundImage: `url(${creator.avatar_url || 'https://via.placeholder.com/100'})`, 
                  backgroundSize: "cover", backgroundPosition: "center", 
                  border: `2px solid white`, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                }} 
              />
              {!followedCreatorIds.has(currentPost.user_id) && !isMyOwnPost && (
                <button 
                  onClick={() => router.push(`/profile?id=${currentPost.user_id}`)}
                  style={{ 
                    position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%)", 
                    width: "20px", height: "20px", borderRadius: "50%", 
                    backgroundColor: colors.danger, border: "none", color: "white", 
                    fontSize: "14px", fontWeight: "bold", cursor: "pointer", 
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >+</button>
              )}
            </div>

            {/* Like avec compteur */}
            <button onClick={() => handleLike(currentPost.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}>
              <div style={{ 
                width: "52px", height: "52px", borderRadius: "50%", 
                backgroundColor: isLiked ? "rgba(239, 68, 68, 0.2)" : "rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
                border: "none", color: isLiked ? "#EF4444" : "white", 
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "28px",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}>
                {isLiked ? "❤️" : ""}
              </div>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                {formatCount(currentPost.likes_count)}
              </span>
            </button>

            {/* Commentaires avec compteur */}
            <button onClick={openComments} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}>
              <div style={{ 
                width: "52px", height: "52px", borderRadius: "50%", 
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
                border: "none", color: "white", 
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "26px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}>
                💬
              </div>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                {formatCount(currentPost.comments_count)}
              </span>
            </button>

            {/* Partager avec compteur */}
            <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}>
              <div style={{ 
                width: "52px", height: "52px", borderRadius: "50%", 
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
                border: "none", color: "white", 
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "26px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}>
                ️
              </div>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                Partager
              </span>
            </button>
          </div>

          {/* Flèches navigation (haut/bas) */}
          <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "8px", zIndex: 30 }}>
            <button onClick={goToPrev} disabled={currentVideoIndex === 0} style={{ 
              width: "40px", height: "40px", borderRadius: "50%", 
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(10px)",
              border: "none", color: "white", cursor: currentVideoIndex === 0 ? "not-allowed" : "pointer", 
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
              opacity: currentVideoIndex === 0 ? 0.3 : 1
            }}>↑</button>
            <button onClick={goToNext} disabled={currentVideoIndex === posts.length - 1} style={{ 
              width: "40px", height: "40px", borderRadius: "50%", 
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(10px)",
              border: "none", color: "white", cursor: currentVideoIndex === posts.length - 1 ? "not-allowed" : "pointer", 
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
              opacity: currentVideoIndex === posts.length - 1 ? 0.3 : 1
            }}>↓</button>
          </div>

          {/* Infos en bas (créateur, description) */}
          <div 
            style={{ position: "absolute", bottom: 0, left: 0, right: "100px", padding: "80px 16px 20px", background: "linear-gradient(transparent, rgba(0,0,0,0.9))", zIndex: 20 }}
            onClick={() => handleDoubleTap(currentPost.id)}
          >
            <div 
              onClick={() => router.push(`/profile?id=${currentPost.user_id}`)}
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", cursor: "pointer" }}
            >
              <span style={{ fontWeight: "bold", fontSize: "17px", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{creator.full_name || creator.username}</span>
              {creator.is_verified && <span style={{ color: colors.primary, fontSize: "16px" }}>✔️</span>}
            </div>
            <p style={{ fontSize: "15px", lineHeight: "1.4", marginBottom: "8px", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
              {currentPost.content || " (Pas de légende)"}
            </p>
            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
              plus
            </button>
          </div>
        </div>
      </main>

      {/* PANNEAU DE COMMENTAIRES */}
      {showComments && (
        <div style={{ 
          position: "fixed", top: 0, right: 0, width: "400px", height: "100vh", 
          backgroundColor: colors.bg, borderLeft: `1px solid ${colors.border}`,
          zIndex: 1000, display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>Commentaires {formatCount(currentPost.comments_count)}</h3>
            <button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "24px", cursor: "pointer", padding: "4px 8px" }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: "center", color: colors.textMuted, marginTop: "40px" }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>💬</span>
                <p>Entame la conversation</p>
              </div>
            ) : (
              comments.map((comment: any, index: number) => (
                <div key={index} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ 
                      width: "32px", height: "32px", borderRadius: "50%", backgroundColor: colors.card,
                      backgroundImage: comment.profiles?.avatar_url ? `url(${comment.profiles.avatar_url})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
                        {comment.profiles?.full_name || comment.user_name || 'Utilisateur'}
                      </div>
                      <p style={{ fontSize: "14px", lineHeight: "1.4", margin: 0, color: colors.text }}>{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}`, display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitComment()}
              placeholder="Ajouter un commentaire..."
              style={{
                flex: 1, backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                borderRadius: "20px", padding: "10px 16px", color: colors.text, fontSize: "14px", outline: "none"
              }}
            />
            <button 
              onClick={submitComment}
              disabled={!newComment.trim()}
              style={{
                backgroundColor: newComment.trim() ? colors.primary : colors.border,
                border: "none", borderRadius: "50%", width: "36px", height: "36px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: newComment.trim() ? "pointer" : "not-allowed", color: "white", fontSize: "18px"
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {showComments && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 999 }} onClick={() => setShowComments(false)} />
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes heartPop { 
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </DashboardLayout>
  );
}