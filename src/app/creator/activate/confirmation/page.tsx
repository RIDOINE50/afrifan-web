"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmationScreen() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textSecondary: "#888888",
    green: "#22C55E",
    red: "#EF4444",
  };

  useEffect(() => {
    submitApplication();
  }, []);

  const submitApplication = async () => {
    try {
      console.log("📤 Envoi final de la demande créateur à Supabase...");

      // 1. Récupérer les données accumulées (y compris les infos de paiement de l'étape précédente)
      const finalDataStr = sessionStorage.getItem("creator_activation_final");
      if (!finalDataStr) {
        throw new Error("Données de candidature introuvables. Veuillez recommencer.");
      }
      const data = JSON.parse(finalDataStr);

      // 2. Vérifier l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté.");

      // 3. Insertion dans la table creator_applications
      const { error } = await supabase.from("creator_applications").insert({
        user_id: user.id,
        full_name: data.fullName,
        birth_date: data.birthDate || null,
        city: data.city,
        category: data.category,
        id_card_url: data.idCardUrl,
        phone_verified: data.phoneVerified,
        premium_price: data.premiumPrice,
        pro_price: data.proPrice,
        currency: data.currency,
        payment_method: data.paymentMethod,
        payment_account_number: data.paymentAccountNumber,
        payment_holder_name: data.paymentHolderName,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      console.log("✅ Demande créateur enregistrée avec succès !");

      // 4. Nettoyage du sessionStorage
      sessionStorage.removeItem("creator_activation_step1");
      sessionStorage.removeItem("creator_activation_step2");
      sessionStorage.removeItem("creator_activation_final");

      setIsSuccess(true);
    } catch (err: any) {
      console.error("❌ ERREUR LORS DE L'INSERTION SUPABASE:", err);
      setErrorMessage(err.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "30px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid #2A2A2A", borderTop: `3px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }}></div>
          <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>Envoi de votre demande...</h2>
          <p style={{ color: colors.textSecondary, fontSize: "14px" }}>Veuillez ne pas quitter la page.</p>
        </div>
      </div>
    );
  }

  // Écran d'erreur
  if (!isSuccess && errorMessage) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "30px" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "80px", color: colors.red, marginBottom: "24px" }}>⚠️</div>
          <h2 style={{ color: colors.text, fontSize: "20px", fontWeight: "bold", marginBottom: "16px" }}>Une erreur est survenue</h2>
          <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "32px", lineHeight: "1.5" }}>{errorMessage}</p>
          <button
            onClick={submitApplication}
            style={{
              width: "100%", height: "55px", backgroundColor: colors.primary, border: "none", borderRadius: "16px",
              color: "#FFFFFF", fontSize: "16px", fontWeight: "bold", cursor: "pointer"
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Écran de succès
  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, display: "flex", flexDirection: "column", padding: "30px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: "500px", margin: "0 auto", width: "100%" }}>
        
        {/* Icône de succès */}
        <div style={{
          width: "100px", height: "100px", borderRadius: "50%",
          backgroundColor: colors.card, border: `2px solid ${colors.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "30px"
        }}>
          <span style={{ fontSize: "60px", color: colors.green }}>✅</span>
        </div>

        <h1 style={{ color: colors.text, fontSize: "24px", fontWeight: "bold", textAlign: "center", marginBottom: "16px", lineHeight: "1.3" }}>
          Votre demande a été envoyée<br />avec succès !
        </h1>
        
        <p style={{ color: colors.textSecondary, fontSize: "14px", textAlign: "center", lineHeight: "1.5", marginBottom: "30px" }}>
          Notre équipe vérifie vos informations<br />sous 24 à 48h.<br />Vous recevrez une notification.
        </p>

        {/* Carte de statut */}
        <div style={{
          width: "100%", padding: "20px", backgroundColor: colors.card,
          borderRadius: "16px", border: `1px solid ${colors.border}`, marginBottom: "40px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>⏳</span>
            <span style={{ color: colors.text, fontSize: "16px", fontWeight: 600 }}>En cours de vérification</span>
          </div>
          <div style={{ height: "6px", backgroundColor: colors.border, borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: colors.primary, borderRadius: "8px", animation: "pulse 2s infinite" }}></div>
          </div>
        </div>

        {/* Bouton d'action */}
        <button
          onClick={() => router.replace("/profile")} // Redirige vers le profil et remplace l'historique
          style={{
            width: "100%", height: "55px", backgroundColor: colors.primary, border: "none", borderRadius: "16px",
            color: "#FFFFFF", fontSize: "16px", fontWeight: "bold", cursor: "pointer",
            boxShadow: `0 4px 14px ${colors.primary}40`
          }}
        >
          Retour à mon profil
        </button>

      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}