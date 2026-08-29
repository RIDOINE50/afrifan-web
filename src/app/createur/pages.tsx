"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ REMPLACE useParams PAR useSearchParams
import { supabase } from "@/lib/supabaseClient";

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function CreatorProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ UTILISE useSearchParams
  
  // ✅ RÉCUPÈRE L'ID DEPUIS L'URL (ex: /profile?id=12345)
  const creatorId = searchParams.get('id'); 

  const [user, setUser] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0); // 0=Posts, 1=Exclusifs, 2=À propos
  
  // Subscription
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  
  const isSubscribed = currentSubscription !== null;
  const isProSubscriber = currentSubscription?.tier_type === 'pro';
  const isPremiumSubscriber = currentSubscription?.tier_type === 'premium';

  // ... (LE RESTE DE TON CODE RESTE EXACTEMENT LE MÊME) ...

  const colors = {
    bg: "#0A0A0A", card: "#1A1A1A", border: "#2A2A2A",
    primary: "#8B5CF6", primaryHover: "#7C3AED", text: "#FFFFFF",
    textMuted: "#9CA3AF", danger: "#EF4444", pink: "#EC4899",
    violet: "#6D28D9", success: "#10B981",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
      await loadCreatorData();
    };
    init();
  }, [creatorId]);

  const loadCreatorData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadCreatorProfile(),
        loadCreatorPosts(),
        loadCreatorStories(),
        checkIfFollowing(),
        loadFollowersCount(),
        checkSubscriptionStatus(),
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
      .select('id, media_url, media_type, content, title, created_at, likes_count, comments_count')
      .eq('user_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    setPosts(data || []);
  };

  const loadCreatorStories = async () => {
    const { data } = await supabase
      .from('stories')
      .select('id, media_url, media_type, text_content, background_color, created_at')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: true });
    
    setStories(data || []);
  };

  const checkIfFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', creatorId)
      .maybeSingle();
    
    setIsFollowing(data !== null);
  };

  const loadFollowersCount = async () => {
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', creatorId);
    
    setFollowersCount(data?.length || 0);
  };

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('fan_id', user.id)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setCurrentSubscription(data);
      const endDate = new Date(data.end_date);
      const now = new Date();
      const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, days));
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
        setFollowersCount(prev => prev - 1);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: creatorId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("❌ Erreur follow:", error);
    }
  };

  const openStoryViewer = () => {
    if (stories.length === 0) return;
    router.push(`/stories/${creatorId}`);
  };

  const handleSubscribe = (tierType: 'premium' | 'pro', price: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push(`/subscribe/${creatorId}?tier=${tierType}&price=${price}`);
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
  const hasStories = stories.length > 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(135deg, #1a1a2e, #2d1b69)",
        height: "120px"
      }}>
        <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.back()} style={{
            backgroundColor: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
            width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: colors.text
          }}>
            ←
          </button>
          <button style={{
            background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer"
          }}>
            ⋮
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{ padding: "20px", marginTop: "-60px" }}>
        {/* Avatar et infos */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
          <div style={{ position: "relative" }}>
            <div onClick={hasStories ? openStoryViewer : undefined} style={{
              padding: hasStories ? "3px" : "0",
              borderRadius: "50%",
              background: hasStories ? `linear-gradient(135deg, ${colors.primary}, ${colors.pink})` : "transparent",
              cursor: hasStories ? "pointer" : "default"
            }}>
              <div style={{
                width: "100px", height: "100px", borderRadius: "50%",
                backgroundColor: colors.card,
                backgroundImage: creator.avatar_url ? `url(${creator.avatar_url})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "40px", color: colors.textMuted
              }}>
                {!creator.avatar_url && "👤"}
              </div>
            </div>
            <div style={{
              position: "absolute", bottom: "5px", right: "5px",
              width: "16px", height: "16px", borderRadius: "50%",
              backgroundColor: colors.success, border: `2px solid ${colors.bg}`
            }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                {creator.full_name || creator.username}
              </h1>
              {isVerified && <span style={{ color: colors.primary }}>✔️</span>}
            </div>
            <p style={{ color: colors.textMuted, margin: "2px 0", fontSize: "14px" }}>
              @{creator.username}
            </p>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <button onClick={toggleFollow} style={{
            flex: 2, padding: "12px", border: "none", borderRadius: "20px",
            backgroundColor: isFollowing ? colors.card : colors.primary,
            color: colors.text, fontWeight: "bold", cursor: "pointer", fontSize: "14px"
          }}>
            {isFollowing ? "Suivi" : "Suivre"}
          </button>
          <button style={{
            flex: 1, padding: "12px", border: `2px solid ${colors.primary}`,
            borderRadius: "20px", backgroundColor: "transparent",
            color: colors.primary, fontWeight: "bold", cursor: "pointer", fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
          }}>
            ☕ Tip
          </button>
        </div>

        {/* Message privé (si Pro) */}
        {isProSubscriber && (
          <button onClick={() => router.push(`/chat/${creatorId}`)} style={{
            width: "100%", padding: "12px", border: `1px solid ${colors.border}`,
            borderRadius: "20px", backgroundColor: "transparent",
            color: colors.text, cursor: "pointer", fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            marginBottom: "16px"
          }}>
             Message privé
          </button>
        )}

        {/* Bio */}
        {creator.bio && (
          <p style={{ color: colors.textMuted, fontSize: "14px", lineHeight: "1.4", marginBottom: "16px" }}>
            {creator.bio}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "16px 0", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, marginBottom: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ color: colors.primary }}>👥</span>
              <span style={{ fontWeight: "bold", fontSize: "14px" }}>{formatCount(followersCount)}</span>
            </div>
            <span style={{ color: colors.textMuted, fontSize: "11px" }}>Abonnés</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ color: colors.primary }}>📸</span>
              <span style={{ fontWeight: "bold", fontSize: "14px" }}>{formatCount(posts.length)}</span>
            </div>
            <span style={{ color: colors.textMuted, fontSize: "11px" }}>Posts</span>
          </div>
        </div>

        {/* Abonnements */}
        {isVerified && (premiumPrice > 0 || proPrice > 0) && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>Abonnements</h3>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px" }}>
              {premiumPrice > 0 && (
                <MembershipCard
                  badge="PREMIUM"
                  title="Fan"
                  price={premiumPrice}
                  features={["Accès à tous les posts", "Accès aux lives", "Contenu exclusif"]}
                  isPro={false}
                  currentTier={currentSubscription?.tier_type}
                  daysRemaining={daysRemaining}
                  onSubscribe={() => handleSubscribe('premium', premiumPrice)}
                  colors={colors}
                />
              )}
              {proPrice > 0 && (
                <MembershipCard
                  badge="PRO"
                  title="Membre VIP"
                  price={proPrice}
                  features={["Tout le contenu Premium", "Vidéos exclusives", "Messages privés", "Appels vidéo/audio"]}
                  isPro={true}
                  currentTier={currentSubscription?.tier_type}
                  daysRemaining={daysRemaining}
                  onSubscribe={() => handleSubscribe('pro', proPrice)}
                  colors={colors}
                />
              )}
            </div>
          </div>
        )}

        {/* Onglets */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "16px", borderBottom: `1px solid ${colors.border}` }}>
          {['POSTS', 'EXCLUSIFS', 'À PROPOS'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(index)}
              style={{
                background: "none", border: "none", color: selectedTab === index ? colors.text : colors.textMuted,
                fontWeight: selectedTab === index ? "bold" : "normal", fontSize: "12px",
                paddingBottom: "8px", cursor: "pointer", position: "relative"
              }}
            >
              {tab}
              {selectedTab === index && (
                <div style={{
                  position: "absolute", bottom: "-1px", left: 0, right: 0,
                  height: "2px", backgroundColor: colors.primary
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Grille de posts */}
        {selectedTab === 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px"
          }}>
            {posts.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: colors.textMuted }}>
                <p>Aucune publication</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isSubscribed={isSubscribed}
                  colors={colors}
                  onClick={() => router.push(`/post/${post.id}`)}
                />
              ))
            )}
          </div>
        )}

        {selectedTab === 1 && (
          <div style={{ textAlign: "center", padding: "40px", color: colors.textMuted }}>
            <p>Contenu exclusif réservé aux abonnés</p>
          </div>
        )}

        {selectedTab === 2 && (
          <div style={{ padding: "20px", backgroundColor: colors.card, borderRadius: "12px" }}>
            <h4 style={{ marginBottom: "12px" }}>À propos</h4>
            <p style={{ color: colors.textMuted, fontSize: "14px" }}>
              Membre depuis : {new Date(creator.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Composant Carte d'abonnement
function MembershipCard({ badge, title, price, features, isPro, currentTier, daysRemaining, onSubscribe, colors }: any) {
  const isCurrentTier = currentTier === (isPro ? 'pro' : 'premium');
  const isDowngradeBlocked = currentTier === 'pro' && !isPro;
  
  let buttonText = 'Rejoindre';
  let isButtonEnabled = true;
  let buttonColor = isPro ? colors.text : colors.primary;
  
  if (isCurrentTier) {
    buttonText = `Déjà abonné (${daysRemaining} jours)`;
    isButtonEnabled = false;
    buttonColor = colors.card;
  } else if (isDowngradeBlocked) {
    buttonText = 'Disponible après période Pro';
    isButtonEnabled = false;
    buttonColor = colors.card;
  }

  return (
    <div style={{
      minWidth: "240px", padding: "16px", borderRadius: "16px",
      background: isPro ? `linear-gradient(135deg, ${colors.primary}, ${colors.violet})` : colors.card,
      border: `2px solid ${isPro ? colors.primary : colors.border}`
    }}>
      <div style={{
        display: "inline-block", padding: "4px 8px", borderRadius: "8px",
        backgroundColor: isPro ? "rgba(255,255,255,0.2)" : `${colors.primary}33`,
        fontSize: "9px", fontWeight: "bold", marginBottom: "12px",
        color: isPro ? colors.text : colors.primary
      }}>
        {badge}
      </div>
      
      <h4 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{title}</h4>
      
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "24px", fontWeight: "bold" }}>{price.toFixed(0)}</span>
        <span style={{ color: colors.textMuted, fontSize: "11px" }}> FCFA /mois</span>
      </div>
      
      <ul style={{ margin: "0 0 16px 0", padding: "0", listStyle: "none" }}>
        {features.map((feature: string, i: number) => (
          <li key={i} style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: isPro ? colors.text : colors.primary }}>✓</span> {feature}
          </li>
        ))}
      </ul>
      
      <button
        onClick={isButtonEnabled ? onSubscribe : undefined}
        disabled={!isButtonEnabled}
        style={{
          width: "100%", padding: "10px", border: "none", borderRadius: "12px",
          backgroundColor: buttonColor, color: isButtonEnabled ? (isPro ? colors.primary : colors.text) : colors.textMuted,
          fontWeight: "bold", fontSize: "11px", cursor: isButtonEnabled ? "pointer" : "not-allowed"
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

// Composant Carte de Post
function PostCard({ post, isSubscribed, colors, onClick }: any) {
  const isLocked = !isSubscribed;
  
  return (
    <div onClick={onClick} style={{
      aspectRatio: "3/4", borderRadius: "12px", overflow: "hidden",
      backgroundColor: colors.card, cursor: "pointer", position: "relative"
    }}>
      {post.media_url ? (
        <>
          <img
            src={post.media_url}
            alt={post.title || "Post"}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: isLocked ? "blur(15px)" : "none"
            }}
          />
          {isLocked && (
            <div style={{
              position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "8px"
              }}>
                🔒
              </div>
              <span style={{ fontSize: "10px", fontWeight: "bold" }}>Abonné</span>
            </div>
          )}
        </>
      ) : (
        <div style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", color: colors.textMuted
        }}>
          📷
        </div>
      )}
      
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "8px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))"
      }}>
        {post.title && (
          <p style={{ fontSize: "11px", fontWeight: "bold", margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {post.title}
          </p>
        )}
        <p style={{ fontSize: "10px", color: colors.primary, margin: 0 }}>
          ❤️ {formatCount(post.likes_count || 0)}
        </p>
      </div>
      
      {post.media_type === 'video' && !isLocked && (
        <div style={{
          position: "absolute", top: "8px", right: "8px",
          width: "24px", height: "24px", borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          ▶️
        </div>
      )}
    </div>
  );
}