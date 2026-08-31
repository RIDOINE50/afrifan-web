"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FaqPage() {
  const router = useRouter();

  const colors = {
    bg: "#000000",
    card: "#1A1A1A",
    text: "#FFFFFF",
    textMuted: "#9CA3AF",
    primary: "#8B5CF6",
  };

  const faqs = [
    {
      question: "Comment m'abonner à un créateur ?",
      answer: "Allez sur le profil du créateur et cliquez sur le bouton \"S'abonner\". Le paiement est sécurisé.",
    },
    {
      question: "Comment supprimer mon compte ?",
      answer: "Rendez-vous dans Paramètres > À propos > Supprimer mon compte.",
    },
    {
      question: "Mes paiements sont-ils sécurisés ?",
      answer: "Oui, toutes les transactions sont chiffrées et traitées par des prestataires agréés.",
    },
  ];

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: colors.bg, 
      color: colors.text, 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    }}>
      
      {/* Header */}
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
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Aide & FAQ</h1>
      </div>

      {/* Liste des FAQ */}
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        {faqs.map((faq, index) => (
          <div key={index}>
            <FaqItem 
              question={faq.question} 
              answer={faq.answer} 
              colors={colors} 
            />
            {index < faqs.length - 1 && <div style={{ height: "12px" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Composant Accordéon (équivalent de ExpansionTile) ---

function FaqItem({ question, answer, colors }: { question: string; answer: string; colors: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      style={{ 
        backgroundColor: colors.card, 
        borderRadius: "12px", 
        overflow: "hidden",
        transition: "all 0.3s ease"
      }}
    >
      {/* En-tête cliquable */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: "16px 20px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          cursor: "pointer",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <span style={{ 
          color: colors.text, 
          fontWeight: "bold", 
          fontSize: "15px",
          flex: 1,
          paddingRight: "16px"
        }}>
          {question}
        </span>
        <span 
          style={{ 
            color: colors.textMuted, 
            fontSize: "20px",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            flexShrink: 0
          }}
        >
          ▼
        </span>
      </div>

      {/* Contenu expansible */}
      {isOpen && (
        <div 
          style={{ 
            padding: "0 20px 16px 20px",
            animation: "fadeIn 0.3s ease"
          }}
        >
          <p style={{ 
            color: colors.textMuted, 
            fontSize: "14px", 
            lineHeight: 1.5, 
            margin: 0 
          }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}