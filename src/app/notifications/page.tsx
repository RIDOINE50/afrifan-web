"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Configuration des icônes et couleurs par type
const getNotificationConfig = (type: string, title?: string, actorName?: string) => {
  const name = actorName || "Utilisateur";
  
  switch (type) {
    case "new_follower":
      return { icon: "👤", color: "#3B82F6", title: `${name} vous suit maintenant` };
    case "message":
      return { icon: "✉️", color: "#22C55E", title: `${name} vous a envoyé un message` };
    case "new_post":
      return { icon: "🖼️", color: "#F97316", title: `${name} a publié un nouveau contenu` };
    case "withdrawal_approved":
      return { icon: "✅", color: "#22C55E", title: "Retrait validé ✅" };
    case "withdrawal_rejected":
      return { icon: "❌", color: "#EF4444", title: "Retrait refusé 🚫" };
    case "withdrawal_failed":
      return { icon: "⚠️", color: "#F97316", title: "Échec du transfert ❌" };
    case "admin_campaign":
      return { icon: "📢", color: "#8B5CF6", title: title || "Nouvelle annonce" };
    default:
      return { icon: "🔔", color: "#9CA3AF", title: title || "Nouvelle notification" };
  }
};

// Formatage du temps (comme en Flutter)
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
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    bg: "#0A0A0A",
    cardRead: "#111111",
    cardUnread: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
  };

  // 1. Initialisation et Chargement
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

  // 2. Chargement des données (Fusion Notifs + Campagnes)
  const loadNotifications = async (userId: string) => {
    setIsLoading(true);
    try {
      // A. Récupérer les notifications classiques
      const { data: notifsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      let enrichedNotifications = notifsData || [];

      // B. Enrichir avec les profils des acteurs (comme en Flutter)
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

      // C. Récupérer les campagnes admin
      const { data: campaignsData } = await supabase
        .from("admin_campaigns")
        .select("*")
        .or(`target_type.eq.all,target_user_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      const campaigns = (campaignsData || []).map((c: any) => ({
        ...c,
        type: "admin_campaign",
        is_read: true, // Les campagnes sont considérées comme lues par défaut ou gérées différemment
      }));

      // D. Fusion et Tri
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

  // 3. Temps Réel (Écoute des nouvelles notifications)
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
          
          // Enrichir immédiatement la nouvelle notification avec le profil de l'acteur
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

          // Ajouter en haut de la liste
          setNotifications((prev) => [enrichedNewNotif, ...prev]);
        }
      )
      .subscribe();
  };

  // 4. Actions
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
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>←</button>
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
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔕</div>
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
                    border: `1px solid ${isRead ? "rgba(255,255,255,0.05)" : `${colors.primary}4D`}`,
                    display: "flex",
                    gap: "12px",
                    cursor: isRead ? "default" : "pointer",
                    transition: "background 0.2s",
                    position: "relative"
                  }}
                >
                  {/* Avatar avec badge de type */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "50%",
                      backgroundColor: colors.border,
                      backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px"
                    }}>
                      {!avatarUrl && config.icon}
                    </div>
                    <div style={{
                      position: "absolute", bottom: "-2px", right: "-2px",
                      width: "20px", height: "20px", borderRadius: "50%",
                      backgroundColor: config.color,
                      border: `2px solid ${colors.bg}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px"
                    }}>
                      {config.icon}
                    </div>
                  </div>

                  {/* Contenu texte */}
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

                  {/* Bouton supprimer (visible au survol ou clic droit en version web complète, ici simplifié) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    style={{ 
                      background: "none", border: "none", color: colors.textMuted, 
                      cursor: "pointer", padding: "4px", fontSize: "16px", alignSelf: "flex-start"
                    }}
                    title="Supprimer"
                  >
                    🗑️
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