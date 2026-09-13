"use client";

import { useRouter } from "next/navigation";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function CreatorInfoPage() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  // ✅ Couleurs dynamiques
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textMuted: theme.textMuted,
    textSecondary: theme.textMuted,
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "40px" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "50px", marginBottom: "10px" }}>👑</div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 10px 0" }}>Devenir Créateur sur Afrifan</h1>
          <p style={{ color: colors.textMuted, fontSize: "16px" }}>Tout ce que tu dois savoir pour monétiser ta passion.</p>
        </div>

        {/* Section 1: Activation */}
        <div style={{ backgroundColor: colors.card, borderRadius: "16px", padding: "20px", marginBottom: "20px", border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: colors.primary }}>🚀 1. Activer son compte</h2>
          <ul style={{ paddingLeft: "20px", color: colors.text, lineHeight: "1.6" }}>
            <li>Va dans ton profil et clique sur <b>"Deviens créateur"</b>.</li>
            <li>Remplis le formulaire avec tes informations et ta pièce d'identité.</li>
            <li>Notre équipe vérifie ton dossier sous <b>24h à 48h</b>.</li>
            <li>Une fois validé, ton badge <b>Créateur Vérifié ✓</b> s'active automatiquement.</li>
          </ul>
        </div>

        {/* Section 2: Gagner de l'argent */}
        <div style={{ backgroundColor: colors.card, borderRadius: "16px", padding: "20px", marginBottom: "20px", border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: colors.primary }}>💰 2. Gagner de l'argent</h2>
          <ul style={{ paddingLeft: "20px", color: colors.text, lineHeight: "1.6" }}>
            <li><b>Pourboires (Tips) :</b> Tes fans peuvent t'envoyer de l'argent directement sur tes posts via le bouton ☕.</li>
            <li><b>Abonnements :</b> Les fans paient un abonnement mensuel pour voir ton contenu exclusif.</li>
            <li><b>Vente de produits :</b> Vends tes vidéos, images ou fichiers numériques directement dans ta boutique.</li>
          </ul>
        </div>

        {/* Section 3: Retraits */}
        <div style={{ backgroundColor: colors.card, borderRadius: "16px", padding: "20px", marginBottom: "30px", border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px", color: colors.primary }}>🏦 3. Faire un retrait</h2>
          <ul style={{ paddingLeft: "20px", color: colors.text, lineHeight: "1.6" }}>
            <li>Le seuil minimum de retrait est de <b>5 000 FCFA</b>.</li>
            <li>Nous supportons <b>Orange Money, MTN Mobile Money et Moov Money</b>.</li>
            <li>Les retraits sont traités et envoyés sur ton téléphone en <b>moins de 24h</b>.</li>
            <li>Tu peux suivre tous tes gains en temps réel dans ton tableau de bord.</li>
          </ul>
        </div>

        {/* Bouton d'action */}
        <button
          onClick={() => router.push("/creator/activate/step-1")}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: colors.primary,
            border: "none",
            borderRadius: "12px",
            color: colors.primaryText,
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "20px"
          }}
        >
          Activer mon compte maintenant →
        </button>

        <button
          onClick={() => router.back()}
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            color: colors.textMuted,
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          ← Retour à l'accueil
        </button>

      </div>
    </div>
  );
}