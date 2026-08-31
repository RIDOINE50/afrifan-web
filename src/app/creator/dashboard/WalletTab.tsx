"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function WalletTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    green: "#22C55E",
    orange: "#F97316",
    red: "#EF4444",
    blue: "#3B82F6",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ Chargement en parallèle pour plus de rapidité (comme Future.wait en Flutter)
      const [transactionsRes, withdrawalsRes, tipsRes] = await Promise.all([
        // 1. Revenus (Abonnements) - Adapte le nom de la table si nécessaire
        supabase.from('subscriptions')
          .select('amount, created_at, tier_type')
          .eq('creator_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50),

        // 2. Retraits
        supabase.from('withdrawals')
          .select('amount, created_at, status, payment_method')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),

        // 3. Pourboires (avec jointure pour avoir le nom du fan)
        supabase.from('tips')
          .select('amount, created_at, profiles(full_name, username)')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const mergedHistory: any[] = [];

      // Ajouter les revenus
      if (transactionsRes.data) {
        transactionsRes.data.forEach((tx: any) => {
          mergedHistory.push({
            id: `tx_${tx.created_at}`,
            type: 'income',
            amount: tx.amount || 0,
            date: tx.created_at,
            tierType: tx.tier_type || 'FAN',
          });
        });
      }

      // Ajouter les retraits
      if (withdrawalsRes.data) {
        withdrawalsRes.data.forEach((w: any) => {
          mergedHistory.push({
            id: `w_${w.created_at}`,
            type: 'withdrawal',
            amount: w.amount || 0,
            date: w.created_at,
            status: w.status,
            paymentMethod: w.payment_method || 'Compte',
          });
        });
      }

      // Ajouter les pourboires
      if (tipsRes.data) {
        tipsRes.data.forEach((tip: any) => {
          const fanName = tip.profiles ? (tip.profiles.full_name || tip.profiles.username || 'Un fan') : 'Un fan';
          mergedHistory.push({
            id: `tip_${tip.created_at}`,
            type: 'tip',
            amount: tip.amount || 0,
            date: tip.created_at,
            fanName: fanName,
          });
        });
      }

      // Trier par date décroissante (le plus récent en premier)
      mergedHistory.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setHistory(mergedHistory);
    } catch (error) {
      console.error("❌ Erreur chargement wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return "Date inconnue";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Refusé';
      default: return 'Inconnu';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return colors.green;
      case 'approved': return colors.blue;
      case 'pending': return colors.orange;
      case 'rejected': return colors.red;
      default: return colors.textMuted;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: colors.textMuted }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>💳</div>
        <p style={{ fontSize: "16px" }}>Aucune transaction pour le moment</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {history.map((item, index) => {
        const isIncome = item.type === 'income';
        const isTip = item.type === 'tip';
        
        let icon = "⬇️";
        let iconColor = colors.primary;
        let iconBg = `${colors.primary}1A`; // 10% opacity
        let title = `Abonnement ${item.tierType?.toUpperCase() || 'FAN'}`;
        let amountText = `+ ${formatMoney(item.amount)}`;
        let amountColor = colors.green;

        if (isTip) {
          icon = "☕";
          iconColor = colors.orange;
          iconBg = `${colors.orange}1A`;
          title = `Pourboire de ${item.fanName}`;
          amountText = `+ ${formatMoney(item.amount)}`;
          amountColor = colors.green;
        } else if (!isIncome) {
          icon = "⬆️";
          iconColor = colors.orange;
          iconBg = `${colors.orange}1A`;
          title = `Retrait vers ${item.paymentMethod?.toUpperCase() || 'Compte'}`;
          amountText = `- ${formatMoney(item.amount)}`;
          amountColor = colors.text;
        }

        return (
          <div key={index} style={{
            backgroundColor: colors.card,
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            {/* Icône */}
            <div style={{
              width: "48px", height: "48px", borderRadius: "10px",
              backgroundColor: iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", color: iconColor, flexShrink: 0
            }}>
              {icon}
            </div>

            {/* Détails */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: colors.text, fontSize: "15px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {title}
              </div>
              <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                {formatDate(item.date)}
              </div>
              {!isIncome && !isTip && (
                <div style={{ 
                  color: getStatusColor(item.status), 
                  fontSize: "12px", fontWeight: "bold", marginTop: "4px" 
                }}>
                  Statut: {getStatusText(item.status)}
                </div>
              )}
            </div>

            {/* Montant */}
            <div style={{ 
              color: amountColor, 
              fontSize: "16px", fontWeight: "bold", 
              flexShrink: 0 
            }}>
              {amountText}
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