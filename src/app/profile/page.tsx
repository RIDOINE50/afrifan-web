"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function MyProfileScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Statuts, 1 = Posts
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'rejected' | 'accepted'>('none');
  
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    pink: "#EC4899",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#10B981",
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 1. Profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      const currentProfile = profileData || {
        username: 'utilisateur',
        full_name: 'Nouvel Utilisateur',
        avatar_url: 'https://via.placeholder.com/150',
        role: 'user',
        is_verified: false,
      };
      setProfile(currentProfile);

      // 2. Statut de la demande créateur
      if (currentProfile.role === 'creator' && currentProfile.is_verified) {
        setApplicationStatus('accepted');
      } else {
        const { data: appData } = await supabase
          .from('creator_applications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        setApplicationStatus(appData?.status || 'none');
      }

      // 3. Posts et Stats
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, media_url, title, created_at, likes_count, views_count, media_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const userPosts = postsData || [];
      let likes = 0;
      let views = 0;
      userPosts.forEach((post: any) => {
        likes += (post.likes_count || 0);
        views += (post.views_count || 0);
      });
      setPosts(userPosts);
      setTotalLikes(likes);
      setTotalViews(views);

      // 4. Stories
      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, media_url, media_type, text_content, background_color, created_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      
      setStories(storiesData || []);

    } catch (error) {
      console.error("🚨 ERREUR CHARGEMENT PROFIL :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de l'upload de l'avatar
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;
      
      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Mettre à jour la table profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      alert("Photo mise à jour avec succès !");
    } catch (error) {
      console.error("🚨 ERREUR UPLOAD AVATAR :", error);
      alert("Échec de la mise à jour de la photo.");
    } finally {
      setIsUploading(false);
      // Reset input pour permettre de réuploader le même fichier si besoin
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreatorAction = () => {
    if (applicationStatus === 'accepted') {
      router.push("/creator/dashboard"); // À adapter selon ton chemin
    } else if (applicationStatus === 'pending') {
      alert("Votre demande est en cours de vérification. Veuillez patienter.");
    } else {
      router.push("/profile/activate"); // À adapter selon ton chemin (PersonalInfoStep)
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  const isCreator = profile?.is_verified && profile?.role === 'creator';

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, fontFamily: "Arial, sans-serif" }}>
      {/* Input fichier caché pour l'upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        
        {/* Header avec Paramètres */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <button 
            onClick={() => router.push("/settings")}
            style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: "8px" }}
          >
            ⚙️
          </button>
        </div>

        {/* Section Profil */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={handleAvatarClick}>
            {/* Bordure dégradée */}
            <div style={{
              width: "126px", height: "126px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.pink})`,
              padding: "3px",
              boxShadow: `0 5px 15px ${colors.primary}66`
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                backgroundColor: colors.bg,
                backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {!profile?.avatar_url && <span style={{ fontSize: "60px", color: colors.textMuted }}>👤</span>}
              </div>
            </div>
            
            {/* Icône Appareil Photo */}
            <div style={{
              position: "absolute", bottom: "5px", right: "5px",
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: colors.primary,
              border: `3px solid ${colors.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
            }}>
              📷
            </div>
            {isUploading && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "12px"
              }}>
                ...
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: "20px", gap: "8px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, letterSpacing: "1px" }}>
              {(profile?.full_name || 'UTILISATEUR').toUpperCase()}
            </h1>
            {isCreator && <span style={{ color: colors.primary, fontSize: "24px" }}>✔️</span>}
          </div>
          
          <p style={{ color: colors.textMuted, fontSize: "15px", margin: "6px 0 24px 0" }}>
            @{profile?.username || 'username'}
          </p>

          {/* Boutons d'action */}
          <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "400px" }}>
            <button
              onClick={handleCreatorAction}
              disabled={applicationStatus === 'pending'}
              style={{
                flex: 1, padding: "14px", border: "none", borderRadius: "12px",
                backgroundColor: applicationStatus === 'pending' ? colors.border : colors.primary,
                color: colors.text, fontWeight: "bold", fontSize: "13px",
                cursor: applicationStatus === 'pending' ? 'not-allowed' : 'pointer',
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {applicationStatus === 'accepted' && <span>📊</span>}
              {applicationStatus === 'pending' && <span>⏳</span>}
              {applicationStatus !== 'accepted' && applicationStatus !== 'pending' && <span>💰</span>}
              
              {applicationStatus === 'accepted' ? 'Tableau de bord' : 
               applicationStatus === 'pending' ? 'En cours...' : 'Activer le compte'}
            </button>

            <button
              onClick={() => router.push("/profile/edit")}
              style={{
                flex: 1, padding: "14px", border: `2px solid ${colors.primary}`, borderRadius: "12px",
                backgroundColor: "transparent", color: colors.text, fontWeight: "bold", fontSize: "13px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              ✏️ Modifier
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
          {[
            { value: formatCount(totalLikes), label: "Likes", icon: "❤️", color: colors.red },
            { value: posts.length.toString(), label: "Posts", icon: "📸", color: colors.blue },
            { value: formatCount(totalViews), label: "Vues", icon: "👁️", color: colors.green },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: "16px", backgroundColor: colors.card,
              borderRadius: "16px", border: `1px solid ${colors.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "8px"
            }}>
              <span style={{ fontSize: "24px" }}>{stat.icon}</span>
              <span style={{ color: colors.text, fontWeight: "bold", fontSize: "18px" }}>{stat.value}</span>
              <span style={{ color: colors.textMuted, fontSize: "12px" }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div style={{ 
          display: "flex", justifyContent: "center", gap: "60px", 
          padding: "16px 0", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`,
          marginBottom: "20px"
        }}>
          {['STATUTS', 'POSTS'].map((tab, index) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(index)}
              style={{
                background: "none", border: "none", color: selectedTab === index ? colors.text : colors.textMuted,
                fontWeight: selectedTab === index ? "bold" : "500", fontSize: "14px", letterSpacing: "1.2px",
                cursor: "pointer", position: "relative", paddingBottom: "8px"
              }}
            >
              {tab}
              {selectedTab === index && (
                <div style={{
                  position: "absolute", bottom: "0", left: "50%", transform: "translateX(-50%)",
                  width: "40px", height: "3px", backgroundColor: colors.primary, borderRadius: "2px"
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Contenu des Onglets */}
        {selectedTab === 0 ? (
          // ONGLET STATUTS
          <div>
            {stories.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ 
                  width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "50%", 
                  backgroundColor: `${colors.text}0D`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "48px"
                }}>📷</div>
                <h3 style={{ color: colors.text, fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>Partagez un moment éphémère</h3>
                <p style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "24px" }}>Votre statut disparaîtra après 24h.</p>
                <button 
                  onClick={() => router.push("/stories/create")}
                  style={{
                    padding: "12px 24px", backgroundColor: colors.primary, color: "white",
                    border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: "8px"
                  }}
                >
                  ➕ Créer un statut
                </button>
              </div>
            ) : (
              <div>
                <h4 style={{ color: colors.text, fontSize: "15px", fontWeight: "bold", marginBottom: "12px", paddingLeft: "8px" }}>
                  Vos statuts récents
                </h4>
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "12px" }}>
                  {/* Bouton Ajouter */}
                  <div 
                    onClick={() => router.push("/stories/create")}
                    style={{ minWidth: "65px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
                  >
                    <div style={{ 
                      width: "65px", height: "65px", borderRadius: "50%", border: `2px dashed ${colors.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: colors.text
                    }}>+</div>
                    <span style={{ color: colors.text, fontSize: "11px" }}>Ajouter</span>
                  </div>
                  
                  {/* Stories existantes */}
                  {stories.map((story: any) => (
                    <div 
                      key={story.id} 
                      onClick={() => router.push(`/stories/view?initialIndex=${stories.indexOf(story)}`)}
                      style={{ minWidth: "65px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
                    >
                      <div style={{
                        width: "65px", height: "65px", borderRadius: "50%", padding: "2px",
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.pink})`
                      }}>
                        <div style={{
                          width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${colors.bg}`,
                          backgroundColor: story.background_color || colors.card,
                          backgroundImage: story.media_url ? `url(${story.media_url})` : undefined,
                          backgroundSize: "cover", backgroundPosition: "center",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {story.media_type === 'text' && !story.media_url && <span style={{ fontSize: "28px" }}>📝</span>}
                        </div>
                      </div>
                      <span style={{ color: colors.text, fontSize: "11px" }}>Story</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ONGLET POSTS
          <div>
            {posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ 
                  width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "50%", 
                  backgroundColor: `${colors.text}0D`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "48px"
                }}>🖼️</div>
                <h3 style={{ color: colors.text, fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>Aucune publication.</h3>
                <p style={{ color: colors.textMuted, fontSize: "13px" }}>Partagez votre premier moment<br/>avec votre communauté.</p>
              </div>
            ) : (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: "8px" 
              }}>
                {posts.map((post: any) => (
                  <div 
                    key={post.id}
                    onClick={() => router.push(`/post/${post.id}`)}
                    style={{ 
                      aspectRatio: "3/4", borderRadius: "8px", overflow: "hidden", 
                      position: "relative", cursor: "pointer", backgroundColor: colors.card
                    }}
                  >
                    {post.media_url ? (
                      <img 
                        src={post.media_url} 
                        alt="Post" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>🖼️</div>
                    )}
                    
                    {/* Overlay sombre */}
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.2)" }} />
                    
                    {/* Icône Vidéo */}
                    {post.media_type === 'video' && (
                      <div style={{ position: "absolute", top: "6px", right: "6px", color: "white", fontSize: "20px" }}>
                        ▶️
                      </div>
                    )}
                    
                    {/* Stats en bas */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                      display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px",
                      color: "white", fontSize: "11px", fontWeight: "bold"
                    }}>
                      ❤️ {formatCount(post.likes_count || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
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