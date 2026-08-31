"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface TipDialogProps {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TipDialog({ creatorId, creatorName, onClose, onSuccess }: TipDialogProps) {
  const router = useRouter();
  
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Orange Money");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const quickAmounts = [500, 1000, 2000, 5000];
  const paymentMethods = ["Orange Money", "MTN Mobile Money", "Moov Money"];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleAmountClick = (val: number) => {
    setAmount(val.toString());
    setError("");
  };

  const handleSendTip = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }
    if (phone.trim().length < 8) {
      setError("Veuillez entrer un numéro de téléphone valide (min. 8 chiffres)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // ✅ INSERTION EXACTEMENT SELON TA STRUCTURE DE TABLE
      const { error: dbError } = await supabase.from('tips').insert({
        fan_id: user.id,
        creator_id: creatorId,
        amount: numAmount,
        payment_method: paymentMethod,
        fan_phone_number: phone.trim(), // ✅ NOM EXACT DE LA COLONNE
        message: message.trim() || null,
        status: 'completed', // ✅ Valeur par défaut de ta table
      });

      if (dbError) throw dbError;

      onSuccess?.();
      onClose();
      alert(`✅ Pourboire de ${numAmount} FCFA envoyé via ${paymentMethod} !`);
      
    } catch (err: any) {
      console.error("❌ Erreur envoi tip:", err);
      setError("Échec de l'envoi. Vérifiez votre connexion ou réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const canSend = parseFloat(amount) > 0 && phone.trim().length >= 8 && !isLoading;
  const displayAmount = parseFloat(amount) || 0;

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", 
      display: "flex", alignItems: "center", justifyContent: "center", 
      zIndex: 1000, padding: "16px"
    }}>
      <div style={{
        backgroundColor: "#1A1A1A",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "420px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "24px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>☕</div>
          <h2 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            Soutenir ce créateur
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0 }}>
            à {creatorName}
          </p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              placeholder="0"
              style={{
                width: "100%",
                backgroundColor: "#2A2A2A",
                border: "none",
                borderRadius: "12px",
                padding: "16px",
                color: "#FFFFFF",
                fontSize: "28px",
                fontWeight: "bold",
                textAlign: "center",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <span style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9CA3AF",
              fontSize: "16px",
              fontWeight: "bold"
            }}>
              FCFA
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "24px" }}>
          {quickAmounts.map((val) => {
            const isSelected = parseFloat(amount) === val;
            return (
              <button
                key={val}
                onClick={() => handleAmountClick(val)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isSelected ? "#8B5CF6" : "#2A2A2A",
                  border: isSelected ? "1px solid #8B5CF6" : "1px solid transparent",
                  borderRadius: "20px",
                  color: isSelected ? "#FFFFFF" : "#9CA3AF",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {val}
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#9CA3AF", fontSize: "14px", marginBottom: "6px" }}>
            Moyen de paiement
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "#2A2A2A",
              border: "none",
              borderRadius: "12px",
              padding: "12px 16px",
              color: "#FFFFFF",
              fontSize: "14px",
              outline: "none",
              cursor: "pointer",
              boxSizing: "border-box"
            }}
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#9CA3AF", fontSize: "14px", marginBottom: "6px" }}>
            Ton numéro Mobile Money
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>📱</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(""); }}
              placeholder="Ex: 07 07 07 07"
              style={{
                width: "100%",
                backgroundColor: "#2A2A2A",
                border: "none",
                borderRadius: "12px",
                padding: "12px 16px 12px 44px",
                color: "#FFFFFF",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", color: "#9CA3AF", fontSize: "14px", marginBottom: "6px" }}>
            Message d'encouragement (optionnel)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Bravo pour ton contenu !"
            style={{
              width: "100%",
              backgroundColor: "#2A2A2A",
              border: "none",
              borderRadius: "12px",
              padding: "12px 16px",
              color: "#FFFFFF",
              fontSize: "14px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              boxSizing: "border-box"
            }}
          />
        </div>

        {error && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid #EF4444", 
            borderRadius: "8px", 
            padding: "12px", 
            marginBottom: "16px",
            color: "#EF4444",
            fontSize: "14px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSendTip}
          disabled={!canSend}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: canSend ? "#8B5CF6" : "#374151",
            border: "none",
            borderRadius: "12px",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.2s"
          }}
        >
          {isLoading ? (
            <>
              <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #FFFFFF", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              Traitement...
            </>
          ) : (
            `Payer ${displayAmount} FCFA`
          )}
        </button>

        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "12px",
            backgroundColor: "transparent",
            border: "none",
            color: "#9CA3AF",
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          Annuler
        </button>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; margin: 0; 
        }
      `}</style>
    </div>
  );
}