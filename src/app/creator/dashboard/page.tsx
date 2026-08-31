"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ✅ Import des onglets dynamiques
import WalletTab from "./WalletTab";
import SubscribersTab from "./SubscribersTab";
import StatsTab from "./StatsTab";
import SettingsTab from "./SettingsTab";
import TipsTab from "./TipsTab";

export default function CreatorDashboard() {
  const router = useRouter();
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

  const colors = {
    bg: "#0A0A0A",
    sidebar: "#1A1A1A",
    card: "#2A2A2A",
    border: "#3A3A3A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    red: "#EF4444",
    green: "#10B981",
  };

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const tabFromUrl = params.get('tab');
      const validTabs = ['overview', 'wallet', 'subscribers', 'stats', 'tips', 'settings'];
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

  // ✅ FONCTION DE CHARGEMENT 100% ALIGNÉE AVEC LE DASHBOARD_SERVICE FLUTTER
  const loadCreatorData = async (userId: string) => {
    try {
      // 1. Charger le nom
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile) {
        setUserName(profile.full_name || profile.username || "Créateur");
      }

      // 2. Abonnés actifs (Total)
      const { count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('status', 'active');

      // 3. Total des vues
      const { data: posts } = await supabase
        .from('posts')
        .select('views_count')
        .eq('user_id', userId); // ou 'creator_id' selon ta table posts
      
      const totalViews = posts?.reduce((acc: number, curr: any) => acc + (curr.views_count || 0), 0) || 0;

      // 4. ✅ CALCUL DU SOLDE (Exactement comme le Flutter)
      let balance = 0;

      // 4a. Essayer de lire la table 'wallets' avec 'creator_id' (Correction majeure ici !)
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('creator_id', userId) 
        .maybeSingle();

      if (walletData && !walletError && walletData.balance !== null && walletData.balance !== undefined) {
        balance = walletData.balance;
        console.log("✅ Solde trouvé dans la table 'wallets':", balance);
      } else {
        // 4b. Calcul de secours si la table wallets est vide (Réplique exacte du DashboardService)
        console.log("⚠️ Table 'wallets' vide. Calcul de secours depuis les transactions...");
        
        // Revenus des abonnements (match Flutter: active, upgraded, expired)
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('amount')
          .eq('creator_id', userId)
          .in('status', ['active', 'upgraded', 'expired']);
        
        const subsIncome = subs?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;

        // Revenus des pourboires (match Flutter: status = 'completed')
        const { data: tips } = await supabase
          .from('tips')
          .select('amount')
          .eq('creator_id', userId)
          .eq('status', 'completed');
        
        const tipsIncome = tips?.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) || 0;

        // Retraits (on soustrait tout ce qui a été demandé ou validé)
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
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 40, backdropFilter: "blur(4px)" }}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} style={{
        width: "260px", backgroundColor: colors.sidebar, borderRight: `1px solid ${colors.border}`,
        display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0,
        zIndex: 50, transform: "translateX(-100%)", transition: "transform 0.3s ease-in-out"
      }}>
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>👤</div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>{userName}</div>
              <div style={{ fontSize: "12px", color: colors.textMuted }}>Espace Créateur</div>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="mobile-close-btn" style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", display: "none" }}>✕</button>
        </div>

        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          <SidebarItem icon="📊" label="Vue d'ensemble" isActive={activeTab === "overview"} onClick={() => handleTabChange("overview")} />
          <SidebarItem icon="💰" label="Portefeuille" isActive={activeTab === "wallet"} onClick={() => handleTabChange("wallet")} />
          <SidebarItem icon="👥" label="Abonnés" isActive={activeTab === "subscribers"} onClick={() => handleTabChange("subscribers")} />
          <SidebarItem icon="📈" label="Statistiques" isActive={activeTab === "stats"} onClick={() => handleTabChange("stats")} />
          <SidebarItem icon="☕" label="Pourboires" isActive={activeTab === "tips"} onClick={() => handleTabChange("tips")} />
          <SidebarItem icon="⚙️" label="Paramètres" isActive={activeTab === "settings"} onClick={() => handleTabChange("settings")} />
        </nav>

        <div style={{ padding: "20px", borderTop: `1px solid ${colors.border}` }}>
          <button 
            onClick={() => { handleGoLive(); setIsMobileMenuOpen(false); }}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.15)", border: `1px solid ${colors.red}`, color: colors.red, fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
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
                <StatCard icon="👥" label="Abonnés actifs" value={stats.subscribers.toString()} color={colors.primary} />
                <StatCard icon="👁️" label="Vues totales" value={formatCount(stats.totalViews)} color={colors.green} />
                <StatCard 
                  icon="💰" 
                  label="Solde disponible" 
                  value={`${stats.balance.toLocaleString('fr-FR')} FCFA`} 
                  color={colors.text} 
                  isMoney={true}
                  onWithdraw={() => router.push("/creator/withdraw")}
                />
              </div>

              <div style={{ backgroundColor: colors.sidebar, borderRadius: "16px", padding: "24px", border: `1px solid ${colors.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>Contenu récent</h2>
                  <button onClick={() => router.push("/create")} style={{ padding: "8px 16px", backgroundColor: colors.primary, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>+ Nouveau Post</button>
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

function SidebarItem({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) {
  const colors = { primary: "#8B5CF6", text: "#FFFFFF", textMuted: "#9CA3AF" };
  return (
    <button 
      onClick={onClick} 
      style={{ 
        width: "100%", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px", 
        backgroundColor: isActive ? "rgba(139, 92, 246, 0.1)" : "transparent", 
        border: "none", borderRight: isActive ? `3px solid ${colors.primary}` : "3px solid transparent", 
        color: isActive ? colors.primary : colors.textMuted, 
        fontWeight: isActive ? "bold" : "normal", fontSize: "14px", cursor: "pointer", 
        transition: "all 0.2s", textAlign: "left" 
      }}
    >
      <span style={{ fontSize: "18px" }}>{icon}</span> {label}
    </button>
  );
}

function StatCard({ icon, label, value, color, isMoney, onWithdraw }: { icon: string, label: string, value: string, color: string, isMoney?: boolean, onWithdraw?: () => void }) {
  return (
    <div style={{ backgroundColor: "#1A1A1A", borderRadius: "16px", padding: "24px", border: "1px solid #2A2A2A", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9CA3AF", fontSize: "14px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: color }}>{value}</div>
      {isMoney && onWithdraw && (
        <button onClick={onWithdraw} style={{ marginTop: "8px", padding: "10px", backgroundColor: "#8B5CF6", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", transition: "background 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8B5CF6")}
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
    settings: "Paramètres" 
  };
  return names[tab] || "Tableau de bord";
}