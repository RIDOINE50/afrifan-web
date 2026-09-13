"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

declare global {
  interface Window {
    openKkiapayWidget: (options: any) => void;
    addKkiapayListener: (event: string, callback: (response: any) => void) => void;
    removeKkiapayListener: (event: string) => void;
  }
}

interface TipDialogProps {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TipDialog({ creatorId, creatorName, onClose, onSuccess }: TipDialogProps) {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000];

  // ⚠️ Kkiapay garde toujours son violet (interface externe)
  const kkiapayPublicKey = "72fc173fbe56f0f477e6bfcaa7349471c844e893";
  const isSandbox = false;
  const brandViolet = "#8B5CF6";

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
    overlay: isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
    red: "#EF4444",
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.addKkiapayListener) return;

    window.addKkiapayListener('success', async (response: any) => {
      console.log("✅ Paiement Kkiapay réussi:", response);
      const transactionId = response?.transactionId || response?.transaction_id;
      const customData = response?.data || response?.requestData?.data || creatorId;
      
      await verifyAndConfirmTip(transactionId, customData);
    });

    window.addKkiapayListener('failed', (err: any) => {
      console.error("❌ Paiement échoué:", err);
      setError("Échec du paiement. Vérifiez votre solde.");
      setIsLoading(false);
    });

    window.addKkiapayListener('cancelled', () => {
      setError("Paiement annulé.");
      setIsLoading(false);
    });

    return () => {
      if (typeof window !== "undefined" && window.removeKkiapayListener) {
        window.removeKkiapayListener('success');
        window.removeKkiapayListener('failed');
        window.removeKkiapayListener('cancelled');
      }
    };
  }, [amount, creatorId]);

  const handleAmountClick = (val: number) => {
    setAmount(val.toString());
    setError("");
  };

  const handleSendTip = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }

    if (typeof window === "undefined" || !window.openKkiapayWidget) {
      setError("Le système de paiement n'est pas encore chargé. Rechargez la page.");
      return;
    }

    setIsLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // ✅ Le widget Kkiapay garde son thème violet (interface externe)
    window.openKkiapayWidget({
      amount: Math.round(numAmount),
      key: kkiapayPublicKey,
      sandbox: isSandbox,
      data: creatorId,
      theme: brandViolet,
      name: creatorName,
      reason: 'Pourboire',
      countries: ["BJ", "CI", "SN", "TG"],
      paymentMethods: ["momo", "card"],
    });
  };

  const verifyAndConfirmTip = async (transactionId: string, referenceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const response = await supabase.functions.invoke('kkiapay-webhook', {
        body: {
          transaction_id: transactionId,
          user_id: user.id,
          type: 'tip',
          reference_id: referenceId || creatorId,
          amount: parseFloat(amount),
          message: message.trim() || null,
        }
      });

      if (response.data?.success === true) {
        setShowSuccess(true);
        setIsLoading(false);
      } else {
        throw new Error(response.data?.error || "Erreur de validation serveur");
      }
    } catch (err: any) {
      console.error("❌ Erreur validation tip:", err);
      setError("Paiement effectué mais erreur de validation. Contactez le support.");
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess?.();
    onClose();
  };

  const displayAmount = parseFloat(amount) || 0;

  // ==========================================
  // MODAL DE SUCCÈS
  // ==========================================
  if (showSuccess) {
    return (
      <div style={{
        position: "fixed", inset: 0, backgroundColor: colors.overlay, 
        display: "flex", alignItems: "center", justifyContent: "center", 
        zIndex: 1000, padding: "16px"
      }}>
        <div style={{
          backgroundColor: colors.card,
          borderRadius: "20px",
          width: "100%",
          maxWidth: "380px",
          padding: "32px 24px",
          textAlign: "center",
          boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.5)" : "0 20px 50px rgba(0,0,0,0.15)"
        }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
          <h2 style={{ color: colors.text, fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>
            Merci pour ton soutien !
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "14px", lineHeight: 1.5, marginBottom: "24px" }}>
            Ton pourboire de <strong style={{ color: colors.primary }}>{displayAmount} FCFA</strong> a bien été envoyé à {creatorName}.
          </p>
          <button
            onClick={handleSuccessClose}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: colors.primary,
              border: "none",
              borderRadius: "12px",
              color: colors.primaryText,
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Super !
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // FORMULAIRE PRINCIPAL
  // ==========================================
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: colors.overlay, 
      display: "flex", alignItems: "center", justifyContent: "center", 
      zIndex: 1000, padding: "16px"
    }}>
      <div style={{
        backgroundColor: colors.card,
        borderRadius: "20px",
        width: "100%",
        maxWidth: "420px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "24px",
        boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.5)" : "0 20px 50px rgba(0,0,0,0.15)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>☕</div>
          <h2 style={{ color: colors.text, fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            Soutenir ce créateur
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "14px", margin: 0 }}>
            à {creatorName}
          </p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              placeholder="0"
              style={{
                width: "100%",
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: "12px",
                padding: "16px",
                color: colors.text,
                fontSize: "28px",
                fontWeight: "bold",
                textAlign: "center",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <span style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textMuted,
              fontSize: "16px",
              fontWeight: "bold"
            }}>
              FCFA
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "24px" }}>
          {quickAmounts.map((val) => {
            const isSelected = parseFloat(amount) === val;
            return (
              <button
                key={val}
                onClick={() => handleAmountClick(val)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isSelected ? colors.primary : colors.bg,
                  border: isSelected ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  borderRadius: "20px",
                  color: isSelected ? colors.primaryText : colors.textMuted,
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {val}
              </button>
            );
          })}
        </div>

        <div style={{
          backgroundColor: colors.hover,
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start"
        }}>
          <span style={{ fontSize: "20px" }}>🔒</span>
          <div style={{ color: colors.textMuted, fontSize: "13px", lineHeight: 1.5 }}>
            Le paiement est sécurisé par <strong style={{ color: colors.text }}>Kkiapay</strong>. 
            Vous choisirez votre opérateur et entrerez votre numéro dans l'interface Kkiapay.
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", color: colors.textMuted, fontSize: "14px", marginBottom: "6px" }}>
            Message d'encouragement (optionnel)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Bravo pour ton contenu !"
            style={{
              width: "100%",
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "12px",
              padding: "12px 16px",
              color: colors.text,
              fontSize: "14px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              boxSizing: "border-box"
            }}
          />
        </div>

        {error && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            border: `1px solid ${colors.red}`, 
            borderRadius: "8px", 
            padding: "12px", 
            marginBottom: "16px",
            color: colors.red,
            fontSize: "14px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSendTip}
          disabled={displayAmount <= 0 || isLoading}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: (displayAmount > 0 && !isLoading) ? colors.primary : colors.border,
            border: "none",
            borderRadius: "12px",
            color: (displayAmount > 0 && !isLoading) ? colors.primaryText : colors.textMuted,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: (displayAmount > 0 && !isLoading) ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.2s"
          }}
        >
          {isLoading ? (
            <>
              <div style={{ width: "20px", height: "20px", border: `2px solid ${colors.primaryText}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              Traitement...
            </>
          ) : (
            `Payer ${displayAmount} FCFA`
          )}
        </button>

        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "12px",
            backgroundColor: "transparent",
            border: "none",
            color: colors.textMuted,
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          Annuler
        </button>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; margin: 0; 
        }
      `}</style>
    </div>
  );
}