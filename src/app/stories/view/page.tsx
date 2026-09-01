"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Composant interne qui utilise useSearchParams
function ViewStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creatorId");
  const initialStoryId = searchParams.get("storyId");

  const [stories, setStories] = useState<any[]>([]);
  const [creator, setCreator] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // États pour les interactions
  const [hasLiked, setHasLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isCreator, setIsCreator] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Chargement initial des données
  useEffect(() => {
    if (!creatorId) {
      router.push("/");
      return;
    }
    loadData();
  }, [creatorId, initialStoryId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Récupérer le profil du créateur
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", creatorId)
        .single();
      
      setCreator(profileData || { username: "Utilisateur", full_name: "Utilisateur", avatar_url: null });
      setIsCreator(currentUserId === creatorId);

      // Récupérer les stories actives (moins de 24h)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: storiesData } = await supabase
        .from("stories")
        .select("*")
        .eq("creator_id", creatorId)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: true });

      const validStories = storiesData || [];
      setStories(validStories);

      if (validStories.length > 0) {
        // Trouver l'index de la story demandée, ou 0 par défaut
        const startIndex = initialStoryId 
          ? validStories.findIndex((s: any) => s.id === initialStoryId) 
          : 0;
        setCurrentIndex(startIndex >= 0 ? startIndex : 0);
      }
    } catch (error) {
      console.error("❌ Erreur chargement stories :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Charger la story actuelle et enregistrer la vue
  useEffect(() => {
    if (stories.length === 0 || isLoading) return;

    let isMounted = true;
    const loadCurrentStory = async () => {
      setProgress(0);
      setIsPaused(false);
      
      const story = stories[currentIndex];
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      if (currentUserId) {
        // ✅ CORRECTION : Récupérer d'abord l'interaction existante pour connaître le has_liked actuel
        const { data: existingInteraction } = await supabase
          .from("story_interactions")
          .select("has_liked")
          .eq("story_id", story.id)
          .eq("viewer_id", currentUserId)
          .maybeSingle();

        // Valeur actuelle du like (depuis la DB)
        const currentHasLiked = existingInteraction?.has_liked || false;
        
        // Mettre à jour le state
        if (isMounted) {
          setHasLiked(currentHasLiked);
        }

        // Enregistrer la vue (Upsert) avec la valeur correcte
        try {
          await supabase.from("story_interactions").upsert(
            { 
              story_id: story.id, 
              viewer_id: currentUserId, 
              has_liked: currentHasLiked // ✅ Variable locale, pas le state (évite le stale closure)
            },
            { onConflict: "story_id,viewer_id" }
          );
        } catch (e) {
          console.warn("⚠️ Échec enregistrement vue :", e);
        }

        // Récupérer les données selon le rôle
        if (currentUserId === creatorId) {
          const { data } = await supabase
            .from("story_interactions")
            .select("has_liked, viewer_id, profiles(username, full_name, avatar_url)")
            .eq("story_id", story.id);
          
          if (isMounted && data) {
            setInteractions(data);
            setViewCount(data.length);
            setLikeCount(data.filter((i: any) => i.has_liked).length);
          }
        }
      }

      startTimer(story.media_type === "video");
    };

    loadCurrentStory();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    };
  }, [currentIndex, stories, isLoading, creatorId]);

  const startTimer = (isVideo: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
      timerRef.current = setInterval(() => {
        if (!isPaused && videoRef.current && !videoRef.current.paused) {
          const prog = videoRef.current.currentTime / (videoRef.current.duration || 1);
          setProgress(prog);
          if (prog >= 1) goToNextStory();
        }
      }, 50);
    } else {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Date.now() - startTime;
          const prog = Math.min(elapsed / 5000, 1); // 5 secondes pour image/texte
          setProgress(prog);
          if (prog >= 1) goToNextStory();
        }
      }, 50);
    }
  };

  const goToNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.back(); // Retour à la page précédente
    }
  };

  const goToPreviousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setProgress(0);
    }
  };

  const toggleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || stories.length === 0) return;
    
    const newLikeState = !hasLiked;
    setHasLiked(newLikeState);

    try {
      await supabase.from("story_interactions").upsert(
        { story_id: stories[currentIndex].id, viewer_id: user.id, has_liked: newLikeState },
        { onConflict: "story_id,viewer_id" }
      );
    } catch (e) {
      console.error("❌ Erreur like :", e);
      setHasLiked(!newLikeState);
    }
  };

  const handleTouchStart = () => {
    setIsPaused(true);
    if (videoRef.current) videoRef.current.pause();
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (videoRef.current && stories[currentIndex]?.media_type === "video") {
      videoRef.current.play();
    }
  };

  const getTextColorHex = (hexColor?: string) => {
    if (!hexColor) return "#FFFFFF";
    const cleanHex = hexColor.replace("#", "").toUpperCase();
    if (cleanHex === "FFFFFF" || cleanHex === "FBBF24") return "#000000";
    return "#FFFFFF";
  };

  const getStoryTime = (createdAt: string) => {
    if (!createdAt) return "À l'instant";
    try {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff > 3600) return `Il y a ${Math.floor(diff / 3600)}h`;
      if (diff > 60) return `Il y a ${Math.floor(diff / 60)}min`;
      return "À l'instant";
    } catch {
      return "À l'instant";
    }
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "#000000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #1F2937", borderTop: "4px solid #9333EA", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div style={{ backgroundColor: "#000000", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#FFFFFF", padding: "2rem", textAlign: "center" }}>
        <span style={{ fontSize: "3.75rem", marginBottom: "1rem" }}>📷</span>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Aucune story active</h2>
        <p style={{ color: "#9CA3AF", marginBottom: "1.5rem" }}>Ce créateur n'a pas publié de story dans les dernières 24h.</p>
        <button 
          onClick={() => router.back()} 
          style={{ padding: "0.5rem 1.5rem", backgroundColor: "#9333EA", borderRadius: "9999px", fontWeight: "bold", color: "#FFFFFF", border: "none", cursor: "pointer" }}
        >
          Retour
        </button>
      </div>
    );
  }

  const story = stories[currentIndex];
  const creatorName = creator?.full_name || creator?.username || "Utilisateur";

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: '#000000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Animation CSS pour le spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* 1. CONTENU DE LA STORY */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' }}>
        {story.media_type === "text" && story.text_content ? (
          <div 
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: story.background_color || "#8B5CF6" }}
          >
            <p style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', lineHeight: 1.75, color: getTextColorHex(story.background_color) }}>
              {story.text_content}
            </p>
          </div>
        ) : story.media_type === "video" && story.media_url ? (
          <video
            ref={videoRef}
            src={story.media_url}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            playsInline
            autoPlay
            onError={(e) => {
              console.error("❌ Erreur vidéo:", e);
              console.log("URL:", story.media_url);
            }}
          />
        ) : story.media_type === "image" && story.media_url ? (
          <img 
            src={story.media_url} 
            alt="Story" 
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              console.error("❌ Erreur image:", e);
              console.log("URL:", story.media_url);
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
            <div style={{ textAlign: 'center', color: '#FFFFFF', padding: '2rem' }}>
              <span style={{ fontSize: '3.75rem', marginBottom: '1rem', display: 'block' }}>⚠️</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Story non disponible</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                Type: {story.media_type || "inconnu"}<br/>
                URL: {story.media_url ? "Définie" : "Null"}<br/>
                Texte: {story.text_content || "Null"}
              </p>
              <button 
                onClick={() => router.back()}
                style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', backgroundColor: '#9333EA', borderRadius: '9999px', fontWeight: 'bold', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. OVERLAY SOMBRE (Dégradé) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.6) 100%)', zIndex: 10 }} />

      {/* 3. HEADER (Barres de progression + Infos) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1rem', paddingTop: '1.5rem', zIndex: 20 }}>
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
          {stories.map((_, index) => {
            const isActive = index === currentIndex;
            const isPast = index < currentIndex;
            return (
              <div key={index} style={{ flex: 1, height: '2px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div 
                  style={{ height: '100%', backgroundColor: '#FFFFFF', borderRadius: '9999px', transition: 'width 75ms linear', width: isPast ? '100%' : isActive ? `${progress * 100}%` : '0%' }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', backgroundColor: '#1F2937', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
            {creator?.avatar_url ? (
              <img src={creator.avatar_url} alt={creatorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.875rem' }}>👤</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creatorName}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>{getStoryTime(story.created_at)}</p>
          </div>
          <button onClick={() => router.back()} style={{ color: '#FFFFFF', padding: '0.25rem', backgroundColor: 'transparent', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 4. ZONE D'ACTION EN BAS */}
      <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 20, padding: '0 1rem' }}>
        {isCreator ? (
          <button 
            onClick={() => setShowStats(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '9999px', color: '#FFFFFF', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{viewCount} vues • {likeCount} J'aime</span>
          </button>
        ) : (
          <button 
            onClick={toggleLike}
            style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" height="32" 
              fill={hasLiked ? "#EF4444" : "none"}
              stroke={hasLiked ? "#EF4444" : "#FFFFFF"}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* 5. ZONES DE TAP (Gauche / Droite) */}
      <div 
        style={{ position: 'absolute', left: 0, top: 0, bottom: '6rem', width: '50%', zIndex: 30, cursor: 'pointer' }}
        onMouseDown={handleTouchStart} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        onClick={goToPreviousStory}
      />
      <div 
        style={{ position: 'absolute', right: 0, top: 0, bottom: '6rem', width: '50%', zIndex: 30, cursor: 'pointer' }}
        onMouseDown={handleTouchStart} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        onClick={goToNextStory}
      />

      {/* 6. MODAL DES STATS (Pour le créateur) */}
      {showStats && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setShowStats(false)}>
          <div 
            style={{ width: '100%', maxWidth: '28rem', backgroundColor: '#1A1A1A', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', padding: '1.25rem', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '2.5rem', height: '0.25rem', backgroundColor: '#374151', borderRadius: '9999px', margin: '0 auto 1.25rem auto' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Vues et J'aime ({viewCount} total)</h3>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {interactions.length === 0 ? (
                <p style={{ color: '#6B7280', textAlign: 'center', padding: '2rem 0' }}>Aucune vue pour le moment</p>
              ) : (
                interactions.map((interaction, idx) => {
                  const profile = interaction.profiles || {};
                  const name = profile.full_name || profile.username || "Utilisateur";
                  const avatar = profile.avatar_url;
                  const liked = interaction.has_liked;

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#1F2937', overflow: 'hidden', flexShrink: 0 }}>
                        {avatar ? (
                          <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>👤</div>
                        )}
                      </div>
                      <span style={{ color: '#FFFFFF', fontWeight: '600', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                      {liked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#EF4444" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#6B7280" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export avec Suspense pour gérer useSearchParams
export default function ViewStoryPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: "#000000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #1F2937", borderTop: "4px solid #9333EA", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <ViewStoryContent />
    </Suspense>
  );
}