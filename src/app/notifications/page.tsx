"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// === ICÔNES SVG ===
const SvgIcon = ({ path, size = 20, color = "currentColor", fill = "none" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const Icons = {
  User:      (p: any) => <SvgIcon {...p} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  Mail:      (p: any) => <SvgIcon {...p} path={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>} />,
  Image:     (p: any) => <SvgIcon {...p} path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>} />,
  Check:     (p: any) => <SvgIcon {...p} path={<><polyline points="20 6 9 17 4 12" /></>} />,
  X:         (p: any) => <SvgIcon {...p} path={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} />,
  Alert:     (p: any) => <SvgIcon {...p} path={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />,
  Megaphone: (p: any) => <SvgIcon {...p} path={<><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>} />,
  Bell:      (p: any) => <SvgIcon {...p} path={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />,
  BellOff:   (p: any) => <SvgIcon {...p} path={<><path d="M13.73 21a2 2 0 0 1-3.46 0" /><path d="M18.63 13A17.89 17.89 0 0 1 18 8" /><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" /><path d="M18 8a6 6 0 0 0-9.33-5" /><line x1="1" y1="1" x2="23" y2="23" /></>} />,
  Trash:     (p: any) => <SvgIcon {...p} path={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />,
  ChevronLeft: (p: any) => <SvgIcon {...p} path={<><path d="m15 18-6-6 6-6" /></>} />,
};

// === FONCTION QUI RETOURNE L'ICÔNE SVG SELON LE TYPE ===
const getNotificationConfig = (type: string, title?: string, actorName?: string) => {
  const name = actorName || "Utilisateur";
  
  switch (type) {
    case "new_follower":
      return { icon: <Icons.User size={24} color="#3B82F6" />, smallIcon: <Icons.User size={12} color="white" />, color: "#3B82F6", title: `${name} vous suit maintenant` };
    case "message":
      return { icon: <Icons.Mail size={24} color="#22C55E" />, smallIcon: <Icons.Mail size={12} color="white" />, color: "#22C55E", title: `${name} vous a envoyé un message` };
    case "new_post":
      return { icon: <Icons.Image size={24} color="#F97316" />, smallIcon: <Icons.Image size={12} color="white" />, color: "#F97316", title: `${name} a publié un nouveau contenu` };
    case "withdrawal_approved":
      return { icon: <Icons.Check size={24} color="#22C55E" />, smallIcon: <Icons.Check size={12} color="white" />, color: "#22C55E", title: "Retrait validé" };
    case "withdrawal_rejected":
      return { icon: <Icons.X size={24} color="#EF4444" />, smallIcon: <Icons.X size={12} color="white" />, color: "#EF4444", title: "Retrait refusé" };
    case "withdrawal_failed":
      return { icon: <Icons.Alert size={24} color="#F97316" />, smallIcon: <Icons.Alert size={12} color="white" />, color: "#F97316", title: "Échec du transfert" };
    case "admin_campaign":
      return { icon: <Icons.Megaphone size={24} color="#8B5CF6" />, smallIcon: <Icons.Megaphone size={12} color="white" />, color: "#8B5CF6", title: title || "Nouvelle annonce" };
    default:
      return { icon: <Icons.Bell size={24} color="#9CA3AF" />, smallIcon: <Icons.Bell size={12} color="white" />, color: "#9CA3AF", title: title || "Nouvelle notification" };
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR");
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    bg: theme.bg,
    cardRead: theme.card,
    cardUnread: isDark ? "#1A1A1A" : "#F3F4F6",
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadNotifications(session.user.id);
        setupRealtime(session.user.id);
      } else {
        router.push("/login");
      }
    };
    init();

    return () => {
      if (user) supabase.removeChannel(supabase.channel("notifications_channel"));
    };
  }, []);

  const loadNotifications = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: notifsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      let enrichedNotifications = notifsData || [];

      if (enrichedNotifications.length > 0) {
        const actorIds = [
          ...new Set(
            enrichedNotifications
              .map((n: any) => n.actor_id)
              .filter((id: any) => id !== null)
          ),
        ];

        if (actorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .in("id", actorIds);

          const profilesMap: Record<string, any> = {};
          profilesData?.forEach((p: any) => {
            profilesMap[p.id] = p;
          });

          enrichedNotifications = enrichedNotifications.map((n: any) => ({
            ...n,
            actor_profile: n.actor_id ? profilesMap[n.actor_id] : null,
          }));
        }
      }

      const { data: campaignsData } = await supabase
        .from("admin_campaigns")
        .select("*")
        .or(`target_type.eq.all,target_user_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      const campaigns = (campaignsData || []).map((c: any) => ({
        ...c,
        type: "admin_campaign",
        is_read: true,
      }));

      const allNotifications = [...enrichedNotifications, ...campaigns];
      allNotifications.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotifications(allNotifications);
    } catch (error) {
      console.error("❌ Erreur chargement notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtime = (userId: string) => {
    const channel = supabase
      .channel("notifications_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotif = payload.new as any;
          
          let actorProfile = null;
          if (newNotif.actor_id) {
            const { data } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", newNotif.actor_id)
              .single();
            actorProfile = data;
          }

          const enrichedNewNotif = {
            ...newNotif,
            actor_profile: actorProfile,
          };

          setNotifications((prev) => [enrichedNewNotif, ...prev]);
        }
      )
      .subscribe();
  };

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notifId)
        .eq("user_id", user.id);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("❌ Erreur markAsRead:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("❌ Erreur markAllAsRead:", error);
    }
  };

  const deleteNotification = async (notifId: string) => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("id", notifId)
        .eq("user_id", user.id);
      
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (error) {
      console.error("❌ Erreur deleteNotification:", error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, backgroundColor: colors.bg, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", padding: "4px", display: "flex" }}>
            <Icons.ChevronLeft size={24} />
          </button>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>Notifications</h1>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: colors.primary, fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: colors.textMuted }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: colors.textMuted }}>
              <Icons.BellOff size={64} />
            </div>
            <p style={{ fontSize: "18px", color: colors.text, fontWeight: "bold", marginBottom: "8px" }}>Aucune notification</p>
            <p style={{ fontSize: "14px" }}>Les notifications apparaîtront ici</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.map((notif) => {
              const isRead = notif.is_read || false;
              const actorName = notif.actor_profile?.full_name || notif.actor_profile?.username || "Utilisateur";
              const config = getNotificationConfig(notif.type, notif.title, actorName);
              const avatarUrl = notif.actor_profile?.avatar_url;

              return (
                <div
                  key={notif.id}
                  onClick={() => !isRead && markAsRead(notif.id)}
                  style={{
                    padding: "12px",
                    backgroundColor: isRead ? colors.cardRead : colors.cardUnread,
                    borderRadius: "12px",
                    border: `1px solid ${isRead ? colors.border : colors.primary}`,
                    display: "flex",
                    gap: "12px",
                    cursor: isRead ? "default" : "pointer",
                    transition: "background 0.2s",
                    position: "relative"
                  }}
                >
                  {/* Avatar avec badge */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      backgroundColor: colors.border,
                      backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {!avatarUrl && config.icon}
                    </div>
                    <div style={{
                      position: "absolute", bottom: "-2px", right: "-2px",
                      width: "20px", height: "20px", borderRadius: "50%",
                      backgroundColor: config.color,
                      border: `2px solid ${colors.bg}`,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {config.smallIcon}
                    </div>
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: isRead ? "normal" : "bold", color: colors.text, marginBottom: "4px" }}>
                      {config.title}
                    </div>
                    {notif.message && (
                      <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {notif.message}
                      </div>
                    )}
                    <div style={{ fontSize: "12px", color: colors.textMuted }}>
                      {formatTimeAgo(notif.created_at)}
                    </div>
                  </div>

                  {/* Point non lu */}
                  {!isRead && (
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      backgroundColor: colors.primary, flexShrink: 0, marginTop: "6px"
                    }} />
                  )}

                  {/* Bouton supprimer */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    style={{ 
                      background: "none", border: "none", color: colors.textMuted, 
                      cursor: "pointer", padding: "4px", alignSelf: "flex-start", display: "flex"
                    }}
                    title="Supprimer"
                  >
                    <Icons.Trash size={16} />
                  </button>
                </div>
              );
            })}
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