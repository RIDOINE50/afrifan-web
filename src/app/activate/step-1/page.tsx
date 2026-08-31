"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PersonalInfoStep() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const categories = [
    'Musique', 'Humour', 'Éducation', 'Sport', 'Mode', 
    'Cuisine', 'Art & Design', 'Technologie', 'Autre'
  ];

  const colors = {
    bg: "#0A0A0A",
    card: "#1A1A1A",
    border: "#333333",
    primary: "#8B5CF6",
    text: "#FFFFFF",
    textSecondary: "#9CA3AF",
    hint: "#6B7280",
    red: "#EF4444",
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validations (équivalent du FormValidator Flutter)
    if (!fullName.trim()) {
      setError("Le nom complet est requis.");
      return;
    }
    if (!birthDate) {
      setError("La date de naissance est requise.");
      return;
    }
    if (!city.trim()) {
      setError("La ville / pays est requis.");
      return;
    }
    if (!category) {
      setError("Veuillez sélectionner une catégorie.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Sauvegarder les données dans sessionStorage pour les passer à l'étape suivante
      // (Équivalent de passer les props au IdentityVerificationStep en Flutter)
      sessionStorage.setItem('creator_activation_step1', JSON.stringify({
        fullName: fullName.trim(),
        birthDate: birthDate,
        city: city.trim(),
        category: category,
      }));

      // Simuler un petit délai pour l'effet de chargement (comme dans ton code Flutter)
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. Rediriger vers l'étape 2
      router.push("/creator/activate/step-2");
      
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        
        {/* Barre de progression */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ color: colors.primary, fontWeight: "bold", fontSize: "14px" }}>Étape 1/3</span>
            <span style={{ color: colors.textSecondary, fontSize: "14px" }}>33%</span>
          </div>
          <div style={{ height: "6px", backgroundColor: colors.border, borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: "33%", height: "100%", backgroundColor: colors.primary, borderRadius: "3px", transition: "width 0.3s" }} />
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Informations personnelles</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "32px" }}>
          Remplissez ces informations pour compléter votre profil
        </p>

        {/* Message d'erreur */}
        {error && (
          <div style={{
            padding: "12px 16px", backgroundColor: `${colors.red}1A`,
            border: `1px solid ${colors.red}`, borderRadius: "12px",
            color: colors.red, fontSize: "14px", marginBottom: "24px", textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Nom complet */}
          <div>
            <label style={{ display: "block", color: colors.textSecondary, fontSize: "14px", marginBottom: "8px" }}>Nom complet</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.primary, fontSize: "22px" }}>👤</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Jean Dupont"
                style={{
                  width: "100%", padding: "18px 16px 18px 48px",
                  backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Date de naissance */}
          <div>
            <label style={{ display: "block", color: colors.textSecondary, fontSize: "14px", marginBottom: "8px" }}>Date de naissance</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.primary, fontSize: "22px" }}>📅</span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]} // Empêche de choisir une date future
                style={{
                  width: "100%", padding: "18px 16px 18px 48px",
                  backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box",
                  colorScheme: "dark" // Force le calendrier en mode sombre
                }}
              />
            </div>
          </div>

          {/* Ville / Pays */}
          <div>
            <label style={{ display: "block", color: colors.textSecondary, fontSize: "14px", marginBottom: "8px" }}>Ville / Pays</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.primary, fontSize: "22px" }}>📍</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Cotonou, Bénin"
                style={{
                  width: "100%", padding: "18px 16px 18px 48px",
                  backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label style={{ display: "block", color: colors.textSecondary, fontSize: "14px", marginBottom: "8px" }}>Catégorie de contenu</label>
            <div style={{ position: "relative" }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%", padding: "18px 16px",
                  backgroundColor: colors.card, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", 
                  color: category ? colors.text : colors.textSecondary, 
                  fontSize: "15px", outline: "none", boxSizing: "border-box",
                  appearance: "none", cursor: "pointer"
                }}
              >
                <option value="" disabled>Sélectionnez une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: colors.primary, fontSize: "28px", pointerEvents: "none" }}>▼</span>
            </div>
          </div>

          {/* Bouton Suivant */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%", height: "55px", marginTop: "14px",
              backgroundColor: isLoading ? colors.textSecondary : colors.primary,
              border: "none", borderRadius: "16px",
              color: "#FFFFFF", fontSize: "16px", fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "background 0.2s"
            }}
          >
            {isLoading ? (
              <div style={{ width: "24px", height: "24px", border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
            ) : (
              "Suivant"
            )}
          </button>

        </form>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        select option { background-color: ${colors.card}; color: ${colors.text}; }
        /* Force l'icône du calendrier en blanc pour le mode sombre */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}