"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Déclaration TypeScript pour Kkiapay (ajouté au window)
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
  const brandViolet = "#8B5CF6";
  const brandVioletDark = "#6D28D9";

  // ✅ TA CLÉ PUBLIQUE KKIAPAY (la même que sur mobile)
  const kkiapayPublicKey = "72fc173fbe56f0f477e6bfcaa7349471c844e893";
  const isSandbox = false; // false = production (vrai argent), true = test

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

    // ✅ Paiement réussi
    window.addKkiapayListener('success', async (response: any) => {
      console.log("✅ Paiement Kkiapay réussi:", response);
      
      // On récupère l'ID qu'on a passé dans 'data' (comme sur mobile)
      const referenceId = response?.data || (paymentType === 'product' ? productId : creatorId);
      const transactionId = response?.transactionId || response?.transaction_id;
      
      await verifyAndConfirmPayment(transactionId, referenceId);
    });

    // ❌ Paiement échoué
    window.addKkiapayListener('failed', (err: any) => {
      console.error("❌ Paiement échoué:", err);
      setError("Échec du paiement. Vérifiez votre solde ou réessayez.");
      setIsLoading(false);
    });

    // 🚫 Paiement annulé par l'utilisateur
    window.addKkiapayListener('cancelled', () => {
      setError("Paiement annulé.");
      setIsLoading(false);
    });

    // Nettoyage quand on quitte la page
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

    // ✅ EXACTEMENT comme sur mobile : on ouvre le widget Kkiapay
    window.openKkiapayWidget({
      amount: Math.round(price),
      key: kkiapayPublicKey,
      sandbox: isSandbox,
      // On passe l'ID (creatorId ou productId) pour le retrouver après paiement
      data: paymentType === 'product' ? productId : creatorId,
      theme: brandViolet,
      name: creatorName,
      reason: paymentType === 'product' 
        ? `Achat de ${productName}` 
        : `Abonnement à ${creatorName}`,
      // Tu peux limiter les pays comme sur mobile
      countries: ["BJ", "CI", "SN", "TG"],
    });
  };

  // ==========================================
  // 4. APPEL À LA MÊME FONCTION EDGE QUE MOBILE
  // ==========================================
  const verifyAndConfirmPayment = async (transactionId: string, referenceId: string | null) => {
    try {
      if (!user) throw new Error("Utilisateur non connecté");

      // 🔥 MÊME FONCTION EDGE QUE LE MOBILE : 'kkiapay-webhook'
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
      backgroundColor: "#000000", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "#0A0A0A",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        border: "1px solid #2A2A2A"
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: "16px 20px", 
          display: "flex", 
          alignItems: "center", 
          gap: "16px",
          borderBottom: "1px solid #2A2A2A"
        }}>
          <button 
            onClick={() => router.back()}
            style={{ background: "none", border: "none", color: "#FFF", fontSize: "24px", cursor: "pointer", padding: "4px" }}
          >
            ←
          </button>
          <h1 style={{ color: "#FFF", fontSize: "18px", fontWeight: "bold", margin: 0 }}>
            {isProduct ? "Finaliser l'achat" : "Finaliser l'abonnement"}
          </h1>
        </div>

        <div style={{ padding: "24px 20px", maxHeight: "80vh", overflowY: "auto" }}>
          
          {/* 📋 RÉCAPITULATIF (inchangé) */}
          <div style={{
            width: "100%",
            padding: "20px",
            borderRadius: "16px",
            background: (!isProduct && isPro) 
              ? `linear-gradient(135deg, ${brandViolet}, ${brandVioletDark})` 
              : "linear-gradient(135deg, #1A1A1A, #1A1A1A)",
            border: `2px solid ${(!isProduct && isPro) ? brandViolet : "#333"}`,
            marginBottom: "32px",
            boxSizing: "border-box"
          }}>
            <div style={{ 
              color: (!isProduct && isPro) ? "#FFF" : brandViolet, 
              fontSize: "12px", 
              fontWeight: "bold",
              marginBottom: "8px",
              textTransform: "uppercase"
            }}>
              {isProduct ? "Produit Numérique" : tierType}
            </div>
            <div style={{ color: "#FFF", fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
              {isProduct ? productName : `Abonnement à ${creatorName}`}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ color: "#FFF", fontSize: "32px", fontWeight: "bold" }}>
                {price.toFixed(0)}
              </span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>FCFA</span>
              {!isProduct && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>/mois</span>}
            </div>
          </div>

          {/* 💡 INFO : Kkiapay gère le paiement */}
          <div style={{
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            border: `1px solid ${brandViolet}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start"
          }}>
            <span style={{ fontSize: "20px" }}>🔒</span>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", lineHeight: 1.5 }}>
              Le paiement est sécurisé par <strong style={{ color: brandViolet }}>Kkiapay</strong>. 
              Vous choisirez votre opérateur (MTN, Orange, Wave...) et entrerez votre numéro directement dans l'interface Kkiapay.
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div style={{ 
              backgroundColor: "rgba(239, 68, 68, 0.1)", 
              border: "1px solid #EF4444", 
              borderRadius: "8px", 
              padding: "12px", 
              marginBottom: "16px",
              color: "#EF4444",
              fontSize: "14px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          {/* ✅ BOUTON PAYER (ouvre Kkiapay) */}
          <button
            onClick={handlePayment}
            disabled={isLoading}
            style={{
              width: "100%",
              height: "56px",
              backgroundColor: isLoading ? "#374151" : brandViolet,
              border: "none",
              borderRadius: "12px",
              color: "#FFF",
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
                <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #FFF", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                Traitement en cours...
              </>
            ) : (
              `Payer ${price.toFixed(0)} FCFA`
            )}
          </button>

          <p style={{ 
            color: "rgba(255,255,255,0.4)", 
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
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#1A1A1A",
            borderRadius: "16px",
            padding: "32px 24px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            border: "1px solid #2A2A2A"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ color: "#FFF", fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>
              Paiement réussi !
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: 1.5, marginBottom: "24px" }}>
              {isProduct 
                ? "Vous avez acheté ce produit. Vous pouvez maintenant y accéder !" 
                : "Vous êtes maintenant abonné. Profitez du contenu exclusif !"}
            </p>
            <button
              onClick={handleSuccessClose}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: brandViolet,
                border: "none",
                borderRadius: "12px",
                color: "#FFF",
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