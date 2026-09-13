"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const PAYMENT_METHODS = [
  { id: 'mtn', name: 'MTN Mobile Money', color: '#FFCC00', icon: '📱' },
  { id: 'orange', name: 'Orange Money', color: '#FF6600', icon: '🍊' },
  { id: 'moov', name: 'Moov Money', color: '#0066CC', icon: '📶' },
  { id: 'wave', name: 'Wave', color: '#00BFFF', icon: '🌊' },
];

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
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>("");

  const isPro = tierType === 'pro';
  const brandViolet = "#8B5CF6";
  const brandVioletDark = "#6D28D9";

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

  // ✅ APPEL À TA FONCTION EXISTANTE 'kikiapay-payment'
  const handlePayment = async () => {
    if (!selectedMethod) {
      setError("Veuillez sélectionner un moyen de paiement.");
      return;
    }
    if (phoneNumber.trim().length < 8) {
      setError("Veuillez entrer un numéro de téléphone valide (min. 8 chiffres).");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. Appel à ta fonction Edge Supabase existante
      const { data, error: fnError } = await supabase.functions.invoke('kikiapay-payment', {
        body: {
          amount: price,
          type: paymentType === 'product' ? 'product' : 'subscription',
          reference_id: paymentType === 'product' ? productId : creatorId,
          phone: phoneNumber,
          network: selectedMethod, // ex: 'mtn', 'orange', 'wave'
        }
      });

      if (fnError) throw fnError;

      // 2. Gestion de la réponse de ta fonction
      if (data.success) {
        setShowSuccess(true);
      } else {
        throw new Error(data.message || "Le paiement a échoué.");
      }
      
    } catch (err: any) {
      console.error("❌ Erreur paiement:", err);
      setError(err.message || "Échec du paiement. Vérifiez votre solde ou réessayez.");
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
          
          {/* 📋 RÉCAPITULATIF */}
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

          {/* 💳 MÉTHODE DE PAIEMENT */}
          <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>
            Méthode de paiement
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <div
                  key={method.id}
                  onClick={() => { setSelectedMethod(method.id); setError(""); }}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    backgroundColor: isSelected ? "rgba(139, 92, 246, 0.2)" : "#1A1A1A",
                    border: `2px solid ${isSelected ? brandViolet : "#2A2A2A"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: method.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0
                  }}>
                    {method.icon}
                  </div>
                  <span style={{ flex: 1, color: "#FFF", fontSize: "15px", fontWeight: 600 }}>
                    {method.name}
                  </span>
                  {isSelected && (
                    <span style={{ color: brandViolet, fontSize: "24px" }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 📱 NUMÉRO DE TÉLÉPHONE */}
          <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>
            Numéro Mobile Money
          </h3>
          <div style={{
            backgroundColor: "#1A1A1A",
            borderRadius: "12px",
            border: "1px solid #2A2A2A",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            marginBottom: "32px"
          }}>
            <span style={{ fontSize: "20px", marginRight: "12px" }}>📱</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setError(""); }}
              placeholder="Ex: 97 XX XX XX"
              style={{
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
                padding: "16px 0",
                color: "#FFF",
                fontSize: "15px",
                outline: "none"
              }}
            />
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

          {/* ✅ BOUTON CONFIRMER */}
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || !phoneNumber || isLoading}
            style={{
              width: "100%",
              height: "56px",
              backgroundColor: (selectedMethod && phoneNumber && !isLoading) ? brandViolet : "#374151",
              border: "none",
              borderRadius: "12px",
              color: "#FFF",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: (selectedMethod && phoneNumber && !isLoading) ? "pointer" : "not-allowed",
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
              `Confirmer le paiement de ${price.toFixed(0)} FCFA`
            )}
          </button>

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
              Paiement lancé !
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: 1.5, marginBottom: "24px" }}>
              {isProduct 
                ? "Veuillez valider le retrait sur votre téléphone. Vous aurez accès au produit dès validation." 
                : `Veuillez valider le retrait sur votre téléphone pour activer votre abonnement.`}
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
              Compris
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input::placeholder { color: #555; }
      `}</style>
    </div>
  );
}