"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentInfoStep() {
  const router = useRouter();
  
  // 1. Récupérer TOUTES les données accumulées
  const [finalData, setFinalData] = useState<any>(null);

  // 2. États du formulaire
  const [selectedOperator, setSelectedOperator] = useState("mtn");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#2A2A2A",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textSecondary: "#888888",
    hint: "#555555",
    mtn: "#FFCC00",
    moov: "#00B2A9",
    orange: "#FF6600",
    red: "#EF4444",
  };

  // Vérification au chargement
  useEffect(() => {
    const savedData = sessionStorage.getItem('creator_activation_final');
    if (!savedData) {
      router.push("/creator/activate/step-1");
    } else {
      setFinalData(JSON.parse(savedData));
    }
  }, [router]);

  const operators = [
    { id: "mtn", name: "MTN", color: colors.mtn, icon: "📱" },
    { id: "moov", name: "Moov", color: colors.moov, icon: "📲" },
    { id: "orange", name: "Orange", color: colors.orange, icon: "📞" },
  ];

  const currentOperator = operators.find(op => op.id === selectedOperator) || operators[0];

  // 3. ✅ MODIFIÉ : On ne fait PLUS l'insertion ici, on prépare juste les données
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountNumber.trim()) {
      setError("Veuillez entrer le numéro de compte.");
      return;
    }
    if (!accountHolder.trim()) {
      setError("Veuillez entrer le nom du titulaire du compte.");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ AJOUTER les infos de paiement aux données existantes
      const completeFinalData = {
        ...finalData, // Contient déjà : fullName, birthDate, city, category, idCardUrl, phoneVerified, premiumPrice, proPrice, currency
        paymentMethod: selectedOperator,
        paymentAccountNumber: accountNumber.trim(),
        paymentHolderName: accountHolder.trim(),
      };

      // ✅ Sauvegarder le paquet COMPLET pour l'écran de confirmation
      sessionStorage.setItem('creator_activation_final', JSON.stringify(completeFinalData));

      // ✅ Redirection vers l'écran de confirmation (qui fera l'insertion Supabase)
      router.push("/creator/activate/confirmation");
      
    } catch (err: any) {
      console.error("❌ Erreur préparation données:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!finalData) {
    return (
      <div style={{ height: "100vh", backgroundColor: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTop: `4px solid ${colors.primary}`, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        
        {/* Barre de progression (100%) */}
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: colors.primary, fontWeight: 600, fontSize: "14px" }}>Finalisation</span>
            <span style={{ backgroundColor: `${colors.primary}33`, color: colors.primary, padding: "4px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>3/3</span>
          </div>
          <div style={{ height: "6px", backgroundColor: "#1A1A1A", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: colors.primary, borderRadius: "8px" }} />
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "12px" }}>Informations de paiement</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "30px" }}>
          Où souhaitez-vous recevoir vos gains ?
        </p>

        {error && (
          <div style={{
            padding: "12px 16px", backgroundColor: `${colors.red}1A`,
            border: `1px solid ${colors.red}`, borderRadius: "12px",
            color: colors.red, fontSize: "14px", marginBottom: "24px", textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Sélecteur d'opérateur */}
          <div style={{ backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}`, padding: "16px" }}>
            <div style={{ color: colors.text, fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Choisissez votre opérateur</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {operators.map((op) => {
                const isSelected = selectedOperator === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setSelectedOperator(op.id)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                      background: "none", border: "none", cursor: "pointer", padding: 0
                    }}
                  >
                    <div style={{
                      width: "70px", height: "70px", borderRadius: "50%",
                      backgroundColor: isSelected ? `${op.color}33` : colors.bg,
                      border: `2px solid ${isSelected ? op.color : "#374151"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px", fontWeight: "bold", color: isSelected ? op.color : "#6B7280",
                      transition: "all 0.2s"
                    }}>
                      {op.name[0]}
                    </div>
                    <span style={{ color: isSelected ? op.color : "#6B7280", fontSize: "14px", fontWeight: isSelected ? "bold" : "normal" }}>
                      {op.name}
                    </span>
                    {isSelected && <div style={{ width: "20px", height: "3px", backgroundColor: op.color, borderRadius: "2px" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carte de l'opérateur sélectionné */}
          <div style={{
            backgroundColor: currentOperator.color,
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px"
            }}>
              {currentOperator.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: currentOperator.id === 'mtn' ? "#000000" : "#FFFFFF", fontSize: "18px", fontWeight: "bold" }}>
                {currentOperator.name} Mobile Money
              </div>
              <div style={{ color: currentOperator.id === 'mtn' ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)", fontSize: "13px" }}>
                Retrait rapide et sécurisé
              </div>
            </div>
            <span style={{ fontSize: "28px", color: "#FFFFFF" }}>✅</span>
          </div>

          {/* Champs de saisie */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", color: colors.textSecondary, fontSize: "14px", marginBottom: "8px" }}>Numéro de compte</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.primary, fontSize: "20px" }}>📱</span>
                <input
                  type="tel"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ex: 97 XX XX XX"
                  style={{
                    width: "100%", padding: "16px 16px 16px 48px",
                    backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                    borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: colors.textSecondary, fontSize: "14px", marginBottom: "8px" }}>Nom du titulaire du compte</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.primary, fontSize: "20px" }}>👤</span>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Doit correspondre à votre pièce d'identité"
                  style={{
                    width: "100%", padding: "16px 16px 16px 48px",
                    backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                    borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", height: "55px", marginTop: "16px",
              backgroundColor: isLoading ? "#4B5563" : colors.primary,
              border: "none", borderRadius: "16px",
              color: "#FFFFFF", fontSize: "16px", fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "background 0.2s"
            }}
          >
            {isLoading ? (
              <div style={{ width: "24px", height: "24px", border: "3px solid white", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            ) : (
              "Continuer vers confirmation"
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