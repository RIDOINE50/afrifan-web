"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TipDialog from "@/components/TipDialog";

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

function CreatorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get('id');

  const [user, setUser] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [hasActiveStories, setHasActiveStories] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  
  const isSubscribed = currentSubscription !== null;
  const isProSubscriber = currentSubscription?.tier_type === 'pro';
  const isPremiumSubscriber = currentSubscription?.tier_type === 'premium';

  const colors = {
    bg: "#000000",
    card: "#121212",
    border: "#2F2F2F",
    primary: "#8B5CF6",
    primaryHover: "#7C3AED",
    text: "#FFFFFF",
    textMuted: "#A1A1A1",
    success: "#10B981",
  };

  // ✅ CORRECTION DÉFINITIVE : Si je visite mon propre profil via cette page publique, 
  // on me redirige immédiatement vers mon vrai tableau de bord éditable (/profile).
  useEffect(() => {
    if (user && creatorId && user.id === creatorId) {
      router.replace("/profile");
    }
  }, [user, creatorId, router]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
        if (creatorId) await loadCreatorData(session.user);
      } else {
        setUser(null);
        if (creatorId) await loadCreatorData(null);
      }
    };
    init();
  }, [creatorId]);

  const loadCreatorData = async (currentUser: any) => {
    setIsLoading(true);
    try {
      await Promise.allSettled([
        loadCreatorProfile(),
        loadCreatorPosts(),
        loadCreatorStories(),
        checkIfFollowing(currentUser),
        loadFollowersCount(),
        checkSubscriptionStatus(currentUser),
      ]);
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCreatorProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, is_verified, premium_price, pro_price')
      .eq('id', creatorId)
      .maybeSingle();
    if (data) setCreator(data);
  };

  const loadCreatorPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, media_url, media_type, caption, title, created_at, likes_count, comments_count')
      .eq('user_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (data) {
      setPosts(data);
      setPostsCount(data.length);
    }
  };

  const loadCreatorStories = async () => {
    const { data } = await supabase
      .from('stories')
      .select('id, media_url, media_type, text_content, background_color, created_at')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setStories(data);
      setHasActiveStories(data.length > 0);
    }
  };

  const checkIfFollowing = async (currentUser: any) => {
    if (!currentUser || !creatorId) return;
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', creatorId)
      .maybeSingle();
    
    if (!error) setIsFollowing(data !== null);
  };

  const loadFollowersCount = async () => {
    if (!creatorId) return;
    const { data, error, count } = await supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', creatorId);
    
    if (!error) setFollowersCount(count || 0);
  };

  const checkSubscriptionStatus = async (currentUser: any) => {
    if (!currentUser || !creatorId) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('fan_id', currentUser.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur vérif abonnement:", error);
        return;
      }

      if (data) {
        const endDate = new Date(data.end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        let calculatedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (calculatedDays < 0) calculatedDays = 0;

        setCurrentSubscription(data);
        setDaysRemaining(calculatedDays);
      } else {
        setCurrentSubscription(null);
        setDaysRemaining(0);
      }
    } catch (e) {
      console.error("❌ Erreur exception abonnement:", e);
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', creatorId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("❌ Erreur follow:", error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.text }}>
        <p>Créateur introuvable</p>
      </div>
    );
  }

  const isVerified = creator.is_verified === true;
  const premiumPrice = creator.premium_price || 0;
  const proPrice = creator.pro_price || 0;
  const creatorDisplayName = creator.full_name || creator.username;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      <div style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}`, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1000px", margin: "0 auto" }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.text }}>←</button>
          <span style={{ fontWeight: "bold", fontSize: "16px" }}>{creator.username}</span>
          <button style={{ background: "none", border: "none", color: colors.text, fontSize: "20px", cursor: "pointer", padding: "4px" }}>⋮</button>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 16px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div 
                onClick={hasActiveStories ? () => router.push(`/stories/view?creatorId=${creatorId}`) : undefined}
                style={{ 
                  padding: hasActiveStories ? "3px" : "0", 
                  borderRadius: "50%", 
                  background: hasActiveStories ? `linear-gradient(135deg, ${colors.primary}, #EC4899)` : "transparent", 
                  cursor: hasActiveStories ? "pointer" : "default" 
                }}
              >
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: colors.card, overflow: "hidden", border: `2px solid ${colors.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: colors.textMuted }}>
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '👤'; }} />
                  ) : "👤"}
                </div>
              </div>
              <div style={{ position: "absolute", bottom: "4px", right: "4px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: colors.success, border: `2px solid ${colors.bg}` }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>{creatorDisplayName}</h1>
                {isVerified && <span style={{ color: colors.primary, fontSize: "18px" }}>✓</span>}
              </div>
              <p style={{ color: colors.textMuted, margin: "0 0 16px 0", fontSize: "14px" }}>@{creator.username}</p>
              
              <div className="profile-stats" style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>{formatCount(followersCount)}</div>
                  <div style={{ color: colors.textMuted, fontSize: "13px" }}>Abonnés</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>{formatCount(postsCount)}</div>
                  <div style={{ color: colors.textMuted, fontSize: "13px" }}>Posts</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button 
                    onClick={toggleFollow}
                    style={{ flex: 2, padding: "12px", border: "none", borderRadius: "20px", backgroundColor: isFollowing ? colors.card : colors.primary, color: colors.text, fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
                  >
                    {isFollowing ? "Suivi" : "Suivre"}
                  </button>
                  <button 
                    onClick={() => setShowTipModal(true)}
                    style={{ flex: 1, padding: "12px", border: `1px solid ${colors.primary}`, borderRadius: "20px", backgroundColor: "transparent", color: colors.primary, fontWeight: "600", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    ☕ Tip
                  </button>
                </div>

                {isProSubscriber && (
                  <button 
                    onClick={() => router.push(`/messages?to=${creatorId}`)} 
                    style={{ width: "100%", padding: "12px", border: `1px solid ${colors.border}`, borderRadius: "20px", backgroundColor: colors.card, color: colors.text, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    💬 Message privé
                  </button>
                )}
              </div>
            </div>
          </div>

          {creator.bio && (
            <p style={{ color: colors.text, fontSize: "14px", lineHeight: "1.5", margin: 0 }}>{creator.bio}</p>
          )}
        </div>

        {(premiumPrice > 0 || proPrice > 0) && (
          <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: colors.card, borderRadius: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>
              {isSubscribed ? '💎 Votre abonnement' : '💎 Devenir abonné'}
            </h3>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
              {premiumPrice > 0 && (
                <SubscriptionCard 
                  badge="PREMIUM" title="Fan" price={premiumPrice} 
                  features={["Accès à tous les posts", "Accès aux lives", "Contenu exclusif"]} 
                  isPro={false} 
                  currentTier={currentSubscription?.tier_type} 
                  daysRemaining={daysRemaining} 
                  onSubscribe={() => router.push(`/subscribe/${creatorId}?tier=premium&price=${premiumPrice}&name=${encodeURIComponent(creatorDisplayName)}`)} 
                  colors={colors} 
                />
              )}
              {proPrice > 0 && (
                <SubscriptionCard 
                  badge="PRO" title="Membre VIP" price={proPrice} 
                  features={["Tout le contenu Premium", "Vidéos exclusives", "Messages privés", "Appels vidéo/audio"]} 
                  isPro={true} 
                  currentTier={currentSubscription?.tier_type} 
                  daysRemaining={daysRemaining} 
                  onSubscribe={() => router.push(`/subscribe/${creatorId}?tier=pro&price=${proPrice}&name=${encodeURIComponent(creatorDisplayName)}`)} 
                  colors={colors} 
                />
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, marginBottom: "16px" }}>
          {['POSTS', 'EXCLUSIFS', 'À PROPOS'].map((tab, index) => (
            <button 
              key={tab} 
              onClick={() => setSelectedTab(index)} 
              style={{ flex: 1, background: "none", border: "none", color: selectedTab === index ? colors.text : colors.textMuted, fontWeight: selectedTab === index ? "600" : "400", fontSize: "13px", padding: "12px 8px", cursor: "pointer", position: "relative", borderBottom: selectedTab === index ? `2px solid ${colors.primary}` : "2px solid transparent", marginBottom: "-1px", letterSpacing: "0.5px" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {selectedTab === 0 && (
          <div className="posts-grid">
            {posts.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📷</div>
                <p>Aucune publication pour le moment</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} isSubscribed={isSubscribed} colors={colors} onClick={() => router.push(`/post/${post.id}?creatorId=${creatorId}`)} />
              ))
            )}
          </div>
        )}

        {selectedTab === 1 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <p>Contenu exclusif réservé aux abonnés</p>
            {!isSubscribed && (
              <button onClick={() => router.push(`/subscribe/${creatorId}?tier=premium&price=${premiumPrice}&name=${encodeURIComponent(creatorDisplayName)}`)} style={{ marginTop: "16px", padding: "10px 24px", backgroundColor: colors.primary, border: "none", borderRadius: "20px", color: colors.text, fontWeight: "600", cursor: "pointer" }}>
                S'abonner maintenant
              </button>
            )}
          </div>
        )}

        {selectedTab === 2 && (
          <div style={{ padding: "20px", backgroundColor: colors.card, borderRadius: "12px" }}>
            <h4 style={{ marginBottom: "16px", fontWeight: "bold" }}>À propos</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: colors.textMuted, fontSize: "14px" }}>
              <div><span style={{ color: colors.text }}>Nom:</span> {creatorDisplayName}</div>
              <div><span style={{ color: colors.text }}>Identifiant:</span> @{creator.username}</div>
              {creator.bio && (
                <div>
                  <span style={{ color: colors.text }}>Bio:</span>
                  <p style={{ marginTop: "4px", color: colors.text, lineHeight: "1.5" }}>{creator.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showTipModal && creatorId && (
        <TipDialog 
          creatorId={creatorId} 
          creatorName={creatorDisplayName} 
          onClose={() => setShowTipModal(false)} 
          onSuccess={() => console.log("Pourboire envoyé avec succès !")} 
        />
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .posts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
        @media (min-width: 768px) { .posts-grid { grid-template-columns: repeat(4, 1fr); gap: 8px; } }
        @media (min-width: 1024px) { .posts-grid { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 768px) { .profile-stats { gap: 16px !important; } .profile-stats > div { font-size: 14px !important; } }
      `}</style>
    </div>
  );
}

// --- Composants Internes ---
function SubscriptionCard({ badge, title, price, features, isPro, currentTier, daysRemaining, onSubscribe, colors }: any) {
  const isCurrentTier = currentTier === (isPro ? 'pro' : 'premium');
  const isDowngradeBlocked = currentTier === 'pro' && !isPro;
  
  let buttonText = 'Rejoindre';
  let isButtonEnabled = true;
  let buttonColor = isPro ? colors.text : colors.primary;
  let textColor = isPro ? colors.primary : colors.text;

  if (isCurrentTier) {
    buttonText = `Déjà abonné (${daysRemaining}j)`;
    isButtonEnabled = false;
    buttonColor = colors.border;
    textColor = colors.textMuted;
  } else if (isDowngradeBlocked) {
    buttonText = 'Attendre la fin de la période Pro';
    isButtonEnabled = false;
    buttonColor = colors.border;
    textColor = colors.textMuted;
  } else if (currentTier === 'premium' && isPro) {
    buttonText = 'Passer à Pro';
    isButtonEnabled = true;
    buttonColor = colors.text;
    textColor = colors.primary;
  }

  return (
    <div style={{ minWidth: "220px", flex: "1 1 220px", padding: "16px", borderRadius: "12px", background: isPro ? `linear-gradient(135deg, ${colors.primary}, #6D28D9)` : colors.card, border: `1px solid ${isPro ? colors.primary : colors.border}` }}>
      <div style={{ display: "inline-block", padding: "4px 8px", borderRadius: "6px", backgroundColor: isPro ? "rgba(255,255,255,0.2)" : `${colors.primary}33`, fontSize: "10px", fontWeight: "bold", marginBottom: "12px", color: isPro ? colors.text : colors.primary }}>{badge}</div>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>{title}</h4>
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "22px", fontWeight: "bold" }}>{price}</span>
        <span style={{ color: colors.textMuted, fontSize: "12px" }}> FCFA /mois</span>
      </div>
      <ul style={{ margin: "0 0 16px 0", padding: "0", listStyle: "none" }}>
        {features.map((feature: string, i: number) => (
          <li key={i} style={{ fontSize: "12px", color: isPro ? "rgba(255,255,255,0.9)" : colors.textMuted, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: isPro ? colors.text : colors.primary, fontSize: "14px" }}>✓</span> {feature}
          </li>
        ))}
      </ul>
      <button onClick={isButtonEnabled ? onSubscribe : undefined} disabled={!isButtonEnabled} style={{ width: "100%", padding: "10px", border: "none", borderRadius: "8px", backgroundColor: buttonColor, color: textColor, fontWeight: "bold", fontSize: "13px", cursor: isButtonEnabled ? "pointer" : "not-allowed", transition: "opacity 0.2s" }}>
        {buttonText}
      </button>
    </div>
  );
}

function PostCard({ post, isSubscribed, colors, onClick }: any) {
  const isLocked = !isSubscribed;
  const displayText = post.title || post.caption || "";
  
  return (
    <div onClick={onClick} style={{ aspectRatio: "3/4", borderRadius: "8px", overflow: "hidden", backgroundColor: colors.card, cursor: "pointer", position: "relative", transition: "transform 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {post.media_url ? (
        <>
          <img src={post.media_url} alt={displayText || "Post"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: isLocked ? "blur(15px)" : "none" }} loading="lazy" />
          {isLocked && (
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px" }}>🔒</div>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "white" }}>Abonné</span>
            </div>
          )}
        </>
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, fontSize: "32px" }}>📷</div>
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
        {displayText && <p style={{ fontSize: "11px", fontWeight: "bold", margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "white" }}>{displayText}</p>}
        <p style={{ fontSize: "11px", color: colors.primary, margin: 0, fontWeight: "600" }}>❤️ {formatCount(post.likes_count || 0)}</p>
      </div>
      {post.media_type === 'video' && !isLocked && (
        <div style={{ position: "absolute", top: "8px", right: "8px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "white", fontSize: "12px" }}>▶</span>
        </div>
      )}
    </div>
  );
}

export default function CreatorProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid #2F2F2F`, borderTop: `4px solid #8B5CF6`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    }>
      <CreatorProfileContent />
    </Suspense>
  );
}