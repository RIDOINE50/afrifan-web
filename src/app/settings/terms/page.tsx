"use client";

import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
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
      
      {/* AppBar */}
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
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Conditions Générales</h1>
      </div>

      {/* Corps de la page (Scrollable) */}
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Section 1 */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            1. Acceptation des conditions
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>
            En utilisant l'application Afrifan, vous acceptez pleinement les présentes conditions générales d'utilisation.
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            2. Contenu des utilisateurs
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>
            Les créateurs sont seuls responsables du contenu qu'ils publient. Tout contenu illégal ou offensant entraînera la suppression immédiate du compte.
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: colors.text, fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            3. Abonnements et remboursements
          </h2>
          <p style={{ color: colors.textMuted, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>
            Les abonnements sont facturés mensuellement. Les remboursements ne sont pas garantis sauf en cas de dysfonctionnement technique avéré de notre part.
          </p>
        </div>

      </div>
    </div>
  );
}