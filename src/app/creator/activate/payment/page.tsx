"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function PaymentInfoStep() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
  const [finalData, setFinalData] = useState<any>(null);

  const [selectedOperator, setSelectedOperator] = useState("mtn");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Couleurs dynamiques (avec textMuted ajouté)
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textSecondary: theme.textMuted,
    textMuted: theme.textMuted,   // ✅ AJOUTÉ pour corriger l'erreur TS
    hover: theme.hover,
    mtn: "#FFCC00",
    moov: "#00B2A9",
    orange: "#FF6600",
    red: "#EF4444",
  };

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
      const completeFinalData = {
        ...finalData,
        paymentMethod: selectedOperator,
        paymentAccountNumber: accountNumber.trim(),
        paymentHolderName: accountHolder.trim(),
      };

      sessionStorage.setItem('creator_activation_final', JSON.stringify(completeFinalData));
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
        
        {/* Barre de progression */}
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: colors.primary, fontWeight: 600, fontSize: "14px" }}>Finalisation</span>
            <span style={{ backgroundColor: colors.hover, color: colors.primary, padding: "4px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>3/3</span>
          </div>
          <div style={{ height: "6px", backgroundColor: colors.card, borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: colors.primary, borderRadius: "8px" }} />
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "12px" }}>Informations de paiement</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "30px" }}>
          Où souhaitez-vous recevoir vos gains ?
        </p>

        {error && (
          <div style={{
            padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)",
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
                      border: `2px solid ${isSelected ? op.color : colors.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px", fontWeight: "bold", color: isSelected ? op.color : colors.textMuted,
                      transition: "all 0.2s"
                    }}>
                      {op.name[0]}
                    </div>
                    <span style={{ color: isSelected ? op.color : colors.textMuted, fontSize: "14px", fontWeight: isSelected ? "bold" : "normal" }}>
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
              backgroundColor: isLoading ? colors.border : colors.primary,
              border: "none", borderRadius: "16px",
              color: colors.primaryText, fontSize: "16px", fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "background 0.2s"
            }}
          >
            {isLoading ? (
              <div style={{ width: "24px", height: "24px", border: `3px solid ${colors.primaryText}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
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