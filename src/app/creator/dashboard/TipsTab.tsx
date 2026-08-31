"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TipsTab() {
  const router = useRouter();
  const [tips, setTips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#737373",
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
        <div style={{ fontSize: "80px", marginBottom: "16px", color: colors.textMuted, opacity: 0.8 }}>☕</div>
        <p style={{ fontSize: "16px", color: colors.textMuted, marginBottom: "8px", margin: 0 }}>Aucun pourboire reçu pour le moment</p>
        <p style={{ fontSize: "14px", color: colors.textMuted, margin: 0 }}>Partagez votre profil pour en recevoir !</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
      {tips.map((tip) => {
        // Supabase renvoie toujours l'objet sous le nom "profiles" même avec la syntaxe !tips_fan_id_fkey
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
                    backgroundColor: `${colors.primary}33`,
                    backgroundImage: fanAvatar ? `url(${fanAvatar})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", color: colors.primary
                  }}>
                    {!fanAvatar && "👤"}
                  </div>
                  <div style={{
                    position: "absolute", bottom: "0", right: "0",
                    width: "18px", height: "18px", borderRadius: "50%",
                    backgroundColor: colors.card, border: `2px solid ${colors.card}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: "12px", color: colors.primary, fontWeight: "bold" }}>➜</span>
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
                    <span style={{ fontSize: "12px", color: colors.orangeAccent }}>💳</span>
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
                backgroundColor: `${colors.primary}1A`,
                borderRadius: "12px",
                display: "flex", gap: "8px", alignItems: "flex-start"
              }}>
                <span style={{ fontSize: "18px", color: colors.primary, lineHeight: "1" }}>❝</span>
                <p style={{ 
                  margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "14px", 
                  fontStyle: "italic", lineHeight: "1.4" 
                }}>
                  {message}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px", color: colors.textMuted, fontSize: "12px" }}>
              <span style={{ fontSize: "12px" }}>🕒</span>
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