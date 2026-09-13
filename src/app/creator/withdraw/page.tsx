"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

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

      alert("✅ Demande de retrait envoyée avec succès !");
      router.push("/creator/dashboard?tab=wallet");
      
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
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer" }}>←</button>
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
          <div style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "8px" }}>Solde disponible</div>
          <div style={{ color: colors.text, fontSize: "36px", fontWeight: "bold" }}>
            {currentBalance.toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${colors.red}`, borderRadius: "12px",
            color: colors.red, fontSize: "14px", textAlign: "center"
          }}>
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
          disabled={isSubmitting}
          style={{
            width: "100%", padding: "16px", marginTop: "16px",
            backgroundColor: isSubmitting ? colors.border : colors.primary,
            border: "none", borderRadius: "12px",
            color: colors.primaryText, fontSize: "16px", fontWeight: "bold",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "background 0.2s"
          }}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: "20px", height: "20px", border: `2px solid ${colors.primaryText}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              Traitement en cours...
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