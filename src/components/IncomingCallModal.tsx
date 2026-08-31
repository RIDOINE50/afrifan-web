"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function IncomingCallModal() {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    let callChannel: any = null;

    const setupListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("📡 Écouteur d'appels activé pour:", user.id);

      // Nom unique pour éviter les conflits React
      const channelName = `global_calls_${user.id}_${Date.now()}`;

      callChannel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "calls",
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            const newCall = payload.new;
            console.log("📞 Appel entrant détecté !", newCall);

            if (newCall.status === "ongoing") {
              setIncomingCall(newCall);
            }
          }
        )
        .subscribe();
    };

    setupListener();

    // Nettoyage propre
    return () => {
      if (callChannel) {
        supabase.removeChannel(callChannel);
      }
    };
  }, []);

  const handleAnswer = async () => {
    if (!incomingCall) return;

    try {
      // ✅ 1. Mise à jour de la BDD uniquement. 
      // C'est plus fiable et l'appelant écoute déjà ce changement !
      await supabase.from("calls").update({ status: "connected" }).eq("id", incomingCall.id);
      
      // ✅ 2. Redirection vers l'écran d'appel vocal
      router.push(`/calls/audio?callId=${incomingCall.id}&otherId=${incomingCall.caller_id}&name=Appelant&isReceiver=true`);
      setIncomingCall(null);
    } catch (error) {
      console.error("Erreur décrochage:", error);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;

    try {
      // ✅ 1. Mise à jour de la BDD uniquement
      await supabase.from("calls").update({ status: "rejected" }).eq("id", incomingCall.id);
    } catch (error) {
      console.error("Erreur refus:", error);
    } finally {
      setIncomingCall(null);
    }
  };

  // Si aucun appel n'arrive, on n'affiche rien
  if (!incomingCall) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.95)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      color: "#FFFFFF",
      fontFamily: "sans-serif"
    }}>
      <p style={{ color: "#9CA3AF", fontSize: "16px", marginBottom: "24px" }}>Appel vocal entrant...</p>
      
      <div style={{
        width: "120px", height: "120px", borderRadius: "50%", backgroundColor: "#1C1C1F",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "24px", fontSize: "60px"
      }}>
        👤
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "60px" }}>
        {incomingCall.caller_name || "Appelant"}
      </h1>

      <div style={{ display: "flex", gap: "60px" }}>
        {/* Bouton Refuser */}
        <button
          onClick={handleDecline}
          style={{
            width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#EF4444",
            border: "none", fontSize: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          ✖️
        </button>

        {/* Bouton Décrocher */}
        <button
          onClick={handleAnswer}
          style={{
            width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#22C55E",
            border: "none", fontSize: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          📞
        </button>
      </div>
    </div>
  );
}