"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

import WalletTab from "./WalletTab";
import SubscribersTab from "./SubscribersTab";
import StatsTab from "./StatsTab";
import SettingsTab from "./SettingsTab";
import TipsTab from "./TipsTab";
import CreatorShopTab from "./CreatorShopTab";
import SalesTab from "./SalesTab";

export default function CreatorDashboard() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("Créateur");
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState({
    subscribers: 0,
    totalViews: 0,
    balance: 0,
  });

  // ✅ Couleurs dynamiques
  const colors = {
    bg: theme.bg,
    sidebar: theme.card,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    hover: theme.hover,
    overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
    red: "#EF4444",
    green: "#10B981",
  };

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const tabFromUrl = params.get('tab');
      const validTabs = ['overview', 'wallet', 'subscribers', 'stats', 'tips', 'shop', 'sales', 'settings'];
      if (tabFromUrl && validTabs.includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await loadCreatorData(session.user.id);
    };
    init();
  }, []);

  const loadCreatorData = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile) {
        setUserName(profile.full_name || profile.username || "Créateur");
      }

      const { count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('status', 'active');

      const { data: posts } = await supabase
        .from('posts')
        .select('views_count')
        .eq('user_id', userId);
      
      const totalViews = posts?.reduce((acc: number, curr: any) => acc + (curr.views_count || 0), 0) || 0;

      let balance = 0;

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('creator_id', userId) 
        .maybeSingle();

      if (walletData && !walletError && walletData.balance !== null && walletData.balance !== undefined) {
        balance = walletData.balance;
        console.log("✅ Solde trouvé dans la table 'wallets':", balance);
      } else {
        console.log("⚠️ Table 'wallets' vide. Calcul de secours depuis les transactions...");
        
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('amount')
          .eq('creator_id', userId)
          .in('status', ['active', 'upgraded', 'expired']);
        
        const subsIncome = subs?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;

        const { data: tips } = await supabase
          .from('tips')
          .select('amount')
          .eq('creator_id', userId)
          .eq('status', 'completed');
        
        const tipsIncome = tips?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;

        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount')
          .eq('creator_id', userId)
          .in('status', ['pending', 'approved', 'completed']);
        
        const totalWithdrawals = withdrawals?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;

        balance = (subsIncome + tipsIncome) - totalWithdrawals;
        console.log(`✅ Solde calculé : ${subsIncome} (subs) + ${tipsIncome} (tips) - ${totalWithdrawals} (retraits) = ${balance}`);
      }

      setStats({
        subscribers: subsCount || 0,
        totalViews: totalViews,
        balance: balance,
      });

    } catch (error) {
      console.error("❌ Erreur chargement dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoLive = () => {
    router.push("/creator/go-live");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newUrl = `${window.location.pathname}?tab=${tab}`;
    window.history.replaceState(null, '', newUrl);
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, position: "relative" }}>
      
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="mobile-overlay"
          style={{ position: "fixed", inset: 0, backgroundColor: colors.overlay, zIndex: 40, backdropFilter: "blur(4px)" }}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{
        width: "260px", backgroundColor: colors.sidebar, borderRight: `1px solid ${colors.border}`,
        display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0,
        zIndex: 50, transform: "translateX(-100%)", transition: "transform 0.3s ease-in-out"
      }}>
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              width: "48px", height: "48px", borderRadius: "50%", 
              backgroundColor: colors.primary, color: colors.primaryText, 
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" 
            }}>👤</div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>{userName}</div>
              <div style={{ fontSize: "12px", color: colors.textMuted }}>Espace Créateur</div>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="mobile-close-btn" style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", display: "none" }}>✕</button>
        </div>

        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          <SidebarItem icon="📊" label="Vue d'ensemble" isActive={activeTab === "overview"} onClick={() => handleTabChange("overview")} colors={colors} />
          <SidebarItem icon="💰" label="Portefeuille" isActive={activeTab === "wallet"} onClick={() => handleTabChange("wallet")} colors={colors} />
          <SidebarItem icon="👥" label="Abonnés" isActive={activeTab === "subscribers"} onClick={() => handleTabChange("subscribers")} colors={colors} />
          <SidebarItem icon="📈" label="Statistiques" isActive={activeTab === "stats"} onClick={() => handleTabChange("stats")} colors={colors} />
          <SidebarItem icon="☕" label="Pourboires" isActive={activeTab === "tips"} onClick={() => handleTabChange("tips")} colors={colors} />
          <SidebarItem icon="🛍️" label="Boutique" isActive={activeTab === "shop"} onClick={() => handleTabChange("shop")} colors={colors} />
          <SidebarItem icon="💳" label="Ventes" isActive={activeTab === "sales"} onClick={() => handleTabChange("sales")} colors={colors} />
          <SidebarItem icon="⚙️" label="Paramètres" isActive={activeTab === "settings"} onClick={() => handleTabChange("settings")} colors={colors} />
        </nav>

        <div style={{ padding: "20px", borderTop: `1px solid ${colors.border}` }}>
          <button 
            onClick={() => { handleGoLive(); setIsMobileMenuOpen(false); }}
            style={{ 
              width: "100%", padding: "12px", borderRadius: "12px", 
              backgroundColor: "rgba(239, 68, 68, 0.15)", 
              border: `1px solid ${colors.red}`, color: colors.red, 
              fontWeight: "bold", fontSize: "14px", cursor: "pointer", 
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" 
            }}
          >
            🔴 Lancer un Live
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        
        <header className="mobile-header" style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "none", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.bg, position: "sticky", top: 0, zIndex: 30 }}>
          <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>☰</button>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{getTabName(activeTab)}</h1>
          <div style={{ width: "24px" }} />
        </header>

        <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          
          {activeTab === "overview" && (
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>Bonjour, {userName.split(' ')[0]} 👋</h1>
              <p style={{ color: colors.textMuted, marginBottom: "32px" }}>Voici un résumé de ton activité de créateur.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                <StatCard icon="👥" label="Abonnés actifs" value={stats.subscribers.toString()} color={colors.primary} colors={colors} />
                <StatCard icon="👁️" label="Vues totales" value={formatCount(stats.totalViews)} color={colors.green} colors={colors} />
                <StatCard 
                  icon="💰" 
                  label="Solde disponible" 
                  value={`${stats.balance.toLocaleString('fr-FR')} FCFA`} 
                  color={colors.text} 
                  isMoney={true}
                  onWithdraw={() => router.push("/creator/withdraw")}
                  colors={colors}
                />
              </div>

              <div style={{ backgroundColor: colors.sidebar, borderRadius: "16px", padding: "24px", border: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Contenu récent</h2>
                  <button 
                    onClick={() => router.push("/create")} 
                    style={{ 
                      padding: "8px 16px", backgroundColor: colors.primary, color: colors.primaryText, 
                      border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" 
                    }}
                  >
                    + Nouveau Post
                  </button>
                </div>
                <div style={{ textAlign: "center", padding: "40px", color: colors.textMuted, border: `2px dashed ${colors.border}`, borderRadius: "12px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📸</div>
                  <p>Tes derniers posts apparaîtront ici.</p>
                  <p style={{ fontSize: "13px" }}>Commence par publier du contenu pour voir tes performances !</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wallet" && <WalletTab />}
          {activeTab === "subscribers" && <SubscribersTab />}
          {activeTab === "stats" && <StatsTab />}
          {activeTab === "tips" && <TipsTab />}
          {activeTab === "shop" && <CreatorShopTab />}
          {activeTab === "sales" && <SalesTab />}
          {activeTab === "settings" && <SettingsTab />}

        </div>
      </main>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        @media (min-width: 768px) {
          .sidebar { position: sticky !important; transform: translateX(0) !important; }
          .mobile-header { display: none !important; }
          .mobile-close-btn { display: none !important; }
          .mobile-overlay { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar.mobile-open { transform: translateX(0) !important; }
          .mobile-header { display: flex !important; }
          .mobile-close-btn { display: block !important; }
          main > div { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarItem({ icon, label, isActive, onClick, colors }: { icon: string, label: string, isActive: boolean, onClick: () => void, colors: any }) {
  return (
    <button 
      onClick={onClick} 
      style={{ 
        width: "100%", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px", 
        backgroundColor: isActive ? colors.hover : "transparent", 
        border: "none", 
        borderRight: isActive ? `3px solid ${colors.primary}` : "3px solid transparent", 
        color: isActive ? colors.primary : colors.textMuted, 
        fontWeight: isActive ? "bold" : "normal", fontSize: "14px", cursor: "pointer", 
        transition: "all 0.2s", textAlign: "left" 
      }}
    >
      <span style={{ fontSize: "18px" }}>{icon}</span> {label}
    </button>
  );
}

function StatCard({ icon, label, value, color, isMoney, onWithdraw, colors }: { icon: string, label: string, value: string, color: string, isMoney?: boolean, onWithdraw?: () => void, colors: any }) {
  return (
    <div style={{ 
      backgroundColor: colors.card, 
      borderRadius: "16px", 
      padding: "24px", 
      border: `1px solid ${colors.border}`, 
      display: "flex", flexDirection: "column", gap: "12px" 
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.textMuted, fontSize: "14px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: color }}>{value}</div>
      {isMoney && onWithdraw && (
        <button 
          onClick={onWithdraw} 
          style={{ 
            marginTop: "8px", padding: "10px", 
            backgroundColor: colors.primary, color: colors.primaryText, 
            border: "none", borderRadius: "8px", fontWeight: "bold", 
            fontSize: "13px", cursor: "pointer", transition: "opacity 0.2s" 
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Demander un retrait
        </button>
      )}
    </div>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

function getTabName(tab: string): string {
  const names: Record<string, string> = { 
    overview: "Vue d'ensemble", 
    wallet: "Portefeuille", 
    subscribers: "Abonnés", 
    stats: "Statistiques", 
    tips: "Pourboires", 
    shop: "Boutique",
    sales: "Ventes",
    settings: "Paramètres" 
  };
  return names[tab] || "Tableau de bord";
}