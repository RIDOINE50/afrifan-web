"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const colors = {
    bg: "#000000",
    text: "#FFFFFF",
    textMuted: "#9CA3AF", // Équivalent de Colors.grey dans Flutter
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: colors.bg, 
      color: colors.text, 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    }}>
      
      {/* AppBar (Header) */}
      <div style={{ 
        position: "sticky", top: 0, zIndex: 50, backgroundColor: colors.bg, 
        borderBottom: "1px solid #1A1A1A", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ background: "none", border: "none", color: colors.text, fontSize: "24px", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Politique de confidentialité</h1>
      </div>

      {/* Corps de la page (Scrollable) */}
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Section 1 */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            Collecte des données
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "15px", lineHeight: 1.5, margin: 0 }}>
            Nous collectons uniquement les données nécessaires au fonctionnement de l'application : nom, email, et données de paiement sécurisées.
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            Utilisation des données
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "15px", lineHeight: 1.5, margin: 0 }}>
            Vos données ne sont jamais vendues à des tiers. Elles servent uniquement à améliorer votre expérience et à assurer la sécurité de la plateforme.
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            Vos droits
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "15px", lineHeight: 1.5, margin: 0 }}>
            Conformément à la loi, vous avez un droit d'accès, de modification et de suppression de vos données personnelles à tout moment.
          </p>
        </div>

      </div>
    </div>
  );
}