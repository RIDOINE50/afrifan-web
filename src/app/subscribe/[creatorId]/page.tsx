"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

declare global {
  interface Window {
    openKkiapayWidget: (options: any) => void;
    addKkiapayListener: (event: string, callback: (response: any) => void) => void;
    removeKkiapayListener: (event: string) => void;
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isDark, theme } = useAppTheme();
  
  const paymentType = searchParams.get('type') || 'subscription'; 
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName') || 'Produit numérique';
  const tierType = searchParams.get('tier') || 'premium';
  const price = parseFloat(searchParams.get('price') || '0');
  const creatorId = searchParams.get('creatorId') || (params.creatorId as string);
  const creatorName = searchParams.get('creatorName') || 'Ce créateur';

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>("");

  const isPro = tierType === 'pro';

  const kkiapayPublicKey = "72fc173fbe56f0f477e6bfcaa7349471c844e893";
  const isSandbox = false;

  // ✅ Couleurs dynamiques selon le thème
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

  // ==========================================
  // 1. VÉRIFICATION UTILISATEUR
  // ==========================================
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    };
    init();
  }, [router]);

  // ==========================================
  // 2. ÉCOUTE DES ÉVÉNEMENTS KKIAPAY
  // ==========================================
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !window.addKkiapayListener) return;

    window.addKkiapayListener('success', async (response: any) => {
      console.log("✅ Paiement Kkiapay réussi:", response);
      const referenceId = response?.data || (paymentType === 'product' ? productId : creatorId);
      const transactionId = response?.transactionId || response?.transaction_id;
      await verifyAndConfirmPayment(transactionId, referenceId);
    });

    window.addKkiapayListener('failed', (err: any) => {
      console.error("❌ Paiement échoué:", err);
      setError("Échec du paiement. Vérifiez votre solde ou réessayez.");
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
  }, [user, paymentType, productId, creatorId]);

  // ==========================================
  // 3. OUVRIR LE WIDGET KKIAPAY
  // ==========================================
  const handlePayment = () => {
    if (typeof window === "undefined" || !window.openKkiapayWidget) {
      setError("Le système de paiement n'est pas encore chargé. Rechargez la page.");
      return;
    }

    setIsLoading(true);
    setError("");

    window.openKkiapayWidget({
      amount: Math.round(price),
      key: kkiapayPublicKey,
      sandbox: isSandbox,
      data: paymentType === 'product' ? productId : creatorId,
      theme: "#8B5CF6",
      name: creatorName,
      reason: paymentType === 'product' 
        ? `Achat de ${productName}` 
        : `Abonnement à ${creatorName}`,
      countries: ["BJ", "CI", "SN", "TG"],
    });
  };

  // ==========================================
  // 4. APPEL À LA MÊME FONCTION EDGE QUE MOBILE
  // ==========================================
  const verifyAndConfirmPayment = async (transactionId: string, referenceId: string | null) => {
    try {
      if (!user) throw new Error("Utilisateur non connecté");

      const response = await supabase.functions.invoke('kkiapay-webhook', {
        body: {
          transaction_id: transactionId,
          user_id: user.id,
          type: paymentType === 'product' ? 'product' : 'subscription',
          reference_id: referenceId,
          amount: price,
        }
      });

      if (response.data?.success === true) {
        setShowSuccess(true);
      } else {
        throw new Error(response.data?.error || "Erreur de validation serveur");
      }
    } catch (err: any) {
      console.error("❌ Erreur validation:", err);
      setError("Paiement effectué mais erreur de validation. Contactez le support.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    if (paymentType === 'product' && productId) {
      router.push(`/product/${productId}`);
    } else {
      router.push(`/createur?id=${creatorId}`);
    }
  };

  if (!user) return null;

  const isProduct = paymentType === 'product';

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: colors.bg, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        backgroundColor: colors.bg,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.8)" : "0 20px 50px rgba(0,0,0,0.1)",
        border: `1px solid ${colors.border}`
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: "16px 20px", 
          display: "flex", 
          alignItems: "center", 
          gap: "16px",
          borderBottom: `1px solid ${colors.border}`
        }}>
          <button 
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px" }}
          >
            ←
          </button>
          <h1 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: 0 }}>
            {isProduct ? "Finaliser l'achat" : "Finaliser l'abonnement"}
          </h1>
        </div>

        <div style={{ padding: "24px 20px", maxHeight: "80vh", overflowY: "auto" }}>
          
          {/* 📋 RÉCAPITULATIF */}
          <div style={{
            width: "100%",
            padding: "20px",
            borderRadius: "16px",
            background: (!isProduct && isPro) 
              ? colors.primary
              : colors.card,
            border: `2px solid ${(!isProduct && isPro) ? colors.primary : colors.border}`,
            marginBottom: "32px",
            boxSizing: "border-box"
          }}>
            <div style={{ 
              color: (!isProduct && isPro) ? colors.primaryText : colors.primary, 
              fontSize: "12px", 
              fontWeight: "bold",
              marginBottom: "8px",
              textTransform: "uppercase"
            }}>
              {isProduct ? "Produit Numérique" : tierType}
            </div>
            <div style={{ 
              color: (!isProduct && isPro) ? colors.primaryText : colors.text, 
              fontSize: "18px", 
              fontWeight: "bold", 
              marginBottom: "16px" 
            }}>
              {isProduct ? productName : `Abonnement à ${creatorName}`}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ 
                color: (!isProduct && isPro) ? colors.primaryText : colors.text, 
                fontSize: "32px", 
                fontWeight: "bold" 
              }}>
                {price.toFixed(0)}
              </span>
              <span style={{ 
                color: (!isProduct && isPro) ? colors.primaryText : colors.textMuted, 
                fontSize: "14px",
                opacity: 0.7
              }}>FCFA</span>
              {!isProduct && (
                <span style={{ 
                  color: (!isProduct && isPro) ? colors.primaryText : colors.textMuted, 
                  fontSize: "12px",
                  opacity: 0.5
                }}>/mois</span>
              )}
            </div>
          </div>

          {/* 💡 INFO : Kkiapay gère le paiement */}
          <div style={{
            backgroundColor: colors.hover,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start"
          }}>
            <span style={{ fontSize: "20px" }}>🔒</span>
            <div style={{ color: colors.textMuted, fontSize: "13px", lineHeight: 1.5 }}>
              Le paiement est sécurisé par <strong style={{ color: colors.text }}>Kkiapay</strong>. 
              Vous choisirez votre opérateur (MTN, Orange, Wave...) et entrerez votre numéro directement dans l'interface Kkiapay.
            </div>
          </div>

          {/* Message d'erreur */}
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

          {/* ✅ BOUTON PAYER */}
          <button
            onClick={handlePayment}
            disabled={isLoading}
            style={{
              width: "100%",
              height: "56px",
              backgroundColor: isLoading ? colors.border : colors.primary,
              border: "none",
              borderRadius: "12px",
              color: colors.primaryText,
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 0.2s"
            }}
          >
            {isLoading ? (
              <>
                <div style={{ width: "20px", height: "20px", border: `2px solid ${colors.primaryText}33`, borderTop: `2px solid ${colors.primaryText}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                Traitement en cours...
              </>
            ) : (
              `Payer ${price.toFixed(0)} FCFA`
            )}
          </button>

          <p style={{ 
            color: colors.textMuted, 
            fontSize: "12px", 
            textAlign: "center", 
            marginTop: "16px",
            lineHeight: 1.5
          }}>
            En cliquant sur "Payer", vous serez redirigé vers l'interface sécurisée Kkiapay.
          </p>

        </div>
      </div>

      {/* MODAL DE SUCCÈS */}
      {showSuccess && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: colors.overlay,
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            backgroundColor: colors.card,
            borderRadius: "16px",
            padding: "32px 24px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ color: colors.text, fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>
              Paiement réussi !
            </h2>
            <p style={{ color: colors.textMuted, fontSize: "15px", lineHeight: 1.5, marginBottom: "24px" }}>
              {isProduct 
                ? "Vous avez acheté ce produit. Vous pouvez maintenant y accéder !" 
                : "Vous êtes maintenant abonné. Profitez du contenu exclusif !"}
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
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}