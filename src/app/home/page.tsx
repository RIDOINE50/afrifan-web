"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

// ✅ CORRECTION : Formatage des nombres avec virgule (style français)
function formatCount(num: number | null | undefined): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.', ',') + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.', ',') + "K";
  return num.toString();
}

export default function HomePage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [currentPostId, setCurrentPostId] = useState<string>("");
  
  // Interaction State
  const [heartAnimation, setHeartAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [showReportModal, setShowReportModal] = useState(false);
  
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [followedCreatorIds, setFollowedCreatorIds] = useState<Set<string>>(new Set());
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());
  
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const pageRef = useRef(1);

  // ✅ 1. INITIALISATION & CHARGEMENT
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await fetchData(session.user.id, true);
    };
    init();
  }, [router]);

  const fetchData = async (userId: string, isInitial = false) => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      if (isInitial) {
        const { data: followsData } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
        setFollowedCreatorIds(new Set(followsData?.map((f: any) => f.following_id) || []));

        const { data: subsData } = await supabase.from('subscriptions').select('creator_id').eq('fan_id', userId).eq('status', 'active');
        setSubscribedCreatorIds(new Set(subsData?.map((s: any) => s.creator_id) || []));
      }

      const limit = 10;
      const from = (pageRef.current - 1) * limit;
      const to = from + limit - 1;

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!postsData || postsData.length === 0) {
        if (isInitial) { setPosts([]); setFilteredPosts([]); }
        return;
      }

      const userIds = [...new Set(postsData.map((p: any) => p.user_id))];
      const { data: profilesData } = await supabase.from('profiles').select('id, username, full_name, avatar_url, is_verified').in('id', userIds);
      const profilesMap: Record<string, any> = {};
      profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });

      const postIds = postsData.map((p: any) => p.id);
      const { data: likesData } = await supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', userId);
      
      if (isInitial) {
        setLikedPostIds(new Set(likesData?.map((l: any) => l.post_id) || []));
      } else {
        setLikedPostIds(prev => {
          const next = new Set(prev);
          likesData?.forEach((l: any) => next.add(l.post_id));
          return next;
        });
      }

      const mergedPosts = postsData.map((post: any) => ({
        ...post,
        profiles: profilesMap[post.user_id] || { username: 'Utilisateur', full_name: 'Utilisateur', avatar_url: null, is_verified: false },
      }));

      if (isInitial) {
        setPosts(mergedPosts);
        setHasLoadedOnce(true);
      } else {
        setPosts(prev => [...prev, ...mergedPosts]);
      }
      
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // ✅ 2. FILTRAGE "POUR TOI" vs "ABONNEMENTS"
  useEffect(() => {
    if (activeTab === "following") {
      const followed = posts.filter(post => followedCreatorIds.has(post.user_id));
      setFilteredPosts(followed);
    } else {
      setFilteredPosts(posts);
    }
    pageRef.current = 1;
  }, [activeTab, posts, followedCreatorIds]);

  // ✅ 3. AUTO-PLAY & PAUSE AU SCROLL (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.6 });

    videoRefs.current.forEach(video => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [filteredPosts]);

  // ✅ 4. INFINITE SCROLL
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200 && !isLoadingMore && hasLoadedOnce) {
      pageRef.current += 1;
      fetchData(user.id, false);
    }
  }, [isLoadingMore, hasLoadedOnce, user]);

  // ✅ 5. GESTION DES COMMENTAIRES & RÉPONSES
  const fetchComments = async (postId: string) => {
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    
    if (!commentsData) { setComments([]); return; }

    const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
    const { data: profilesData } = await supabase.from('profiles').select('id, username, full_name, avatar_url, is_verified').in('id', userIds);
    const profilesMap: Record<string, any> = {};
    profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });

    setComments(commentsData.map((c: any) => ({
      ...c,
      profiles: profilesMap[c.user_id] || { username: 'Utilisateur', full_name: 'Utilisateur', avatar_url: null, is_verified: false }
    })));
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    
    try {
      await supabase.from('comments').insert({
        post_id: currentPostId,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Utilisateur',
        content: newComment.trim(),
        parent_id: replyTo?.id || null,
      });

      const currentPost = posts.find(p => p.id === currentPostId);
      if (currentPost) {
        const newCount = (currentPost.comments_count || 0) + 1;
        await supabase.from('posts').update({ comments_count: newCount }).eq('id', currentPostId);
        setPosts(prev => prev.map(p => p.id === currentPostId ? { ...p, comments_count: newCount } : p));
        setFilteredPosts(prev => prev.map(p => p.id === currentPostId ? { ...p, comments_count: newCount } : p));
      }

      setNewComment("");
      setReplyTo(null);
      await fetchComments(currentPostId);
    } catch (error) {
      console.error("❌ Erreur commentaire:", error);
    }
  };

  // ✅ 6. INTERACTIONS (LIKE, FOLLOW, DOUBLE TAP)
  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;

    const isLiked = likedPostIds.has(postId);
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;

    const newCount = isLiked ? Math.max(0, (currentPost.likes_count || 0) - 1) : (currentPost.likes_count || 0) + 1;

    try {
      if (isLiked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      else await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });

      await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);

      setLikedPostIds(prev => {
        const next = new Set(prev);
        isLiked ? next.delete(postId) : next.add(postId);
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
      if (isFollowed) await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId);
      else await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
      
      setFollowedCreatorIds(prev => {
        const next = new Set(prev);
        isFollowed ? next.delete(creatorId) : next.add(creatorId);
        return next;
      });
    } catch (error) {
      console.error("❌ Erreur follow:", error);
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

  // ✅ 7. REDIRECTION PROFIL CORRIGÉE
  const handleProfileClick = (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (user?.id === targetUserId) {
      router.push("/profile");
    } else {
      router.push(`/createur?id=${targetUserId}`);
    }
  };

  const colors = {
    bg: "#0A0A0A", card: "#1A1A1A", border: "#2A2A2A", primary: "#8B5CF6",
    text: "#FFFFFF", textMuted: "#9CA3AF", danger: "#EF4444", green: "#10B981",
  };

  if (!user || (isLoading && !hasLoadedOnce)) {
    return (
      <DashboardLayout>
        <div style={{ height: "100dvh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (filteredPosts.length === 0 && hasLoadedOnce) {
    return (
      <DashboardLayout>
        <div style={{ height: "100dvh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, flexDirection: "column" }}>
          <span style={{ fontSize: "48px" }}>🎬</span>
          <p style={{ marginTop: "16px" }}>{activeTab === "following" ? "Aucune publication de vos abonnements" : "Aucune publication"}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="main-layout">
        <main ref={containerRef} onScroll={handleScroll} className="video-scroll-container">
          
          <div className="header-tabs">
            <button onClick={() => setActiveTab("following")} className={`tab-btn ${activeTab === "following" ? "active" : ""}`}>Abonnements</button>
            <button onClick={() => setActiveTab("foryou")} className={`tab-btn ${activeTab === "foryou" ? "active" : ""}`}>Pour toi</button>
          </div>

          {filteredPosts.map((post, index) => {
            const creator = post.profiles;
            const isMyOwnPost = user?.id === post.user_id;
            const isLocked = !isMyOwnPost && !subscribedCreatorIds.has(post.user_id);
            const isLiked = likedPostIds.has(post.id);
            const isFollowed = followedCreatorIds.has(post.user_id);

            return (
              <div key={post.id} className="video-wrapper" onClick={() => handleDoubleTap(post.id)}>
                <div className="video-content">
                  {post.media_type === 'video' ? (
                    <video 
                      ref={el => { videoRefs.current[index] = el; }} 
                      src={post.media_url} 
                      loop 
                      muted={isMuted} 
                      playsInline 
                      className="media-element"
                    />
                  ) : (
                    <img src={post.media_url} alt="Post" className="media-element" />
                  )}

                  <div className="video-overlay" />

                  {isLocked && (
                    <div className="locked-overlay">
                      <div className="lock-icon">🔒</div>
                      <h3>Contenu réservé aux abonnés</h3>
                    </div>
                  )}

                  {heartAnimation && index === 0 && (
                    <div className="heart-animation"><span>❤️</span></div>
                  )}

                  <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="mute-btn">
                    {isMuted ? "🔇" : "🔊"}
                  </button>

                  <div className="video-info">
                    <div onClick={(e) => handleProfileClick(e, post.user_id)} className="creator-info">
                      <div className="avatar" style={{ backgroundImage: `url(${creator.avatar_url || ''})` }}>
                        {!creator.avatar_url && "👤"}
                      </div>
                      <span className="creator-name">{creator.full_name || creator.username}</span>
                      {creator.is_verified && <span className="verified-badge">✓</span>}
                      {!isFollowed && !isMyOwnPost && (
                        <button onClick={(e) => { e.stopPropagation(); handleFollow(post.user_id); }} className="follow-btn">Suivre</button>
                      )}
                    </div>
                    <p className="caption">{post.content || "(Pas de légende)"}</p>
                    <div className="music-info"><span>🎵</span><span>Son original - {creator.username}</span></div>
                  </div>

                  {/* ✅ BOUTONS DROITE - DESIGN VERTICAL EXACT COMME L'IMAGE 2 */}
                  <div className="action-buttons">
                    <div className="action-item avatar-item" onClick={(e) => handleProfileClick(e, post.user_id)}>
                      <div className="action-icon-wrapper avatar-action" style={{ backgroundImage: `url(${creator.avatar_url || ''})` }}>
                        {!creator.avatar_url && "👤"}
                      </div>
                      {!isFollowed && !isMyOwnPost && (
                        <button onClick={(e) => { e.stopPropagation(); handleFollow(post.user_id); }} className="add-follow-btn">+</button>
                      )}
                    </div>

                    {/* Like Button (SVG Cœur) */}
                    <button onClick={(e) => handleLike(post.id, e)} className="action-item">
                      <div className={`action-icon-wrapper ${isLiked ? "liked" : ""}`}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill={isLiked ? "#EF4444" : "none"} stroke={isLiked ? "#EF4444" : "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </div>
                      <span className="action-count">{formatCount(post.likes_count)}</span>
                    </button>

                    {/* Comment Button (SVG Bulle) */}
                    <button onClick={(e) => { e.stopPropagation(); setCurrentPostId(post.id); setShowComments(true); fetchComments(post.id); }} className="action-item">
                      <div className="action-icon-wrapper">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                          <circle cx="9" cy="12" r="1" fill="#FFFFFF" stroke="none"></circle>
                          <circle cx="15" cy="12" r="1" fill="#FFFFFF" stroke="none"></circle>
                        </svg>
                      </div>
                      <span className="action-count">{formatCount(post.comments_count)}</span>
                    </button>

                    {/* Share Button (SVG Flèche) */}
                    <button onClick={(e) => { e.stopPropagation(); handleShare(post); }} className="action-item">
                      <div className="action-icon-wrapper">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 19l-4-7 4-7" transform="rotate(180 12 12)"></path>
                          <path d="M7 12h14" transform="rotate(180 12 12)"></path>
                        </svg>
                      </div>
                      <span className="action-count">{formatCount(post.shares_count || 0)}</span>
                    </button>

                    {/* Save Button (SVG Signet) */}
                    <button onClick={(e) => { e.stopPropagation(); /* Logique de save */ }} className="action-item">
                      <div className="action-icon-wrapper">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                      <span className="action-count">{formatCount(post.saves_count || 0)}</span>
                    </button>

                    {/* More Button (SVG Points) */}
                    <button onClick={(e) => { e.stopPropagation(); setShowReportModal(true); setCurrentPostId(post.id); }} className="action-item">
                      <div className="action-icon-wrapper" style={{ fontSize: "20px" }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF">
                          <circle cx="12" cy="12" r="1.5"></circle>
                          <circle cx="6" cy="12" r="1.5"></circle>
                          <circle cx="18" cy="12" r="1.5"></circle>
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoadingMore && (
            <div style={{ padding: "20px", textAlign: "center", color: colors.textMuted }}>Chargement de plus de vidéos...</div>
          )}
        </main>

        {/* ✅ PANNEAU DE COMMENTAIRES RESPONSIVE */}
        {showComments && (
          <div className="comments-panel">
            <div className="comments-header">
              <h3>Commentaires</h3>
              <button onClick={() => { setShowComments(false); setReplyTo(null); }}>✕</button>
            </div>
            
            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="empty-comments"><span>💬</span><p>Aucun commentaire</p></div>
              ) : (
                comments.map((comment: any) => (
                  <div key={comment.id} className="comment-item">
                    <div onClick={(e) => handleProfileClick(e, comment.user_id)} className="comment-avatar" style={{ backgroundImage: `url(${comment.profiles?.avatar_url || ''})` }}>
                      {!comment.profiles?.avatar_url && "👤"}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-name">{comment.profiles?.full_name || comment.user_name}</span>
                        {comment.profiles?.is_verified && <span className="verified-badge">✓</span>}
                      </div>
                      <p className="comment-text">
                        {comment.parent_id && <span style={{ color: colors.primary, fontWeight: "bold", marginRight: "4px" }}>@{comments.find(c => c.id === comment.parent_id)?.user_name || 'Utilisateur'}</span>}
                        {comment.content}
                      </p>
                      <button onClick={() => setReplyTo(comment)} className="reply-btn">Répondre</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="comment-input-area">
              {replyTo && (
                <div className="replying-to">
                  <span>Réponse à <b>{replyTo.user_name}</b></span>
                  <button onClick={() => setReplyTo(null)}>✕</button>
                </div>
              )}
              <input 
                type="text" 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && submitComment()} 
                placeholder={replyTo ? "Écrire une réponse..." : "Ajouter un commentaire..."} 
              />
              <button onClick={submitComment} disabled={!newComment.trim()} className="send-btn">↑</button>
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Signaler ce post</h3>
              <div className="report-options">
                {["spam", "violence", "harcèlement", "droits d'auteur", "autre"].map((reason) => (
                  <button key={reason} onClick={() => { /* Logique d'envoi à ajouter */ setShowReportModal(false); }} className="report-option">{reason}</button>
                ))}
              </div>
              <button onClick={() => setShowReportModal(false)} className="cancel-btn">Annuler</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes heartPop { 0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }

        .main-layout { display: flex; height: 100dvh; background-color: #000; color: #fff; }
        
        .video-scroll-container {
          flex: 1;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          height: 100dvh;
          scrollbar-width: none;
        }
        .video-scroll-container::-webkit-scrollbar { display: none; }

        .video-wrapper {
          height: 100dvh;
          width: 100%;
          scroll-snap-align: start;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .video-content {
          height: 100%;
          width: 100%;
          max-width: 600px;
          position: relative;
        }

        .media-element { width: 100%; height: 100%; object-fit: cover; }
        .video-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.8) 100%); pointer-events: none; }
        
        .locked-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(15px); }
        .lock-icon { font-size: 32px; margin-bottom: 12px; }
        
        .heart-animation { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; pointer-events: none; font-size: 120px; animation: heartPop 0.8s ease-out forwards; }
        
        .mute-btn { position: absolute; top: 70px; left: 16px; background: rgba(0,0,0,0.5); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }

        .header-tabs { position: absolute; top: 0; left: 0; right: 0; z-index: 40; display: flex; justify-content: center; gap: 32px; padding: 16px; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%); }
        .tab-btn { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 16px; font-weight: bold; cursor: pointer; padding-bottom: 4px; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #fff; border-bottom-color: #fff; }

        .video-info { position: absolute; bottom: 20px; left: 16px; right: 100px; z-index: 20; }
        .creator-info { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; cursor: pointer; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background-color: #333; background-size: cover; background-position: center; border: 2px solid white; display: flex; align-items: center; justify-content: center; }
        .creator-name { font-weight: bold; font-size: 17px; color: white; }
        .verified-badge { color: #10B981; margin-left: 4px; }
        .follow-btn { padding: 6px 16px; background-color: #8B5CF6; border: none; border-radius: 20px; color: white; font-weight: bold; font-size: 13px; cursor: pointer; margin-left: 8px; }
        
        .caption { font-size: 14px; line-height: 1.4; color: white; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .music-info { display: flex; align-items: center; gap: 6px; color: white; font-size: 13px; }

        /* ✅ BOUTONS D'ACTION - DESIGN EXACT COMME L'IMAGE 2 */
        .action-buttons {
          position: absolute;
          right: 8px;
          bottom: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          z-index: 30;
        }

        .action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          min-width: 52px;
        }

        .action-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease;
        }

        .action-item:active .action-icon-wrapper {
          transform: scale(0.9);
        }

        .action-icon-wrapper.liked {
          background-color: rgba(239, 68, 68, 0.2);
        }

        .action-count {
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          text-align: center;
          line-height: 1.2;
        }

        .action-item.avatar-item {
          position: relative;
        }

        .avatar-action {
          background-size: cover;
          background-position: center;
          border: 2px solid white;
          font-size: 20px;
        }

        .add-follow-btn {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #EF4444;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ✅ COMMENTAIRES RESPONSIVE */
        .comments-panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 400px;
          background-color: #1A1A1A;
          border-left: 1px solid #2A2A2A;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: transform 0.3s ease;
        }

        .comments-header { padding: 20px; border-bottom: 1px solid #2A2A2A; display: flex; justify-content: space-between; align-items: center; }
        .comments-header h3 { margin: 0; font-size: 16px; font-weight: bold; }
        .comments-header button { background: none; border: none; color: #9CA3AF; font-size: 24px; cursor: pointer; }
        
        .comments-list { flex: 1; overflow-y: auto; padding: 20px; }
        .empty-comments { text-align: center; color: #9CA3AF; margin-top: 40px; }
        .empty-comments span { font-size: 48px; display: block; margin-bottom: 12px; }
        
        .comment-item { display: flex; gap: 12px; margin-bottom: 20px; }
        .comment-avatar { width: 36px; height: 36px; border-radius: 50%; background-color: #333; background-size: cover; background-position: center; flex-shrink: 0; cursor: pointer; }
        .comment-content { flex: 1; }
        .comment-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .comment-name { font-weight: bold; font-size: 14px; }
        .comment-text { font-size: 14px; line-height: 1.4; margin: 0 0 6px 0; color: #E5E7EB; }
        .reply-btn { background: none; border: none; color: #9CA3AF; font-size: 12px; cursor: pointer; padding: 0; }
        .reply-btn:hover { color: #fff; }

        .comment-input-area { padding: 16px; border-top: 1px solid #2A2A2A; display: flex; flex-direction: column; gap: 8px; }
        .replying-to { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #8B5CF6; background: rgba(139, 92, 246, 0.1); padding: 8px 12px; border-radius: 8px; }
        .replying-to button { background: none; border: none; color: #9CA3AF; cursor: pointer; }
        .comment-input-area input { flex: 1; background-color: #0A0A0A; border: 1px solid #2A2A2A; border-radius: 24px; padding: 12px 20px; color: #fff; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
        .send-btn { background-color: #8B5CF6; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; font-size: 18px; flex-shrink: 0; }
        .send-btn:disabled { background-color: transparent; color: #9CA3AF; cursor: not-allowed; }

        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-content { background-color: #1A1A1A; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; }
        .modal-content h3 { margin: 0 0 16px 0; color: #fff; font-size: 18px; font-weight: bold; }
        .report-options { display: flex; flex-direction: column; gap: 12px; }
        .report-option { padding: 12px 16px; background-color: #0A0A0A; border: 1px solid #2A2A2A; border-radius: 8px; color: #fff; text-align: left; cursor: pointer; font-size: 14px; }
        .cancel-btn { margin-top: 20px; width: 100%; padding: 12px; background-color: transparent; border: 1px solid #2A2A2A; border-radius: 8px; color: #9CA3AF; cursor: pointer; }

        @media (max-width: 768px) {
          .comments-panel {
            width: 100%;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            height: 70vh;
            border-left: none;
            border-top: 1px solid #2A2A2A;
            border-radius: 20px 20px 0 0;
            transform: translateY(0);
          }
          .video-content { max-width: 100%; }
        }
      `}</style>
    </DashboardLayout>
  );
}