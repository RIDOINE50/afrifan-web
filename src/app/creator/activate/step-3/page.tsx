"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatorPricingScreen() {
  const router = useRouter();
  
  // 1. Récupérer les données des étapes précédentes
  const [previousData, setPreviousData] = useState<any>(null);

  // 2. États du formulaire
  const [selectedCurrency, setSelectedCurrency] = useState("XOF");
  const [premiumPrice, setPremiumPrice] = useState("");
  const [proPrice, setProPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Configuration des devises (Taux par rapport au FCFA)
  const currencies = [
    { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA', rate: 1.0 },
    { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (CEMAC)', rate: 1.0 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.00152 }, 
    { code: 'USD', symbol: '$', name: 'Dollar US', rate: 0.00165 }, 
    { code: 'GBP', symbol: '£', name: 'Livre Sterling', rate: 0.00129 },
  ];

  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  // 4. Constantes de prix en FCFA
  const PREMIUM_MIN_FCFA = 90;
  const PREMIUM_MAX_FCFA = 2000;
  const PRO_MIN_FCFA = 2001;
  const PRO_MAX_FCFA = 10000;

  // Vérification au chargement
  useEffect(() => {
    const savedData = sessionStorage.getItem('creator_activation_step2');
    if (!savedData) {
      router.push("/creator/activate/step-1");
    } else {
      setPreviousData(JSON.parse(savedData));
    }
  }, [router]);

  // --- Fonctions de conversion ---
  const convertToCurrency = (fcfaAmount: number) => (fcfaAmount * currentCurrency.rate).toFixed(2);
  const convertToFCFA = (amount: number) => Math.round(amount / currentCurrency.rate);

  // --- Validation ---
  const validatePrices = () => {
    const pPrice = parseFloat(premiumPrice);
    const prPrice = parseFloat(proPrice);

    if (isNaN(pPrice) || isNaN(prPrice)) return false;

    const pMin = parseFloat(convertToCurrency(PREMIUM_MIN_FCFA));
    const pMax = parseFloat(convertToCurrency(PREMIUM_MAX_FCFA));
    const prMin = parseFloat(convertToCurrency(PRO_MIN_FCFA));
    const prMax = parseFloat(convertToCurrency(PRO_MAX_FCFA));

    if (pPrice < pMin || pPrice > pMax) return false;
    if (prPrice < prMin || prPrice > prMax) return false;

    return true;
  };

  // --- Soumission vers l'étape finale ---
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePrices()) {
      setError(`Les prix doivent être entre ${convertToCurrency(PREMIUM_MIN_FCFA)} et ${convertToCurrency(PREMIUM_MAX_FCFA)} ${currentCurrency.symbol} pour Premium, et entre ${convertToCurrency(PRO_MIN_FCFA)} et ${convertToCurrency(PRO_MAX_FCFA)} ${currentCurrency.symbol} pour Pro.`);
      return;
    }

    setIsLoading(true);

    try {
      // Conversion finale en FCFA pour la base de données
      const premiumPriceFCFA = convertToFCFA(parseFloat(premiumPrice));
      const proPriceFCFA = convertToFCFA(parseFloat(proPrice));

      // Simulation UX (comme dans ton code Flutter)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Combiner TOUTES les données pour l'étape de paiement
      const finalActivationData = {
        ...previousData, // Contient déjà fullName, birthDate, city, category, idCardUrl, phoneVerified
        premiumPrice: premiumPriceFCFA,
        proPrice: proPriceFCFA,
        currency: selectedCurrency,
      };

      // Sauvegarder pour la dernière étape
      sessionStorage.setItem('creator_activation_final', JSON.stringify(finalActivationData));

      // Redirection vers l'étape de paiement
      router.push("/creator/activate/payment");

    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!previousData) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #262626", borderTop: "4px solid #8B5CF6", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        
        {/* Barre de progression */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#8B5CF6", fontWeight: 600, fontSize: "14px" }}>Tarification des abonnements</span>
            <span style={{ backgroundColor: "rgba(139, 92, 246, 0.2)", color: "#8B5CF6", padding: "4px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>Étape 3/3</span>
          </div>
          <div style={{ height: "6px", backgroundColor: "#1A1A1A", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ width: "85%", height: "100%", backgroundColor: "#8B5CF6", borderRadius: "8px", transition: "width 0.3s" }} />
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Définissez vos tarifs</h1>
        <p style={{ color: "#888888", fontSize: "14px", marginBottom: "24px" }}>
          Choisissez combien vos abonnés paieront pour accéder à vos contenus exclusifs.
        </p>

        {error && (
          <div style={{
            padding: "12px 16px", backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #EF4444", borderRadius: "12px",
            color: "#EF4444", fontSize: "14px", marginBottom: "24px", textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Sélecteur de devise */}
          <div style={{
            padding: "12px 16px", backgroundColor: "#161616",
            borderRadius: "12px", border: "1px solid #262626",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ color: "#FFFFFF", fontWeight: 500 }}>Devise :</span>
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value);
                setPremiumPrice(""); // Reset des prix quand la devise change
                setProPrice("");
              }}
              style={{
                backgroundColor: "transparent", color: "#FFFFFF", fontWeight: "bold",
                border: "none", outline: "none", cursor: "pointer", fontSize: "14px"
              }}
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code} style={{ backgroundColor: "#161616", color: "#FFFFFF" }}>
                  {curr.name} ({curr.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Carte Premium */}
          <PricingCard
            title="Niveau Premium"
            description="Accès aux publications standards et aux lives réservés."
            value={premiumPrice}
            onChange={setPremiumPrice}
            minText={convertToCurrency(PREMIUM_MIN_FCFA)}
            maxText={convertToCurrency(PREMIUM_MAX_FCFA)}
            symbol={currentCurrency.symbol}
          />

          {/* Carte Pro / VIP */}
          <PricingCard
            title="Niveau Pro / VIP"
            description="Accès total à tout le contenu, messagerie privée et avantages exclusifs."
            value={proPrice}
            onChange={setProPrice}
            minText={convertToCurrency(PRO_MIN_FCFA)}
            maxText={convertToCurrency(PRO_MAX_FCFA)}
            symbol={currentCurrency.symbol}
          />

          {/* Bouton Continuer */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", height: "55px", marginTop: "10px",
              backgroundColor: isLoading ? "#4B5563" : "#8B5CF6",
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
              "Continuer vers le paiement"
            )}
          </button>

        </form>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

// --- Composant Carte de Prix Réutilisable ---
function PricingCard({ 
  title, description, value, onChange, minText, maxText, symbol 
}: { 
  title: string, description: string, value: string, onChange: (val: string) => void, minText: string, maxText: string, symbol: string 
}) {
  return (
    <div style={{
      padding: "16px", backgroundColor: "#161616",
      borderRadius: "16px", border: "1px solid #262626"
    }}>
      <div style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>{title}</div>
      <div style={{ color: "#888888", fontSize: "13px", marginBottom: "16px" }}>{description}</div>
      
      <div style={{ position: "relative" }}>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Recommandé : ${minText} - ${maxText}`}
          style={{
            width: "100%", padding: "14px 16px", paddingRight: "50px",
            backgroundColor: "#0A0A0A", border: "1px solid #262626",
            borderRadius: "12px", color: "#FFFFFF", fontSize: "16px", outline: "none", boxSizing: "border-box"
          }}
        />
        <span style={{
          position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
          color: "#888888", fontSize: "14px", fontWeight: "bold", pointerEvents: "none"
        }}>
          {symbol}
        </span>
      </div>
      <div style={{ color: "#666666", fontSize: "11px", marginTop: "6px" }}>
        Plage autorisée : {minText} à {maxText} {symbol}
      </div>
    </div>
  );
}