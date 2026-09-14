"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { downloadForOffline } from "@/lib/offlineManager";
import TipDialog from "@/components/TipDialog";
import { useAppTheme } from "@/contexts/ThemeContext";
import { 
  useToast, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack, Button, Textarea 
} from "@chakra-ui/react";

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

// ==========================================
// ✅ VRAIES ICÔNES SVG PROFESSIONNELLES
// ==========================================
const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? "#EF4444" : "none"} stroke={filled ? "#EF4444" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const MoneyIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const MoreIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1.5" fill="white" />
    <circle cx="12" cy="12" r="1.5" fill="white" />
    <circle cx="12" cy="19" r="1.5" fill="white" />
  </svg>
);

const FlagIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const VolumeOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const { isDark, theme } = useAppTheme();
  
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
  
  const [showTipModal, setShowTipModal] = useState(false);
  const [currentTipPost, setCurrentTipPost] = useState<any>(null);
  
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [reportPostId, setReportPostId] = useState<string>("");
  const [isReportOpen, setIsReportOpen] = useState(false);

  // ✅ NOUVEAUX ÉTATS POUR LA MODIFICATION DYNAMIQUE
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [postToEdit, setPostToEdit] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const colors = {
    bg: isDark ? "#000000" : "#F3F4F6",
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    success: "#10B981",
    danger: "#EF4444",
    overlay: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
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
    if (!user) return;
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

  const handleShare = async (post: any) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Regarde ce post de ${creatorInfo.name} : ${post?.caption || ''}`;
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Post', text, url }); } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(`${url}\n\n${text}`);
        toast({ title: "Lien copié !", status: "success", duration: 2000 });
      } catch (err) {}
    }
  };

  const handleDownload = async (post: any) => {
    if (!post.media_url) return;
    try {
      const success = await downloadForOffline(post.id, post.media_url, post);
      toast({ title: success ? "✅ Sauvegardé !" : "Échec", status: success ? "success" : "error", duration: 3000 });
    } catch (error) { 
      toast({ title: "❌ Erreur", status: "error", duration: 3000 }); 
    }
  };

  // ✅ 1. OUVRIR LA MODALE DE MODIFICATION
  const openEditModal = (post: any) => {
    setPostToEdit(post);
    setEditCaption(post.caption || post.title || "");
    setIsEditModalOpen(true);
    setShowMoreMenu(null); // Fermer le menu 3 points
  };

  // ✅ 2. SAUVEGARDER LA MODIFICATION DANS SUPABASE
  const saveEdit = async () => {
    if (!postToEdit) return;
    try {
      await supabase.from('posts').update({
        caption: editCaption,
        title: editCaption
      }).eq('id', postToEdit.id);

      // Mise à jour immédiate de l'interface (Optimistic UI)
      setPosts(prev => prev.map(p => p.id === postToEdit.id ? { ...p, caption: editCaption, title: editCaption } : p));

      toast({ title: "✅ Post modifié avec succès", status: "success", duration: 3000 });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Erreur modification:", error);
      toast({ title: "Erreur lors de la modification", status: "error", duration: 3000 });
    }
  };

  // ✅ 3. SUPPRESSION DYNAMIQUE
  const handleDelete = async (postIdToDelete: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce post ? Cette action est irréversible.")) return;
    try {
      await supabase.from('posts').delete().eq('id', postIdToDelete);
      toast({ title: "🗑️ Post supprimé avec succès", status: "success", duration: 3000 });
      setShowMoreMenu(null);
      
      // Redirection vers le profil du créateur ou l'accueil
      setTimeout(() => {
        router.push(`/createur?id=${creatorInfo.id}`);
      }, 1000);
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast({ title: "Erreur lors de la suppression", status: "error", duration: 3000 });
    }
  };

  const fetchComments = async (postIdToFetch: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:profiles(username, full_name, avatar_url)')
      .eq('post_id', postIdToFetch)
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
      console.error(" Erreur commentaire:", error);
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
  const isMyPost = user?.id === creatorInfo.id;

  return (
    <div className="page-wrapper">
      <div 
        ref={containerRef}
        className="snap-container"
        onScroll={handleScroll}
      >
        {currentIndex > 0 && (
          <button 
            className="nav-btn"
            onClick={() => scrollToIndex(currentIndex - 1)}
            style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", fontSize: "20px" }}
          >
            ↑
          </button>
        )}

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
                style={{ position: "absolute", top: "20px", left: "16px", backgroundColor: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", zIndex: 20 }}
              >
                <XIcon />
              </button>

              {post.media_type === 'video' && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  style={{ position: "absolute", top: "20px", right: "16px", backgroundColor: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", zIndex: 20 }}
                >
                  {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
                </button>
              )}

              <div style={{ position: "absolute", right: "12px", bottom: "120px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", zIndex: 20 }}>
                <ActionButton 
                  icon={<HeartIcon filled={postIsLiked} />} 
                  label={formatCount(post.likes_count)} 
                  color={postIsLiked ? "#EF4444" : "white"} 
                  onClick={(e) => handleLike(post, e)} 
                />
                <ActionButton 
                  icon={<CommentIcon />} 
                  label={formatCount(post.comments_count)} 
                  onClick={toggleCommentsPanel} 
                />
                
                {isMyPost ? (
                  <div style={{ position: "relative" }}>
                    <ActionButton 
                      icon={<MoreIcon />} 
                      label="" 
                      onClick={() => setShowMoreMenu(showMoreMenu === post.id ? null : post.id)} 
                    />
                    {showMoreMenu === post.id && (
                      <div style={{
                        position: "absolute", right: "50px", bottom: "0",
                        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        zIndex: 30,
                        overflow: "hidden",
                        minWidth: "140px"
                      }}>
                        <button onClick={() => openEditModal(post)} style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "transparent", border: "none", borderBottom: `1px solid ${colors.border}`, color: colors.text, cursor: "pointer", fontSize: "14px" }}>
                          <EditIcon /> Modifier
                        </button>
                        <button onClick={() => handleDelete(post.id)} style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "transparent", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "14px" }}>
                          <TrashIcon /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <ActionButton 
                      icon={<MoneyIcon />} 
                      label="Tip" 
                      color="#F97316" 
                      onClick={() => { setCurrentTipPost(post); setShowTipModal(true); }} 
                    />
                    <ActionButton 
                      icon={<ShareIcon />} 
                      label="Partager" 
                      onClick={() => handleShare(post)} 
                    />
                    <ActionButton 
                      icon={<FlagIcon />} 
                      label="Signaler" 
                      onClick={() => { setReportPostId(post.id); setIsReportOpen(true); setShowMoreMenu(null); }} 
                    />
                    <ActionButton 
                      icon={<DownloadIcon />} 
                      label="Télécharger" 
                      onClick={() => handleDownload(post)} 
                    />
                  </>
                )}
              </div>

              <div style={{ position: "absolute", left: "16px", right: "80px", bottom: "40px", zIndex: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div 
                    onClick={() => router.push(`/createur?id=${creatorInfo.id}`)}
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%", 
                      backgroundColor: "rgba(255,255,255,0.2)",
                      backgroundImage: creatorInfo.avatar ? `url(${creatorInfo.avatar})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white"
                    }}
                  >
                    {!creatorInfo.avatar && <UserIcon />}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span 
                        onClick={() => router.push(`/createur?id=${creatorInfo.id}`)}
                        style={{ color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
                      >
                        @{creatorInfo.name}
                      </span>
                      {!isFollowing && !isMyPost ? (
                        <button 
                          onClick={handleFollow} 
                          style={{ 
                            padding: "4px 12px", 
                            backgroundColor: colors.primary, 
                            border: "none", 
                            borderRadius: "16px", 
                            color: colors.primaryText, 
                            fontSize: "12px", 
                            fontWeight: "bold", 
                            cursor: "pointer" 
                          }}
                        >
                          Suivre
                        </button>
                      ) : isFollowing ? (
                        <span style={{ color: colors.success, fontSize: "18px" }}>✓</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                <p style={{ color: "white", fontSize: "14px", lineHeight: "1.4", marginBottom: "8px", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                  {post.caption || post.title || " (Pas de légende)"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{dateStr}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showCommentsPanel && (
        <>
          <div className="comments-overlay" onClick={() => setShowCommentsPanel(false)} />
          <div className="comments-panel" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <div style={{ padding: "16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: "16px", color: colors.text }}>Commentaires ({formatCount(currentPost.comments_count)})</span>
              <button onClick={() => setShowCommentsPanel(false)} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", display: "flex" }}>
                <XIcon />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", color: colors.textMuted, marginTop: "40px" }}>
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center", color: colors.textMuted }}>
                    <CommentIcon />
                  </div>
                  <p>Aucun commentaire.</p>
                </div>
              ) : (
                comments.map((comment: any, i: number) => (
                  <div key={i} style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: colors.hover, backgroundImage: comment.profiles?.avatar_url ? `url(${comment.profiles.avatar_url})` : undefined, backgroundSize: "cover", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>
                      {!comment.profiles?.avatar_url && <UserIcon />}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px", color: colors.text }}>{comment.profiles?.full_name || comment.user_name || 'Utilisateur'}</div>
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
                style={{ 
                  flex: 1, 
                  backgroundColor: colors.bg, 
                  border: `1px solid ${colors.border}`, 
                  borderRadius: "20px", 
                  padding: "10px 16px", 
                  color: colors.text, 
                  fontSize: "14px", 
                  outline: "none" 
                }}
              />
              <button 
                onClick={submitComment} 
                disabled={!newComment.trim()} 
                style={{ 
                  backgroundColor: newComment.trim() ? colors.primary : colors.border, 
                  border: "none", 
                  borderRadius: "50%", 
                  width: "36px", 
                  height: "36px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  cursor: newComment.trim() ? "pointer" : "not-allowed", 
                  color: newComment.trim() ? colors.primaryText : colors.textMuted
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </>
      )}

      {/* ✅ MODALE DE MODIFICATION DYNAMIQUE */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} isCentered>
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg={isDark ? "#1A1A1A" : "#FFFFFF"} color={colors.text} maxW="500px" borderRadius="16px">
          <ModalHeader>Modifier le post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Nouvelle légende..."
              rows={4}
              bg={colors.bg}
              border={`1px solid ${colors.border}`}
              color={colors.text}
              _focus={{ borderColor: colors.primary, boxShadow: "none" }}
            />
          </ModalBody>
          <ModalFooter>
            <VStack w="100%" spacing="3">
              <Button w="100%" bg={colors.primary} color={colors.primaryText} _hover={{ opacity: 0.9 }} onClick={saveEdit} isDisabled={!editCaption.trim()}>
                Enregistrer les modifications
              </Button>
              <Button w="100%" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Annuler
              </Button>
            </VStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {showTipModal && currentTipPost && (
        <TipDialog 
          creatorId={creatorInfo.id} 
          creatorName={creatorInfo.name} 
          onClose={() => { setShowTipModal(false); setCurrentTipPost(null); }} 
          onSuccess={() => {
            toast({ title: "Pourboire envoyé avec succès !", status: "success", duration: 3000 });
          }} 
        />
      )}

      {/* ✅ MODALE DE SIGNALEMENT (Déjà dynamique via Supabase) */}
<ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} postId={reportPostId} isDark={isDark} />
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .page-wrapper {
          min-height: 100vh;
          width: 100%;
          background-color: ${isDark ? "#000" : "#F3F4F6"};
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
          background-color: ${colors.overlay};
          z-index: 40;
        }
        
        .comments-panel {
          position: fixed;
          bottom: 0;
          right: 0;
          width: 100%;
          max-width: 400px;
          height: 70vh;
          background-color: ${colors.card};
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          border: 1px solid ${colors.border};
          border-top: none;
        }

        @media (min-width: 768px) {
          .snap-container {
            width: 450px;
            height: 85vh;
            border-radius: 16px;
            border: 1px solid ${colors.border};
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
            border: 1px solid ${colors.border};
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          }
        }
      `}</style>
    </div>
  );
}

function ActionButton({ icon, label, color = "white", onClick }: { icon: React.ReactNode, label: string, color?: string, onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", padding: "4px" }}>
      <div style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))", color: color, display: "flex" }}>
        {icon}
      </div>
      {label && <span style={{ color: "white", fontSize: "12px", fontWeight: "bold", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{label}</span>}
    </button>
  );
}

function ReportModal({ isOpen, onClose, postId, isDark }: { isOpen: boolean; onClose: () => void; postId: string; isDark: boolean }) {
  const toast = useToast();
  const [selectedReason, setSelectedReason] = useState("");

  const handleReport = async () => {
  if (!selectedReason) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // ✅ CORRECTION : Utiliser target_id et target_type selon ta structure
    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_id: postId,
      target_type: 'post', // ✅ Important pour le trigger
      reason: selectedReason
    });

    if (error) {
      // Si l'erreur est "duplicate key", c'est que l'utilisateur a déjà signalé
      if (error.code === '23505') {
        toast({ 
          title: "Déjà signalé", 
          description: "Vous avez déjà signalé ce post.", 
          status: "warning", 
          duration: 3000 
        });
      } else {
        throw error;
      }
    } else {
      toast({ title: "✅ Signalement envoyé", status: "success", duration: 3000 });
    }
    onClose();
  } catch (error) {
    console.error("Erreur signalement:", error);
    toast({ title: "Erreur lors du signalement", status: "error", duration: 3000 });
  }
};

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={isDark ? "#1A1A1A" : "#FFFFFF"} color={isDark ? "white" : "black"} maxW="400px" borderRadius="16px">
        <ModalHeader>Signaler ce post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing="2" align="stretch">
            {["Spam", "Violence", "Harcèlement", "Droits d'auteur", "Autre"].map(reason => (
              <Button
                key={reason}
                justifyContent="flex-start"
                bg={selectedReason === reason ? "#3B82F6" : (isDark ? "#2D3748" : "#E2E8F0")}
                color={isDark ? "white" : "black"}
                border={`1px solid ${isDark ? "#4A5568" : "#CBD5E0"}`}
                _hover={{ opacity: 0.9 }}
                onClick={() => setSelectedReason(reason)}
              >
                {reason}
              </Button>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <VStack w="100%" spacing="2">
            <Button w="100%" bg="#3B82F6" color="white" _hover={{ opacity: 0.9 }} onClick={handleReport} isDisabled={!selectedReason}>Envoyer</Button>
            <Button w="100%" variant="ghost" onClick={onClose}>Annuler</Button>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}