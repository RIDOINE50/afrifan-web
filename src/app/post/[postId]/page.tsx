"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TipDialog from "@/components/TipDialog"; // ✅ Import du composant TipDialog

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  
  const postId = params.postId as string;
  
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [creatorInfo, setCreatorInfo] = useState({ id: "", name: "", avatar: "" });
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  
  // ✅ État pour gérer l'ouverture du modal de pourboire
  const [showTipModal, setShowTipModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const colors = {
    bg: "#000000",
    card: "#121212",
    border: "#2F2F2F",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#A1A1A1",
    success: "#10B981",
    danger: "#EF4444",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
    };
    init();
  }, []);

  useEffect(() => {
    if (!postId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('id, user_id, media_url, media_type, caption, title, created_at, likes_count, comments_count')
          .eq('id', postId)
          .single();

        if (postError || !postData) {
          console.error("Erreur chargement post:", postError);
          setIsLoading(false);
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', postData.user_id)
          .single();

        if (profileData) {
          setCreatorInfo({
            id: profileData.id,
            name: profileData.full_name || profileData.username,
            avatar: profileData.avatar_url
          });

          const { data: allPosts } = await supabase
            .from('posts')
            .select('id, media_url, media_type, caption, title, created_at, likes_count, comments_count')
            .eq('user_id', postData.user_id)
            .order('created_at', { ascending: false })
            .limit(30);

          if (allPosts) {
            setPosts(allPosts);
            const index = allPosts.findIndex((p: any) => p.id === postId);
            setCurrentIndex(index !== -1 ? index : 0);

            if (user) {
              await loadUserInteractions(postData.user_id, allPosts.map((p: any) => p.id));
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [postId, user?.id]);

  const loadUserInteractions = async (creatorId: string, postIds: string[]) => {
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', creatorId)
      .maybeSingle();
    setIsFollowing(followData !== null);

    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds)
      .eq('user_id', user.id);
    
    setLikedPostIds(new Set(likesData?.map((l: any) => l.post_id) || []));
  };

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex]);

  const handleLike = async (post: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return router.push("/login");

    const isLiked = likedPostIds.has(post.id);
    const newCount = isLiked ? Math.max(0, (post.likes_count || 0) - 1) : (post.likes_count || 0) + 1;

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
        setLikedPostIds(prev => { const next = new Set(prev); next.delete(post.id); return next; });
      } else {
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
        setLikedPostIds(prev => { const next = new Set(prev); next.add(post.id); return next; });
      }
      
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: newCount } : p));
      
      const { data: refreshedPost } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', post.id)
        .single();
      
      if (refreshedPost) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: refreshedPost.likes_count } : p));
      }
    } catch (error) {
      console.error("❌ Erreur like:", error);
    }
  };

  const handleFollow = async () => {
    if (!user) return router.push("/login");
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorInfo.id);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorInfo.id });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("❌ Erreur follow:", error);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const currentPost = posts[currentIndex];
    const text = `Regarde ce post de ${creatorInfo.name} : ${currentPost?.caption || ''}`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Post', text, url }); } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(`${url}\n\n${text}`);
        alert("Lien copié !");
      } catch (err) {}
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:profiles(username, full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    
    if (!error) setComments(data || []);
  };

  const toggleCommentsPanel = () => {
    if (!showCommentsPanel) {
      fetchComments(posts[currentIndex].id);
    }
    setShowCommentsPanel(!showCommentsPanel);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    const currentPost = posts[currentIndex];

    try {
      await supabase.from('comments').insert({
        post_id: currentPost.id,
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Utilisateur',
        content: newComment.trim(),
      });

      const newCount = (currentPost.comments_count || 0) + 1;
      await supabase.from('posts').update({ comments_count: newCount }).eq('id', currentPost.id);
      setPosts(prev => prev.map(p => p.id === currentPost.id ? { ...p, comments_count: newCount } : p));
      
      setNewComment("");
      await fetchComments(currentPost.id);
    } catch (error) {
      console.error("❌ Erreur commentaire:", error);
    }
  };

  const scrollToIndex = (index: number) => {
    if (containerRef.current && index >= 0 && index < posts.length) {
      const container = containerRef.current;
      const scrollTop = index * container.clientHeight;
      container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      setCurrentIndex(index);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== currentIndex && index >= 0 && index < posts.length) {
      setCurrentIndex(index);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.text }}>
        <p>Post introuvable</p>
      </div>
    );
  }

  const currentPost = posts[currentIndex];
  const isLiked = likedPostIds.has(currentPost.id);
  const dateStr = currentPost.created_at ? new Date(currentPost.created_at).toLocaleDateString('fr-FR') : '';

  return (
    <div className="page-wrapper">
      <div 
        ref={containerRef}
        className="snap-container"
        onScroll={handleScroll}
      >
        {/* Flèche HAUT */}
        {currentIndex > 0 && (
          <button 
            className="nav-btn"
            onClick={() => scrollToIndex(currentIndex - 1)}
            style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", fontSize: "20px" }}
          >
            ↑
          </button>
        )}

        {/* Flèche BAS */}
        {currentIndex < posts.length - 1 && (
          <button 
            className="nav-btn"
            onClick={() => scrollToIndex(currentIndex + 1)}
            style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", fontSize: "20px" }}
          >
            ↓
          </button>
        )}

        {posts.map((post, index) => {
          const postIsLiked = likedPostIds.has(post.id);

          return (
            <div key={post.id} className="snap-item">
              {post.media_type === 'video' ? (
                <video
                  ref={el => { videoRefs.current[index] = el; }}
                  src={post.media_url}
                  loop
                  muted={isMuted}
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onClick={() => setIsMuted(!isMuted)}
                />
              ) : (
                <img src={post.media_url} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}

              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.8) 100%)", pointerEvents: "none" }} />

              <button 
                onClick={() => router.push(`/createur?id=${creatorInfo.id}`)}
                style={{ position: "absolute", top: "20px", left: "16px", backgroundColor: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", fontSize: "20px", zIndex: 20 }}
              >
                ←
              </button>

              {post.media_type === 'video' && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  style={{ position: "absolute", top: "20px", right: "16px", backgroundColor: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", fontSize: "18px", zIndex: 20 }}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
              )}

              <div style={{ position: "absolute", right: "12px", bottom: "120px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", zIndex: 20 }}>
                <ActionButton icon={postIsLiked ? "❤️" : "🤍"} label={formatCount(post.likes_count)} color={postIsLiked ? "#EF4444" : "white"} onClick={(e) => handleLike(post, e)} />
                <ActionButton icon="💬" label={formatCount(post.comments_count)} onClick={toggleCommentsPanel} />
                
                {/* ✅ MODIFICATION : Ouvre le modal TipDialog au lieu de rediriger */}
                <ActionButton icon="☕" label="Tip" color="#F97316" onClick={() => setShowTipModal(true)} />
                
                <ActionButton icon="↗️" label="Partager" onClick={handleShare} />
              </div>

              <div style={{ position: "absolute", left: "16px", right: "80px", bottom: "40px", zIndex: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div 
                    onClick={() => router.push(`/createur?id=${creatorInfo.id}`)}
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%", 
                      backgroundColor: colors.border,
                      backgroundImage: creatorInfo.avatar ? `url(${creatorInfo.avatar})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}
                  >
                    {!creatorInfo.avatar && "👤"}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span 
                        onClick={() => router.push(`/createur?id=${creatorInfo.id}`)}
                        style={{ color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
                      >
                        @{creatorInfo.name}
                      </span>
                      {!isFollowing ? (
                        <button onClick={handleFollow} style={{ padding: "4px 12px", backgroundColor: colors.primary, border: "none", borderRadius: "16px", color: "white", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                          Suivre
                        </button>
                      ) : (
                        <span style={{ color: colors.success, fontSize: "18px" }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p style={{ color: "white", fontSize: "14px", lineHeight: "1.4", marginBottom: "8px", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                  {post.caption || post.title || "📝 (Pas de légende)"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{dateStr}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panneau de commentaires */}
      {showCommentsPanel && (
        <>
          <div className="comments-overlay" onClick={() => setShowCommentsPanel(false)} />
          <div className="comments-panel">
            <div style={{ padding: "16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>Commentaires ({formatCount(currentPost.comments_count)})</span>
              <button onClick={() => setShowCommentsPanel(false)} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", color: colors.textMuted, marginTop: "40px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                  <p>Aucun commentaire.</p>
                </div>
              ) : (
                comments.map((comment: any, i: number) => (
                  <div key={i} style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: colors.border, backgroundImage: comment.profiles?.avatar_url ? `url(${comment.profiles.avatar_url})` : undefined, backgroundSize: "cover", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>{comment.profiles?.full_name || comment.user_name || 'Utilisateur'}</div>
                      <p style={{ fontSize: "14px", lineHeight: "1.4", margin: 0, color: colors.text }}>{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: "16px", borderTop: `1px solid ${colors.border}`, display: "flex", gap: "12px", alignItems: "center", backgroundColor: colors.card }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Ajouter un commentaire..."
                style={{ flex: 1, backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "20px", padding: "10px 16px", color: colors.text, fontSize: "14px", outline: "none" }}
              />
              <button onClick={submitComment} disabled={!newComment.trim()} style={{ backgroundColor: newComment.trim() ? colors.primary : colors.border, border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: newComment.trim() ? "pointer" : "not-allowed", color: "white" }}>
                ↑
              </button>
            </div>
          </div>
        </>
      )}

      {/* ✅ MODIFICATION : Rendu conditionnel du Modal de Pourboire */}
      {showTipModal && (
        <TipDialog 
          creatorId={creatorInfo.id} 
          creatorName={creatorInfo.name} 
          onClose={() => setShowTipModal(false)} 
          onSuccess={() => {
            console.log("Pourboire envoyé avec succès !");
            // Tu peux ajouter ici un toast de notification si tu en as un
          }} 
        />
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .page-wrapper {
          min-height: 100vh;
          width: 100%;
          background-color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .snap-container {
          width: 100%;
          height: 100vh;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          position: relative;
        }

        .snap-item {
          height: 100vh;
          width: 100%;
          scroll-snap-align: start;
          position: relative;
          flex-shrink: 0;
        }

        .snap-container::-webkit-scrollbar { display: none; }
        .snap-container { -ms-overflow-style: none; scrollbar-width: none; }

        .nav-btn { display: none; }
        
        .comments-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background-color: rgba(0,0,0,0.8);
          z-index: 40;
        }
        
        .comments-panel {
          position: fixed;
          bottom: 0;
          right: 0;
          width: 100%;
          max-width: 400px;
          height: 70vh;
          background-color: #121212;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          border: 1px solid #2F2F2F;
          border-top: none;
        }

        @media (min-width: 768px) {
          .snap-container {
            width: 450px;
            height: 85vh;
            border-radius: 16px;
            border: 1px solid #2F2F2F;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
          }
          
          .snap-item {
            height: 85vh;
            border-radius: 16px;
            overflow: hidden;
          }

          .nav-btn {
            display: flex;
          }

          .comments-overlay {
            display: block;
          }

          .comments-panel {
            position: fixed;
            right: calc(50% - 225px);
            top: 50%;
            transform: translateY(-50%);
            bottom: auto;
            width: 350px;
            height: 85vh;
            max-height: 600px;
            border-radius: 16px;
            border: 1px solid #2F2F2F;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          }
        }
      `}</style>
    </div>
  );
}

function ActionButton({ icon, label, color = "white", onClick }: { icon: string, label: string, color?: string, onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", padding: "4px" }}>
      <span style={{ fontSize: "32px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))", color: color }}>{icon}</span>
      {label && <span style={{ color: "white", fontSize: "12px", fontWeight: "bold", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{label}</span>}
    </button>
  );
}