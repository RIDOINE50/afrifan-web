"use client";

import { useEffect, useState } from "react";
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
  User: (props: any) => <Icon {...props} path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  CheckCircle: (props: any) => <Icon {...props} path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />,
  AlertCircle: (props: any) => <Icon {...props} path={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />,
};

export default function SettingsTab() {
  const { isDark, theme } = useAppTheme();
  const [userName, setUserName] = useState("Utilisateur");
  const [isVerified, setIsVerified] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState("1000");
  const [proPrice, setProPrice] = useState("5000");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

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
    green: "#22C55E",
    orange: "#F97316",
    red: "#EF4444",
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, is_verified, premium_price, pro_price')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setUserName(data.full_name || data.username || 'Utilisateur');
        setIsVerified(data.is_verified || false);
        setPremiumPrice((data.premium_price || 1000).toString());
        setProPrice((data.pro_price || 5000).toString());
      }
    } catch (error) {
      console.error("❌ Erreur chargement paramètres:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const pPrice = parseFloat(premiumPrice);
    const prPrice = parseFloat(proPrice);

    if (isNaN(pPrice) || pPrice < 500) {
      setMessage({ type: 'error', text: 'Le prix Premium doit être au minimum de 500 FCFA.' });
      return;
    }
    if (isNaN(prPrice) || prPrice < 2000) {
      setMessage({ type: 'error', text: 'Le prix Pro doit être au minimum de 2000 FCFA.' });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from('profiles')
        .update({ 
          premium_price: pPrice, 
          pro_price: prPrice 
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Prix mis à jour avec succès !' });
    } catch (error: any) {
      console.error("❌ Erreur sauvegarde:", error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "32px" }}>
      
      {/* 1. SECTION : MON COMPTE */}
      <div>
        <h3 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Mon Compte</h3>
        <div style={{ backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}`, padding: "20px" }}>
          <InfoRow label="Nom" value={userName} icon={<Icons.User size={20} color={colors.primary} />} colors={colors} />
          <div style={{ height: "1px", backgroundColor: colors.border, margin: "16px 0" }} />
          <InfoRow 
            label="Statut" 
            value={isVerified ? "Vérifié" : "Non vérifié"} 
            icon={
              isVerified 
                ? <Icons.CheckCircle size={20} color={colors.green} /> 
                : <Icons.AlertCircle size={20} color={colors.orange} />
            }
            valueColor={isVerified ? colors.green : colors.orange} 
            colors={colors}
          />
        </div>
      </div>

      {/* 2. SECTION : MES TARIFS D'ABONNEMENT */}
      <div>
        <h3 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>Mes Tarifs d'Abonnement</h3>
        
        <form onSubmit={handleSave} style={{ backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}`, padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Message */}
          {message.text && (
            <div style={{
              padding: "12px 16px", borderRadius: "12px", fontSize: "14px",
              display: "flex", alignItems: "center", gap: "10px",
              backgroundColor: message.type === 'success' ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === 'success' ? colors.green : colors.red}`,
              color: message.type === 'success' ? colors.green : colors.red
            }}>
              {/* ✅ Icône SVG selon le type de message */}
              {message.type === 'success' 
                ? <Icons.CheckCircle size={18} color={colors.green} /> 
                : <Icons.AlertCircle size={18} color={colors.red} />
              }
              {message.text}
            </div>
          )}

          {/* Prix Premium */}
          <div>
            <label style={{ display: "block", color: colors.text, fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
              Abonnement Premium
            </label>
            <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 12px 0" }}>Accès au contenu exclusif de base</p>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={premiumPrice}
                onChange={(e) => setPremiumPrice(e.target.value)}
                placeholder="Min. 500"
                required
                disabled={isSaving}
                style={{
                  width: "100%", padding: "14px 16px", paddingRight: "60px",
                  backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
                }}
              />
              <span style={{
                position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                color: colors.textMuted, fontSize: "14px", fontWeight: "bold"
              }}>
                FCFA
              </span>
            </div>
          </div>

          {/* Prix Pro */}
          <div>
            <label style={{ display: "block", color: colors.text, fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
              Abonnement Pro
            </label>
            <p style={{ color: colors.textMuted, fontSize: "12px", margin: "0 0 12px 0" }}>Accès complet + messages privés + appels</p>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                value={proPrice}
                onChange={(e) => setProPrice(e.target.value)}
                placeholder="Min. 2000"
                required
                disabled={isSaving}
                style={{
                  width: "100%", padding: "14px 16px", paddingRight: "60px",
                  backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
                }}
              />
              <span style={{
                position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                color: colors.textMuted, fontSize: "14px", fontWeight: "bold"
              }}>
                FCFA
              </span>
            </div>
          </div>

          {/* Bouton Sauvegarder */}
          <button
            type="submit"
            disabled={isSaving}
            style={{
              width: "100%", padding: "16px", marginTop: "8px",
              backgroundColor: isSaving ? colors.border : colors.primary,
              border: "none", borderRadius: "12px",
              color: colors.primaryText, fontSize: "16px", fontWeight: "bold",
              cursor: isSaving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "background 0.2s"
            }}
          >
            {isSaving ? (
              <>
                <div style={{ width: "20px", height: "20px", border: `2px solid ${colors.primaryText}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                Sauvegarde en cours...
              </>
            ) : (
              "Sauvegarder les prix"
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ✅ InfoRow accepte maintenant un ReactNode comme icône
function InfoRow({ label, value, icon, valueColor, colors }: { label: string; value: string; icon: React.ReactNode; valueColor?: string; colors: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: colors.textMuted, fontSize: "12px", marginBottom: "2px" }}>{label}</div>
        <div style={{ color: valueColor || colors.text, fontSize: "15px", fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}