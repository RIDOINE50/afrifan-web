"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState("foryou");
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string>("");
  
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [followedCreatorIds, setFollowedCreatorIds] = useState<Set<string>>(new Set());
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());
  
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const lastTapRef = useRef<number>(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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
  }, [router]);

  const fetchData = async (userId: string) => {
    if (hasLoadedOnce) return;

    setIsLoading(true);
    try {
      const { data: followsData } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      setFollowedCreatorIds(new Set(followsData?.map((f: any) => f.following_id) || []));

      const { data: subsData } = await supabase.from('subscriptions').select('creator_id').eq('fan_id', userId).eq('status', 'active');
      setSubscribedCreatorIds(new Set(subsData?.map((s: any) => s.creator_id) || []));

      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20);

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setFilteredPosts([]);
        setIsLoading(false);
        setHasLoadedOnce(true);
        return;
      }

      const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
      const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);

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
      setFilteredPosts(mergedPosts);
      setHasLoadedOnce(true);
      
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "following") {
      const followed = posts.filter(post => followedCreatorIds.has(post.user_id));
      setFilteredPosts(followed);
    } else {
      setFilteredPosts(posts);
    }
    setCurrentVideoIndex(0);
  }, [activeTab, posts, followedCreatorIds]);

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .in('id', userIds);

      const profilesMap: Record<string, any> = {};
      profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });

      const merged = commentsData.map((comment: any) => ({
        ...comment,
        profiles: profilesMap[comment.user_id] || { username: 'Utilisateur', full_name: 'Utilisateur', avatar_url: null, is_verified: false }
      }));

      setComments(merged);
    } catch (error) {
      console.error("❌ Erreur fetch comments:", error);
      setComments([]);
    }
  };

  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;

    const isLiked = likedPostIds.has(postId);
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const newCount = isLiked 
      ? Math.max(0, (currentPost.likes_count || 0) - 1) 
      : (currentPost.likes_count || 0) + 1;

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      }

      await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);

      setLikedPostIds(prev => {
        const next = new Set(prev);
        if (isLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });

      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: newCount } : p));
      setFilteredPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: newCount } : p));

    } catch (error) {
      console.error("❌ Erreur like:", error);
    }
  };

  const handleDoubleTap = (postId: string) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!likedPostIds.has(postId)) handleLike(postId);
      setHeartAnimation(true);
      setTimeout(() => setHeartAnimation(false), 800);
    }
    lastTapRef.current = now;
  };

  const handleFollow = async (creatorId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;

    const isFollowed = followedCreatorIds.has(creatorId);

    try {
      if (isFollowed) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId);
        setFollowedCreatorIds(prev => { const next = new Set(prev); next.delete(creatorId); return next; });
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
        setFollowedCreatorIds(prev => { const next = new Set(prev); next.add(creatorId); return next; });
      }
    } catch (error) {
      console.error(" Erreur follow:", error);
    }
  };

  const openComments = async (postId: string) => {
    setCurrentPostId(postId);
    setShowComments(true);
    await fetchComments(postId);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    
    try {
      await supabase.from('comments').insert({
        post_id: currentPostId,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Utilisateur',
        content: newComment.trim(),
      });

      const currentPost = posts.find(p => p.id === currentPostId);
      if (currentPost) {
        const newCount = (currentPost.comments_count || 0) + 1;
        await supabase.from('posts').update({ comments_count: newCount }).eq('id', currentPostId);
        setPosts(prev => prev.map(p => p.id === currentPostId ? { ...p, comments_count: newCount } : p));
        setFilteredPosts(prev => prev.map(p => p.id === currentPostId ? { ...p, comments_count: newCount } : p));
      }

      setNewComment("");
      await fetchComments(currentPostId);
    } catch (error) {
      console.error("❌ Erreur commentaire:", error);
    }
  };

  const handleShare = async (post: any) => {
    const creatorName = post.profiles?.full_name || post.profiles?.username || 'Créateur';
    const caption = post.content || '';
    const url = typeof window !== 'undefined' ? window.location.href : '';

    if (navigator.share) {
      try {
        await navigator.share({ title: `Post de ${creatorName}`, text: caption, url });
      } catch (err) { console.log("Partage annulé"); }
    } else {
      try {
        await navigator.clipboard.writeText(`${url}\n\n${caption} - par ${creatorName}`);
        alert("Lien copié !");
      } catch (err) { console.error("Erreur copie:", err); }
    }
  };

  const handleReport = (postId: string) => {
    setCurrentPostId(postId);
    setShowReportModal(true);
  };

  const submitReport = async (reason: string) => {
    if (!user) return;
    try {
      await supabase.from('reports').insert({
        user_id: user.id,
        target_id: currentPostId,
        target_type: 'post',
        reason: reason,
        status: 'pending'
      });
      alert("Signalement envoyé !");
      setShowReportModal(false);
    } catch (error) {
      console.error("❌ Erreur signalement:", error);
    }
  };

  // ✅ FONCTION DE REDIRECTION INTELLIGENTE CORRIGÉE
  const handleProfileClick = (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (user?.id === targetUserId) {
      router.push("/profile"); // C'est mon propre post -> Mon profil
    } else {
      router.push(`/createur?id=${targetUserId}`); // ✅ CORRIGÉ : C'est un autre créateur -> Son profil (dossier createur)
    }
  };

  const colors = {
    bg: "#0A0A0A", card: "#1A1A1A", border: "#2A2A2A", primary: "#8B5CF6",
    text: "#FFFFFF", textMuted: "#9CA3AF", danger: "#EF4444", green: "#10B981",
  };

  if (!user || isLoading) {
    return (
      <DashboardLayout>
        <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <DashboardLayout>
        <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, flexDirection: "column" }}>
          <span style={{ fontSize: "48px" }}>🎬</span>
          <p style={{ marginTop: "16px" }}>{activeTab === "following" ? "Aucune publication de vos abonnements" : "Aucune publication"}</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentPost = filteredPosts[currentVideoIndex];
  const creator = currentPost.profiles;
  const isMyOwnPost = user?.id === currentPost.user_id;
  const isLocked = !isMyOwnPost && !subscribedCreatorIds.has(currentPost.user_id);
  const isLiked = likedPostIds.has(currentPost.id);
  const isFollowed = followedCreatorIds.has(currentPost.user_id);

  return (
    <DashboardLayout>
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#000" }}>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          
          {/* HEADER TABS */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 40, display: "flex", justifyContent: "center", gap: "32px", padding: "16px", background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
            <button onClick={() => setActiveTab("following")} style={{ background: "none", border: "none", color: activeTab === "following" ? colors.text : colors.textMuted, fontSize: "16px", fontWeight: "bold", cursor: "pointer", borderBottom: activeTab === "following" ? `2px solid ${colors.text}` : "2px solid transparent" }}>Abonnements</button>
            <button onClick={() => setActiveTab("foryou")} style={{ background: "none", border: "none", color: activeTab === "foryou" ? colors.text : colors.textMuted, fontSize: "16px", fontWeight: "bold", cursor: "pointer", borderBottom: activeTab === "foryou" ? `2px solid ${colors.text}` : "2px solid transparent" }}>Pour toi</button>
          </div>

          {/* VIDEO */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ height: "100vh", width: "100%", maxWidth: "600px", position: "relative" }}>
              {currentPost.media_type === 'video' ? (
                <video ref={el => { videoRefs.current[currentVideoIndex] = el; }} src={currentPost.media_url} loop muted={isMuted} playsInline style={{ width: "100%", height: "100%", objectFit: "cover", filter: isLocked ? "blur(15px)" : "none" }} onClick={() => setIsMuted(!isMuted)} />
              ) : (
                <img src={currentPost.media_url} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover", filter: isLocked ? "blur(15px)" : "none" }} />
              )}

              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.8) 100%)", pointerEvents: "none" }} />

              {isLocked && (
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ padding: "16px", backgroundColor: colors.primary, borderRadius: "50%", marginBottom: "12px" }}><span style={{ fontSize: "32px" }}>🔒</span></div>
                  <h3 style={{ color: "white", fontWeight: "bold", fontSize: "16px" }}>Contenu réservé aux abonnés</h3>
                </div>
              )}

              {heartAnimation && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 100, pointerEvents: "none" }}>
                  <span style={{ fontSize: "120px", animation: "heartPop 0.8s ease-out forwards" }}>❤️</span>
                </div>
              )}

              <button onClick={() => setIsMuted(!isMuted)} style={{ position: "absolute", top: "70px", left: "16px", backgroundColor: "rgba(0,0,0,0.5)", border: "none", color: "white", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>{isMuted ? "🔇" : ""}</button>

              {/* INFOS BAS GAUCHE */}
              <div style={{ position: "absolute", bottom: "20px", left: "16px", right: "100px", zIndex: 20 }} onClick={() => handleDoubleTap(currentPost.id)}>
                {/* ✅ REDIRECTION INTELLIGENTE APPLIQUÉE ICI */}
                <div onClick={(e) => handleProfileClick(e, currentPost.user_id)} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", cursor: "pointer" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundImage: `url(${creator.avatar_url || 'https://via.placeholder.com/100'})`, backgroundSize: "cover", border: "2px solid white" }} />
                  <span style={{ fontWeight: "bold", fontSize: "17px", color: "white" }}>{creator.full_name || creator.username}</span>
                  {creator.is_verified && <span style={{ color: colors.green }}>✓</span>}
                  {!isFollowed && !isMyOwnPost && <button onClick={(e) => { e.stopPropagation(); handleFollow(currentPost.user_id); }} style={{ padding: "6px 16px", backgroundColor: colors.primary, border: "none", borderRadius: "20px", color: "white", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>Suivre</button>}
                </div>
                <p style={{ fontSize: "14px", lineHeight: "1.4", color: "white", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{currentPost.content || "(Pas de légende)"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "white", fontSize: "13px" }}><span>🎵</span><span>Son original - {creator.username}</span></div>
              </div>

              {/* BOUTONS DROITE */}
              <div style={{ position: "absolute", right: "12px", bottom: "100px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", zIndex: 30 }}>
                <div style={{ position: "relative" }}>
                  {/* ✅ REDIRECTION INTELLIGENTE APPLIQUÉE ICI AUSSI */}
                  <div onClick={(e) => handleProfileClick(e, currentPost.user_id)} style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundImage: `url(${creator.avatar_url || 'https://via.placeholder.com/100'})`, backgroundSize: "cover", border: "2px solid white", cursor: "pointer" }} />
                  {!isFollowed && !isMyOwnPost && <button onClick={() => handleFollow(currentPost.user_id)} style={{ position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%)", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: colors.danger, border: "none", color: "white", fontSize: "18px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>}
                </div>

                <button onClick={(e) => handleLike(currentPost.id, e)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: isLiked ? "rgba(239, 68, 68, 0.2)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>{isLiked ? "❤️" : ""}</div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{formatCount(currentPost.likes_count)}</span>
                </button>

                <button onClick={() => openComments(currentPost.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>💬</div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{formatCount(currentPost.comments_count)}</span>
                </button>

                <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>🔖</div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{formatCount(currentPost.saves_count || 0)}</span>
                </button>

                <button onClick={() => handleShare(currentPost)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>↗️</div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{formatCount(currentPost.shares_count || 0)}</span>
                </button>

                <button onClick={() => handleReport(currentPost.id)} style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>⋯</button>
              </div>
            </div>
          </div>
        </main>

        {/* COMMENTS PANEL */}
        {showComments && (
          <div style={{ width: "400px", backgroundColor: colors.bg, borderLeft: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 1000 }}>
            <div style={{ padding: "20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>Commentaires ({formatCount(currentPost.comments_count)})</h3>
              <button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: "24px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", color: colors.textMuted, marginTop: "40px" }}><span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>💬</span><p>Aucun commentaire</p></div>
              ) : (
                comments.map((comment: any, index: number) => (
                  <div key={index} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.card, backgroundImage: comment.profiles?.avatar_url ? `url(${comment.profiles.avatar_url})` : undefined, backgroundSize: "cover", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px", color: colors.text }}>{comment.profiles?.full_name || comment.user_name || 'Utilisateur'}{comment.profiles?.is_verified && <span style={{ color: colors.green, marginLeft: "4px" }}>✓</span>}</div>
                        <p style={{ fontSize: "14px", lineHeight: "1.4", margin: 0, color: colors.text }}>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: "20px", borderTop: `1px solid ${colors.border}`, display: "flex", gap: "12px", alignItems: "center" }}>
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && submitComment()} placeholder="Ajouter un commentaire..." style={{ flex: 1, backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "24px", padding: "12px 20px", color: colors.text, fontSize: "14px", outline: "none" }} />
              <button onClick={submitComment} disabled={!newComment.trim()} style={{ backgroundColor: newComment.trim() ? colors.primary : "transparent", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: newComment.trim() ? "pointer" : "not-allowed", color: "white", fontSize: "18px" }}>↑</button>
            </div>
          </div>
        )}

        {/* REPORT MODAL */}
        {showReportModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
            <div style={{ backgroundColor: colors.card, borderRadius: "16px", padding: "24px", maxWidth: "400px", width: "90%" }}>
              <h3 style={{ margin: "0 0 16px 0", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>Signaler ce post</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["spam", "violence", "harassment", "copyright", "other"].map((reason) => (
                  <button key={reason} onClick={() => submitReport(reason)} style={{ padding: "12px 16px", backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.text, textAlign: "left", cursor: "pointer", fontSize: "14px" }}>{reason}</button>
                ))}
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ marginTop: "20px", width: "100%", padding: "12px", backgroundColor: "transparent", border: `1px solid ${colors.border}`, borderRadius: "8px", color: colors.textMuted, cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes heartPop { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
      `}</style>
    </DashboardLayout>
  );
}