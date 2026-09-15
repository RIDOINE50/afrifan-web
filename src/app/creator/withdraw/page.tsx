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
  ArrowLeft: (props: any) => <Icon {...props} path={<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>} />,
  CheckCircle: (props: any) => <Icon {...props} path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />,
  AlertCircle: (props: any) => <Icon {...props} path={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />,
  Wallet: (props: any) => <Icon {...props} path={<><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>} />,
};

export default function WithdrawalScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
  const [currentBalance, setCurrentBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [accountNumber, setAccountNumber] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ✅ Nouvelle : état pour le message de succès non bloquant
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    red: "#EF4444",
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from('wallets') 
        .select('balance')
        .eq('creator_id', user.id) 
        .maybeSingle();

      if (data && data.balance !== null && data.balance !== undefined) {
        setCurrentBalance(data.balance);
      } else {
        setCurrentBalance(0);
      }
    } catch (err) {
      console.error("❌ Erreur chargement solde:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const amountValue = parseFloat(amount);

    if (isNaN(amountValue) || amountValue < 5000) {
      setError("Le montant minimum de retrait est de 5 000 FCFA.");
      return;
    }

    if (amountValue > currentBalance) {
      setError("Solde insuffisant pour ce retrait.");
      return;
    }

    if (accountNumber.trim().length < 8) {
      setError("Veuillez entrer un numéro de compte/téléphone valide (min. 8 caractères).");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error: dbError } = await supabase.from('withdrawals').insert({
        creator_id: user.id,
        amount: amountValue,
        payment_method: paymentMethod,
        account_number: accountNumber.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      const newBalance = currentBalance - amountValue;
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('creator_id', user.id);

      // ✅ Message de succès propre (plus d'alert bloquant)
      setSuccessMessage("Demande de retrait envoyée avec succès !");
      
      // ✅ Redirection après un court délai pour laisser voir le message
      setTimeout(() => {
        router.push("/creator/dashboard?tab=wallet");
      }, 1500);
      
    } catch (err: any) {
      console.error("❌ Erreur retrait:", err);
      setError(err.message || "Une erreur est survenue lors de la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: "16px" }}>
        {/* ✅ Icône ArrowLeft SVG au lieu du caractère ← */}
        <button 
          onClick={() => router.back()} 
          style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", display: "flex", padding: "4px" }}
          aria-label="Retour"
        >
          <Icons.ArrowLeft size={24} color={colors.text} />
        </button>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>Demander un retrait</h1>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} style={{ flex: 1, padding: "24px", maxWidth: "600px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Carte Solde */}
        <div style={{
          width: "100%", padding: "24px", textAlign: "center",
          backgroundColor: colors.card, borderRadius: "16px",
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: colors.textMuted, fontSize: "14px", marginBottom: "8px" }}>
            {/* ✅ Icône Wallet SVG */}
            <Icons.Wallet size={16} color={colors.textMuted} />
            Solde disponible
          </div>
          <div style={{ color: colors.text, fontSize: "36px", fontWeight: "bold" }}>
            {currentBalance.toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        {/* ✅ Message de succès non bloquant */}
        {successMessage && (
          <div style={{
            padding: "12px 16px", backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: `1px solid ${colors.green}`, borderRadius: "12px",
            color: colors.green, fontSize: "14px",
            display: "flex", alignItems: "center", gap: "10px"
          }}>
            <Icons.CheckCircle size={20} color={colors.green} />
            {successMessage}
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div style={{
            padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${colors.red}`, borderRadius: "12px",
            color: colors.red, fontSize: "14px",
            display: "flex", alignItems: "center", gap: "10px"
          }}>
            <Icons.AlertCircle size={20} color={colors.red} />
            {error}
          </div>
        )}

        {/* Montant */}
        <div>
          <label style={{ display: "block", color: colors.text, fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
            Montant à retirer
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min. 5000"
              required
              disabled={isSubmitting}
              style={{
                width: "100%", padding: "14px 16px", paddingRight: "60px",
                backgroundColor: colors.card, border: `1px solid ${colors.border}`,
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

        {/* Méthode de paiement */}
        <div>
          <label style={{ display: "block", color: colors.text, fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
            Méthode de paiement
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: "100%", padding: "14px 16px",
              backgroundColor: colors.card, border: `1px solid ${colors.border}`,
              borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box",
              appearance: "none", cursor: "pointer"
            }}
          >
            <option value="mtn" style={{ backgroundColor: colors.card, color: colors.text }}>MTN Mobile Money</option>
            <option value="orange" style={{ backgroundColor: colors.card, color: colors.text }}>Orange Money</option>
            <option value="wave" style={{ backgroundColor: colors.card, color: colors.text }}>Wave</option>
            <option value="moov" style={{ backgroundColor: colors.card, color: colors.text }}>Moov Money</option>
          </select>
        </div>

        {/* Numéro de compte */}
        <div>
          <label style={{ display: "block", color: colors.text, fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
            Numéro de compte / Téléphone
          </label>
          <input
            type="tel"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Ex: 07 XX XX XX XX"
            required
            disabled={isSubmitting}
            style={{
              width: "100%", padding: "14px 16px",
              backgroundColor: colors.card, border: `1px solid ${colors.border}`,
              borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Bouton Confirmer */}
        <button
          type="submit"
          disabled={isSubmitting || !!successMessage}
          style={{
            width: "100%", padding: "16px", marginTop: "16px",
            backgroundColor: (isSubmitting || successMessage) ? colors.border : colors.primary,
            border: "none", borderRadius: "12px",
            color: colors.primaryText, fontSize: "16px", fontWeight: "bold",
            cursor: (isSubmitting || successMessage) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "background 0.2s"
          }}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: "20px", height: "20px", border: `2px solid ${colors.primaryText}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              Traitement en cours...
            </>
          ) : successMessage ? (
            <>
              <Icons.CheckCircle size={20} color={colors.primaryText} />
              Envoyé !
            </>
          ) : (
            "Confirmer le retrait"
          )}
        </button>
      </form>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        select option { background-color: ${colors.card}; color: ${colors.text}; }
      `}</style>
    </div>
  );
}