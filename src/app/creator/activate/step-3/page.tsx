"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function CreatorPricingScreen() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  const [previousData, setPreviousData] = useState<any>(null);

  const [selectedCurrency, setSelectedCurrency] = useState("XOF");
  const [premiumPrice, setPremiumPrice] = useState("");
  const [proPrice, setProPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Erreurs par champ
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [proError, setProError] = useState<string | null>(null);

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
    red: "#EF4444",
  };

  const currencies = [
    { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA', rate: 1.0 },
    { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (CEMAC)', rate: 1.0 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.00152 },
    { code: 'USD', symbol: '$', name: 'Dollar US', rate: 0.00165 },
    { code: 'GBP', symbol: '£', name: 'Livre Sterling', rate: 0.00129 },
  ];

  const currentCurrency = currencies.find(c => c.code === selectedCurrency) || currencies[0];

  const PREMIUM_MIN_FCFA = 90;
  const PREMIUM_MAX_FCFA = 2000;
  const PRO_MIN_FCFA = 2001;
  const PRO_MAX_FCFA = 10000;

  useEffect(() => {
    const savedData = sessionStorage.getItem('creator_activation_step2');
    if (!savedData) {
      router.push("/creator/activate/step-1");
    } else {
      setPreviousData(JSON.parse(savedData));
    }
  }, [router]);

  const convertToCurrency = (fcfaAmount: number) => (fcfaAmount * currentCurrency.rate).toFixed(2);
  const convertToFCFA = (amount: number) => Math.round(amount / currentCurrency.rate);

  // ✅ Validation Premium
  const validatePremium = (value: string): string | null => {
    if (!value.trim()) return "Le prix Premium est obligatoire.";
    const price = parseFloat(value);
    if (isNaN(price)) return "Entrez un montant valide.";
    const min = parseFloat(convertToCurrency(PREMIUM_MIN_FCFA));
    const max = parseFloat(convertToCurrency(PREMIUM_MAX_FCFA));
    if (price < min) return `Le prix minimum est ${convertToCurrency(PREMIUM_MIN_FCFA)} ${currentCurrency.symbol}.`;
    if (price > max) return `Le prix maximum est ${convertToCurrency(PREMIUM_MAX_FCFA)} ${currentCurrency.symbol}.`;
    return null;
  };

  // ✅ Validation Pro / VIP
  const validatePro = (value: string): string | null => {
    if (!value.trim()) return "Le prix Pro / VIP est obligatoire.";
    const price = parseFloat(value);
    if (isNaN(price)) return "Entrez un montant valide.";
    const min = parseFloat(convertToCurrency(PRO_MIN_FCFA));
    const max = parseFloat(convertToCurrency(PRO_MAX_FCFA));
    if (price < min) return `Le prix minimum est ${convertToCurrency(PRO_MIN_FCFA)} ${currentCurrency.symbol}.`;
    if (price > max) return `Le prix maximum est ${convertToCurrency(PRO_MAX_FCFA)} ${currentCurrency.symbol}.`;
    return null;
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pErr = validatePremium(premiumPrice);
    const prErr = validatePro(proPrice);

    setPremiumError(pErr);
    setProError(prErr);

    // ❌ Si au moins une erreur, on arrête là (les messages sont affichés sous chaque champ)
    if (pErr || prErr) return;

    setIsLoading(true);

    try {
      const premiumPriceFCFA = convertToFCFA(parseFloat(premiumPrice));
      const proPriceFCFA = convertToFCFA(parseFloat(proPrice));

      await new Promise(resolve => setTimeout(resolve, 500));

      const finalActivationData = {
        ...previousData,
        premiumPrice: premiumPriceFCFA,
        proPrice: proPriceFCFA,
        currency: selectedCurrency,
      };

      sessionStorage.setItem('creator_activation_final', JSON.stringify(finalActivationData));
      router.push("/creator/activate/payment");

    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!previousData) {
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
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: colors.primary, fontWeight: 600, fontSize: "14px" }}>Tarification des abonnements</span>
            <span style={{ backgroundColor: colors.hover, color: colors.primary, padding: "4px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>Étape 3/3</span>
          </div>
          <div style={{ height: "6px", backgroundColor: colors.card, borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ width: "85%", height: "100%", backgroundColor: colors.primary, borderRadius: "8px", transition: "width 0.3s" }} />
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Définissez vos tarifs</h1>
        <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "24px" }}>
          Choisissez combien vos abonnés paieront pour accéder à vos contenus exclusifs.
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

        <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Sélecteur de devise */}
          <div style={{
            padding: "12px 16px", backgroundColor: colors.card,
            borderRadius: "12px", border: `1px solid ${colors.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ color: colors.text, fontWeight: 500 }}>Devise :</span>
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value);
                setPremiumPrice("");
                setProPrice("");
                setPremiumError(null);
                setProError(null);
              }}
              style={{
                backgroundColor: "transparent", color: colors.text, fontWeight: "bold",
                border: "none", outline: "none", cursor: "pointer", fontSize: "14px"
              }}
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code} style={{ backgroundColor: colors.card, color: colors.text }}>
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
            onChange={(v) => {
              setPremiumPrice(v);
              if (premiumError) setPremiumError(null);
            }}
            minText={convertToCurrency(PREMIUM_MIN_FCFA)}
            maxText={convertToCurrency(PREMIUM_MAX_FCFA)}
            symbol={currentCurrency.symbol}
            colors={colors}
            error={premiumError}
          />

          {/* Carte Pro / VIP */}
          <PricingCard
            title="Niveau Pro / VIP"
            description="Accès total à tout le contenu, messagerie privée et avantages exclusifs."
            value={proPrice}
            onChange={(v) => {
              setProPrice(v);
              if (proError) setProError(null);
            }}
            minText={convertToCurrency(PRO_MIN_FCFA)}
            maxText={convertToCurrency(PRO_MAX_FCFA)}
            symbol={currentCurrency.symbol}
            colors={colors}
            error={proError}
          />

          {/* Bouton Continuer */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", height: "55px", marginTop: "10px",
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

function PricingCard({
  title, description, value, onChange, minText, maxText, symbol, colors, error
}: {
  title: string,
  description: string,
  value: string,
  onChange: (val: string) => void,
  minText: string,
  maxText: string,
  symbol: string,
  colors: any,
  error?: string | null
}) {
  return (
    <div style={{
      padding: "16px", backgroundColor: colors.card,
      borderRadius: "16px",
      border: `1px solid ${error ? colors.red : colors.border}`
    }}>
      <div style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>{title}</div>
      <div style={{ color: colors.textMuted, fontSize: "13px", marginBottom: "16px" }}>{description}</div>

      <div style={{ position: "relative" }}>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Recommandé : ${minText} - ${maxText}`}
          style={{
            width: "100%", padding: "14px 16px", paddingRight: "50px",
            backgroundColor: colors.bg,
            border: `1px solid ${error ? colors.red : colors.border}`,
            borderRadius: "12px", color: colors.text, fontSize: "16px",
            outline: "none", boxSizing: "border-box"
          }}
        />
        <span style={{
          position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
          color: colors.textMuted, fontSize: "14px", fontWeight: "bold", pointerEvents: "none"
        }}>
          {symbol}
        </span>
      </div>

      {error ? (
        <div style={{ color: colors.red, fontSize: "12px", marginTop: "6px", fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      ) : (
        <div style={{ color: colors.textMuted, fontSize: "11px", marginTop: "6px", opacity: 0.7 }}>
          Plage autorisée : {minText} à {maxText} {symbol}
        </div>
      )}
    </div>
  );
}