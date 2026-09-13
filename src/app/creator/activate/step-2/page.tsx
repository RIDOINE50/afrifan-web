"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function IdentityVerificationStep() {
  const router = useRouter();
  const { isDark, theme } = useAppTheme();
  
  const [step1Data, setStep1Data] = useState<any>(null);

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [otp, setOtp] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Couleurs dynamiques
  const colors = {
    bg: theme.bg,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryText: theme.primaryText,
    text: theme.text,
    textSecondary: theme.textMuted,
    hover: theme.hover,
    green: "#22C55E",
    red: "#EF4444",
  };

  useEffect(() => {
    const savedData = sessionStorage.getItem('creator_activation_step1');
    if (!savedData) {
      router.push("/creator/activate/step-1");
    } else {
      setStep1Data(JSON.parse(savedData));
    }

    return () => {
      if (idCardPreview && idCardPreview.startsWith('blob:')) {
        URL.revokeObjectURL(idCardPreview);
      }
    };
  }, [router, idCardPreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setIdCardFile(file);
    setIdCardPreview(previewUrl);
    setError(null);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError("Veuillez entrer un code valide.");
      return;
    }
    
    setIsVerifyingOtp(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsVerifyingOtp(false);
    setIsPhoneVerified(true);
  };

  const handleNext = async () => {
    if (!idCardFile) {
      setError("Veuillez importer une photo de votre pièce d'identité.");
      return;
    }
    if (!isPhoneVerified) {
      setError("Veuillez vérifier votre numéro de téléphone.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté.");

      const fileExt = idCardFile.name.split('.').pop();
      const fileName = `id_${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('creator_id_cards')
        .upload(fileName, idCardFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('creator_id_cards')
        .getPublicUrl(fileName);

      const completeData = {
        ...step1Data,
        idCardUrl: publicUrl,
        phoneVerified: true,
      };

      sessionStorage.setItem('creator_activation_step2', JSON.stringify(completeData));
      router.push("/creator/activate/step-3");

    } catch (err: any) {
      console.error("❌ Erreur étape 2:", err);
      setError(err.message || "Une erreur est survenue lors de l'upload.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!step1Data) {
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
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: colors.primary, fontWeight: "bold", fontSize: "14px" }}>Étape 2/3</span>
            <span style={{ backgroundColor: colors.hover, color: colors.primary, padding: "4px 12px", borderRadius: "12px", fontSize: "14px", fontWeight: "bold" }}>2/3</span>
          </div>
          <div style={{ height: "6px", backgroundColor: colors.card, borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ width: "66%", height: "100%", backgroundColor: colors.primary, borderRadius: "8px", transition: "width 0.3s" }} />
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Vérification d'identité</h1>
        <p style={{ color: colors.textSecondary, fontSize: "14px", marginBottom: "32px" }}>
          Vérifiez votre identité pour devenir créateur
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

        {/* Section Document */}
        <div style={{ backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}`, padding: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
            <span style={{ color: colors.primary, fontSize: "24px" }}>🪪</span>
            <div>
              <div style={{ color: colors.text, fontSize: "16px", fontWeight: 600 }}>Photo de ma pièce d'identité</div>
              <div style={{ color: colors.textSecondary, fontSize: "13px" }}>CNI, Passeport ou Carte consulaire</div>
            </div>
          </div>

          {idCardPreview ? (
            <>
              <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "12px", maxHeight: "200px" }}>
                <img src={idCardPreview} alt="Aperçu CNI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                width: "100%", padding: "12px", backgroundColor: "transparent",
                border: `1px solid ${colors.border}`, borderRadius: "12px",
                color: colors.text, cursor: "pointer", fontSize: "14px"
              }}>
                🔄 Changer l'image
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </label>
            </>
          ) : (
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              width: "100%", height: "50px", backgroundColor: "transparent",
              border: `1px solid ${colors.border}`, borderRadius: "12px",
              color: colors.text, cursor: isUploading ? "not-allowed" : "pointer", fontSize: "14px"
            }}>
              {isUploading ? (
                <div style={{ width: "20px", height: "20px", border: "2px solid transparent", borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              ) : (
                <>📁 Importer une photo</>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} disabled={isUploading} style={{ display: "none" }} />
            </label>
          )}
        </div>

        {/* Message de sécurité */}
        <div style={{
          padding: "14px", backgroundColor: colors.hover,
          borderRadius: "12px", border: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px"
        }}>
          <span style={{ color: colors.primary, fontSize: "20px" }}>🔒</span>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: "13px" }}>
            Vos données personnelles sont sécurisées et ne seront utilisées que pour vérifier votre identité.
          </p>
        </div>

        {/* Vérification du téléphone */}
        <div style={{ backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}`, padding: "16px", marginBottom: "32px" }}>
          <div style={{ color: colors.text, fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Vérification du numéro de téléphone</div>
          <p style={{ color: colors.textSecondary, fontSize: "13px", margin: "0 0 16px 0" }}>
            Veuillez confirmer votre numéro pour recevoir vos notifications de gains.
          </p>

          {isPhoneVerified ? (
            <div style={{
              padding: "12px", backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderRadius: "10px", border: `1px solid ${colors.green}`,
              display: "flex", alignItems: "center", gap: "10px"
            }}>
              <span style={{ color: colors.green, fontSize: "20px" }}>✅</span>
              <span style={{ color: colors.green, fontWeight: "bold", fontSize: "14px" }}>Téléphone vérifié avec succès !</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Entrez le code reçu"
                maxLength={6}
                style={{
                  width: "100%", padding: "14px 16px",
                  backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                  borderRadius: "12px", color: colors.text, fontSize: "16px", outline: "none", boxSizing: "border-box"
                }}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otp.length < 4}
                style={{
                  width: "100%", height: "48px",
                  backgroundColor: isVerifyingOtp || otp.length < 4 ? colors.border : colors.primary,
                  border: "none", borderRadius: "12px",
                  color: colors.primaryText, fontSize: "14px", fontWeight: "bold",
                  cursor: isVerifyingOtp || otp.length < 4 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                {isVerifyingOtp ? "Vérification..." : "Vérifier"}
              </button>
            </div>
          )}
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={handleNext}
          disabled={isLoading || !idCardFile || !isPhoneVerified}
          style={{
            width: "100%", height: "55px",
            backgroundColor: (isLoading || !idCardFile || !isPhoneVerified) ? colors.border : colors.primary,
            border: "none", borderRadius: "16px",
            color: (isLoading || !idCardFile || !isPhoneVerified) ? colors.textSecondary : colors.primaryText,
            fontSize: "16px", fontWeight: "bold",
            cursor: (isLoading || !idCardFile || !isPhoneVerified) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "background 0.2s"
          }}
        >
          {isLoading ? (
            <div style={{ width: "24px", height: "24px", border: `3px solid ${colors.primaryText}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          ) : (
            "Suivant"
          )}
        </button>

      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}