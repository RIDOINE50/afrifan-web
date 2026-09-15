"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// ==========================================
// ✅ VRAIES ICÔNES SVG PROFESSIONNELLES
// ==========================================
const Icon = ({ path, size = 20, className = "", fill = "none" }: { path: React.ReactNode; size?: number; className?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const Icons = {
  User: (props: any) => <Icon {...props} path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  Camera: (props: any) => <Icon {...props} path={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>} />,
  LayoutDashboard: (props: any) => <Icon {...props} path={<><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>} />,
  Clock: (props: any) => <Icon {...props} path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />,
  Crown: (props: any) => <Icon {...props} path={<><path d="M2 20h20M4 17l2-10 4 5 2-7 2 7 4-5 2 10" /></>} />,
  Pencil: (props: any) => <Icon {...props} path={<><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></>} />,
  Heart: (props: any) => <Icon {...props} path={<><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></>} />,
  Image: (props: any) => <Icon {...props} path={<><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>} />,
  Eye: (props: any) => <Icon {...props} path={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>} />,
  Plus: (props: any) => <Icon {...props} path={<><path d="M5 12h14" /><path d="M12 5v14" /></>} />,
  FileText: (props: any) => <Icon {...props} path={<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>} />,
  Play: (props: any) => <Icon {...props} fill="currentColor" path={<><polygon points="5 3 19 12 5 21 5 3" /></>} />,
  X: (props: any) => <Icon {...props} path={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} />,
  Star: (props: any) => <Icon {...props} path={<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>} />,
  Users: (props: any) => <Icon {...props} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  Radio: (props: any) => <Icon {...props} path={<><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" /></>} />,
  ShoppingBag: (props: any) => <Icon {...props} path={<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>} />,
  Download: (props: any) => <Icon {...props} path={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></>} />,
  Settings: (props: any) => <Icon {...props} path={<><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>} />,
  Menu: (props: any) => <Icon {...props} path={<><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></>} />,
};

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export default function MyProfileScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDark, theme } = useAppTheme();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'rejected' | 'accepted'>('none');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false); // ✅ NOUVEAU : Pour le menu de la photo de profil
  
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    pink: "#EC4899",
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

      const { data: postsData } = await supabase
        .from('posts')
        .select('id, media_url, title, content, caption, background_color, created_at, likes_count, views_count, media_type')
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

  // ✅ MODIFIÉ : Ouvre le menu au lieu d'ouvrir directement le sélecteur de fichier
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAvatarMenu(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      // Remplacement de l'alerte par une mise à jour silencieuse et propre
    } catch (error) {
      console.error("🚨 ERREUR UPLOAD AVATAR :", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowAvatarMenu(false);
    }
  };

  const handleCreatorAction = () => {
    if (applicationStatus === 'accepted') {
      router.push("/creator/dashboard");
    } else if (applicationStatus === 'pending') {
      alert("Votre demande est en cours de vérification par notre équipe. Veuillez patienter.");
    } else {
      router.push("/creator/activate/step-1"); 
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

  const menuItems = [
    { icon: <Icons.Star size={22} />, label: "Abonnements", path: "/abonnements" },
    { icon: <Icons.Users size={22} />, label: "Suivis", path: "/suivis" },
    { icon: <Icons.Radio size={22} />, label: "Live", path: "/live" },
    { icon: <Icons.ShoppingBag size={22} />, label: "Mes Achats", path: "/mes-achats" },
    { icon: <Icons.Download size={22} />, label: "Mes Téléchargements", path: "/downloads" },
    { icon: <Icons.Settings size={22} />, label: "Paramètres", path: "/settings" },
  ];

  return (
    <div className="profile-container" onClick={() => setShowAvatarMenu(false)}>
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleFileChange} />

      {isMenuOpen && (
        <div 
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 2000, backdropFilter: "blur(4px)" }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* MENU LATÉRAL */}
      <div style={{
        position: "fixed", top: 0, right: isMenuOpen ? 0 : "-320px", width: "300px", height: "100vh",
        backgroundColor: colors.card, zIndex: 2001, transition: "right 0.3s ease-in-out",
        borderLeft: `1px solid ${colors.border}`, padding: "24px", display: "flex", flexDirection: "column",
        boxShadow: isDark ? "-5px 0 25px rgba(0,0,0,0.5)" : "-5px 0 25px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h2 style={{ color: colors.text, fontSize: "20px", fontWeight: "bold" }}>Menu</h2>
          <button onClick={() => setIsMenuOpen(false)} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", lineHeight: 1, display: "flex" }}>
            <Icons.X size={28} />
          </button>
        </div>

        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => { router.push(item.path); setIsMenuOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "16px", padding: "16px",
              backgroundColor: "transparent", border: "none", color: colors.text,
              fontSize: "16px", cursor: "pointer", borderRadius: "12px", textAlign: "left",
              marginBottom: "8px", transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="profile-content">
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button 
            onClick={() => setIsMenuOpen(true)}
            style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" }}
          >
            <Icons.Menu size={28} />
          </button>
          
          <button 
            onClick={() => router.push("/settings")}
            style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: "8px", display: "flex", alignItems: "center" }}
          >
            <Icons.Settings size={24} />
          </button>
        </div>

        {/* Section Profil */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={handleAvatarClick}>
            <div style={{
              width: "126px", height: "126px", borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.pink})`,
              padding: "3px",
              boxShadow: `0 5px 15px rgba(0,0,0,0.2)`
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                backgroundColor: colors.bg,
                backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {!profile?.avatar_url && <Icons.User size={60} className="" style={{ color: colors.textMuted }} />}
              </div>
            </div>
            
            {/* Icône Camera */}
            <div style={{
              position: "absolute", bottom: "5px", right: "5px",
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: colors.primary,
              border: `3px solid ${colors.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
            }}>
              <Icons.Camera size={18} fill="white" stroke="none" />
            </div>

            {/* ✅ NOUVEAU : Menu contextuel pour la photo de profil */}
            {showAvatarMenu && (
              <div style={{
                position: "absolute", top: "140px", right: "0",
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                zIndex: 100,
                overflow: "hidden",
                minWidth: "180px"
              }} onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => { 
                    if (profile?.avatar_url) window.open(profile.avatar_url, '_blank'); 
                    setShowAvatarMenu(false); 
                  }} 
                  style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "transparent", border: "none", borderBottom: `1px solid ${colors.border}`, color: colors.text, cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
                >
                  <Icons.Eye size={18} /> Voir la photo
                </button>
                <button 
                  onClick={() => { 
                    fileInputRef.current?.click(); 
                  }} 
                  style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "transparent", border: "none", color: colors.text, cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
                >
                  <Icons.Camera size={18} /> Changer la photo
                </button>
              </div>
            )}

            {isUploading && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "12px"
              }}>
                <div style={{ width: "20px", height: "20px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: "20px", gap: "8px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, letterSpacing: "1px" }}>
              {(profile?.full_name || 'UTILISATEUR').toUpperCase()}
            </h1>
            {isCreator && <Icons.Star size={24} fill={colors.primary} stroke="none" />}
          </div>
          
          <p style={{ color: colors.textMuted, fontSize: "15px", margin: "6px 0 24px 0" }}>
            @{profile?.username || 'username'}
          </p>

          <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "400px" }}>
            <button
              onClick={handleCreatorAction}
              disabled={applicationStatus === 'pending'}
              style={{
                flex: 1, padding: "14px", border: "none", borderRadius: "12px",
                backgroundColor: applicationStatus === 'pending' ? colors.border : colors.primary,
                color: applicationStatus === 'pending' ? colors.textMuted : colors.primaryText,
                fontWeight: "bold", fontSize: "13px",
                cursor: applicationStatus === 'pending' ? 'not-allowed' : 'pointer',
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {applicationStatus === 'accepted' && <Icons.LayoutDashboard size={16} />}
              {applicationStatus === 'pending' && <Icons.Clock size={16} />}
              {applicationStatus !== 'accepted' && applicationStatus !== 'pending' && <Icons.Crown size={16} />}
              {applicationStatus === 'accepted' ? 'Tableau de bord' : applicationStatus === 'pending' ? 'En cours...' : 'Activer le compte'}
            </button>

            <button
              onClick={() => router.push("/settings/personal-info")}
              style={{
                flex: 1, padding: "14px", border: `2px solid ${colors.primary}`, borderRadius: "12px",
                backgroundColor: "transparent", color: colors.text, fontWeight: "bold", fontSize: "13px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              <Icons.Pencil size={16} /> Modifier
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
          {[
            { value: formatCount(totalLikes), label: "Likes", icon: <Icons.Heart size={24} fill={colors.red} stroke="none" /> },
            { value: posts.length.toString(), label: "Posts", icon: <Icons.Image size={24} color={colors.blue} /> },
            { value: formatCount(totalViews), label: "Vues", icon: <Icons.Eye size={24} color={colors.green} /> },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: "16px", backgroundColor: colors.card,
              borderRadius: "16px", border: `1px solid ${colors.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "8px"
            }}>
              <span style={{ display: "flex" }}>{stat.icon}</span>
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
          <div>
            {stories.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "50%", backgroundColor: colors.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.Image size={48} color={colors.textMuted} />
                </div>
                <h3 style={{ color: colors.text, fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>Partagez un moment éphémère</h3>
                <p style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "24px" }}>Votre statut disparaîtra après 24h.</p>
                <button onClick={() => router.push("/stories/create")} style={{ padding: "12px 24px", backgroundColor: colors.primary, color: colors.primaryText, border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Icons.Plus size={16} /> Créer un statut
                </button>
              </div>
            ) : (
              <div>
                <h4 style={{ color: colors.text, fontSize: "15px", fontWeight: "bold", marginBottom: "12px", paddingLeft: "8px" }}>Vos statuts récents</h4>
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "12px" }}>
                  <div onClick={() => router.push("/stories/create")} style={{ minWidth: "65px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <div style={{ width: "65px", height: "65px", borderRadius: "50%", border: `2px dashed ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.text }}>
                      <Icons.Plus size={28} />
                    </div>
                    <span style={{ color: colors.text, fontSize: "11px" }}>Ajouter</span>
                  </div>
                  {stories.map((story: any) => (
                    <div key={story.id} onClick={() => router.push(`/stories/view?creatorId=${user.id}&storyId=${story.id}`)} style={{ minWidth: "65px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <div style={{ width: "65px", height: "65px", borderRadius: "50%", padding: "2px", background: `linear-gradient(135deg, ${colors.primary}, ${colors.pink})` }}>
                        <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${colors.bg}`, overflow: "hidden" }}>
                          {/* ✅ CORRECTION 1 : Affichage du texte à l'intérieur du cercle de story */}
                          {story.media_type === 'text' ? (
                            <div style={{ 
                              width: "100%", height: "100%", 
                              backgroundColor: story.background_color || colors.primary,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              padding: "6px", boxSizing: "border-box"
                            }}>
                              <span style={{
                                color: "#FFFFFF", fontSize: "10px", fontWeight: "bold",
                                textAlign: "center", lineHeight: "1.2",
                                overflow: "hidden", textOverflow: "ellipsis", 
                                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical"
                              }}>
                                {story.text_content || "Texte"}
                              </span>
                            </div>
                          ) : (
                            <div style={{ 
                              width: "100%", height: "100%", 
                              backgroundColor: colors.card, 
                              backgroundImage: story.media_url ? `url(${story.media_url})` : undefined, 
                              backgroundSize: "cover", backgroundPosition: "center", 
                              display: "flex", alignItems: "center", justifyContent: "center" 
                            }}>
                              {!story.media_url && <Icons.FileText size={24} color={colors.textMuted} />}
                            </div>
                          )}
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
          <div>
            {posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ width: "80px", height: "80px", margin: "0 auto 16px", borderRadius: "50%", backgroundColor: colors.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icons.Image size={48} color={colors.textMuted} />
                </div>
                <h3 style={{ color: colors.text, fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>Aucune publication.</h3>
                <p style={{ color: colors.textMuted, fontSize: "13px" }}>Partagez votre premier moment<br/>avec votre communauté.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {posts.map((post: any) => (
                  <div key={post.id} onClick={() => router.push(`/post/${post.id}`)} style={{ aspectRatio: "3/4", borderRadius: "8px", overflow: "hidden", position: "relative", cursor: "pointer", backgroundColor: colors.card }}>
                    
                    {/* ✅ CORRECTION 2 : Affichage du texte à l'intérieur de la grille des posts */}
                    {post.media_type === 'text' ? (
                      <div style={{ 
                        width: "100%", height: "100%", 
                        backgroundColor: post.background_color || (isDark ? "#2D3748" : "#E2E8F0"),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "12px", boxSizing: "border-box"
                      }}>
                        <span style={{
                          color: isDark ? "#FFFFFF" : "#000000", fontSize: "13px", fontWeight: "bold",
                          textAlign: "center", lineHeight: "1.4",
                          overflow: "hidden", textOverflow: "ellipsis", 
                          display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical"
                        }}>
                          {post.content || post.caption || "Texte"}
                        </span>
                      </div>
                    ) : post.media_url ? (
                      <img src={post.media_url} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}>
                        <Icons.Image size={32} />
                      </div>
                    )}

                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.2)" }} />
                    {post.media_type === 'video' && (
                      <div style={{ position: "absolute", top: "6px", right: "6px", display: "flex" }}>
                        <Icons.Play size={20} fill="white" stroke="none" />
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", color: "white", fontSize: "11px", fontWeight: "bold" }}>
                      <Icons.Heart size={12} fill="white" stroke="none" /> {formatCount(post.likes_count || 0)}
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

        .profile-container {
          min-height: 100vh;
          background-color: ${colors.bg};
          color: ${colors.text};
          font-family: Arial, sans-serif;
        }

        .profile-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}