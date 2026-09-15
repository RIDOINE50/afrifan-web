"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// ==========================================
// ✅ VRAIES ICÔNES SVG PROFESSIONNELLES
// ==========================================
const Icon = ({ path, size = 20, className = "", fill = "none", color = "currentColor", strokeWidth = 2 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {path}
  </svg>
);

const Icons = {
  Coffee: (props: any) => <Icon {...props} path={<><path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></>} />,
  User: (props: any) => <Icon {...props} path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  ArrowRight: (props: any) => <Icon {...props} path={<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>} />,
  CreditCard: (props: any) => <Icon {...props} path={<><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>} />,
  Quote: (props: any) => <Icon {...props} fill="currentColor" stroke="none" path={<><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></>} />,
  Clock: (props: any) => <Icon {...props} path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />,
};

export default function TipsTab() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [tips, setTips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Couleurs dynamiques
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    greenAccent: "#4ADE80",
    orangeAccent: "#FB923C",
  };

  useEffect(() => {
    loadTips();
  }, []);

  const loadTips = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tips')
        .select(`
          id,
          amount,
          payment_method,
          message,
          created_at,
          fan_id,
          profiles!tips_fan_id_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error("❌ Erreur chargement pourboires:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date inconnue";
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} à ${hours}h${minutes}`;
    } catch {
      return "Date invalide";
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", textAlign: "center", padding: "20px" }}>
        {/* ✅ Icône Coffee SVG au lieu de l'émoji ☕ */}
        <div style={{ marginBottom: "16px", opacity: 0.8 }}>
          <Icons.Coffee size={80} color={colors.textMuted} strokeWidth={1.5} />
        </div>
        <p style={{ fontSize: "16px", color: colors.textMuted, marginBottom: "8px", margin: 0 }}>Aucun pourboire reçu pour le moment</p>
        <p style={{ fontSize: "14px", color: colors.textMuted, margin: 0 }}>Partagez votre profil pour en recevoir !</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
      {tips.map((tip) => {
        const profile = tip.profiles;
        const fanName = profile?.full_name || profile?.username || "Un fan anonyme";
        const fanAvatar = profile?.avatar_url;
        const fanId = tip.fan_id;
        const message = tip.message?.trim();

        return (
          <div
            key={tip.id}
            style={{
              backgroundColor: colors.card,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              
              <div 
                onClick={() => fanId && router.push(`/profile?id=${fanId}`)}
                style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", flex: 1 }}
              >
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    backgroundColor: colors.hover,
                    backgroundImage: fanAvatar ? `url(${fanAvatar})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: colors.primary
                  }}>
                    {/* ✅ Icône User SVG au lieu de l'émoji 👤 */}
                    {!fanAvatar && <Icons.User size={22} color={colors.primary} />}
                  </div>
                  <div style={{
                    position: "absolute", bottom: "0", right: "0",
                    width: "18px", height: "18px", borderRadius: "50%",
                    backgroundColor: colors.card, border: `2px solid ${colors.card}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {/* ✅ Icône ArrowRight SVG au lieu du caractère ➜ */}
                    <Icons.ArrowRight size={10} color={colors.primary} strokeWidth={3} />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    color: colors.text, fontSize: "16px", fontWeight: "bold", 
                    textDecoration: "underline", textDecorationColor: colors.primary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {fanName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                    {/* ✅ Icône CreditCard SVG au lieu de l'émoji 💳 */}
                    <Icons.CreditCard size={12} color={colors.orangeAccent} />
                    <span style={{ fontSize: "12px", color: colors.textMuted }}>
                      {tip.payment_method || "Mobile Money"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ 
                color: colors.greenAccent, fontSize: "18px", fontWeight: "bold", 
                flexShrink: 0, marginLeft: "12px" 
              }}>
                + {formatMoney(tip.amount || 0)}
              </div>
            </div>

            {message && (
              <div style={{
                width: "100%", padding: "12px",
                backgroundColor: colors.hover,
                borderRadius: "12px",
                display: "flex", gap: "8px", alignItems: "flex-start"
              }}>
                {/* ✅ Icône Quote SVG au lieu du caractère ❝ */}
                <Icons.Quote size={18} color={colors.primary} />
                <p style={{ 
                  margin: 0, color: colors.textMuted, fontSize: "14px", 
                  fontStyle: "italic", lineHeight: "1.4" 
                }}>
                  {message}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px", color: colors.textMuted, fontSize: "12px" }}>
              {/* ✅ Icône Clock SVG au lieu de l'émoji 🕒 */}
              <Icons.Clock size={12} color={colors.textMuted} />
              {formatDate(tip.created_at)}
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}