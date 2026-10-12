"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function GoLiveClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const streamId = searchParams.get("streamId");
  const { theme } = useAppTheme();

  const [streamData, setStreamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // ✅ nouveau
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const videoTrackRef = useRef<any>(null);
  const audioTrackRef = useRef<any>(null);

  const colors = {
    red: "#EF4444",
    primary: theme?.primary || "#3B82F6",
  };

  // 🔹 Étape 1 : vérifier la session SEULEMENT (pas de caméra)
  useEffect(() => {
    if (!streamId) {
      router.push("/creator");
      return;
    }

    const verify = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }

        const { data, error: dbError } = await supabase
          .from("live_streams")
          .select("*")
          .eq("id", streamId)
          .eq("creator_id", session.user.id)
          .single();

        if (dbError || !data || data.status !== "live") {
          setError("Session de live introuvable, non autorisée ou déjà terminée.");
          setIsLoading(false);
          return;
        }

        setStreamData(data);
        setIsLoading(false);
      } catch (err) {
        console.error("❌ Erreur critique:", err);
        setError("Une erreur est survenue lors du chargement du live.");
        setIsLoading(false);
      }
    };

    verify();

    return () => {
      cleanupAgora();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId, router]);

  // 🔹 Étape 2 : démarrer Agora APRÈS un clic utilisateur
  const handleStartLive = async () => {
    if (!streamData) return;

    setIsStarting(true);
    setError(null);

    try {
      // ✅ Appel getUserMedia DIRECTEMENT dans le handler du clic
      // → sur Android Chrome, c'est OBLIGATOIRE pour que la permission s'affiche
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // On arrête tout de suite, Agora va reprendre la main
      testStream.getTracks().forEach((t) => t.stop());

      const AgoraRTCModule = await import("agora-rtc-sdk-ng");
      const AgoraRTC = AgoraRTCModule.default;

      await startAgoraStream(streamData.id.toString(), AgoraRTC);
      setHasStarted(true);
    } catch (err: any) {
      console.error("❌ Erreur getUserMedia:", err);
      let msg = "Erreur d'accès aux périphériques.";
      if (err?.name === "NotAllowedError")
        msg = "Permission refusée. Autorisez la caméra et le micro puis réessayez.";
      else if (err?.name === "NotFoundError")
        msg = "Aucune caméra ou micro détecté sur cet appareil.";
      else if (err?.name === "NotReadableError")
        msg = "Caméra/micro déjà utilisés par une autre application.";
      setError(msg + ` (${err?.name || err?.message})`);
    } finally {
      setIsStarting(false);
    }
  };

  const startAgoraStream = async (channelName: string, AgoraRTC: any) => {
  // ✅ APRÈS (correct)
const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

if (!APP_ID) {
  throw new Error("NEXT_PUBLIC_AGORA_APP_ID manquant dans les variables d'env");
}

  // ✅ 1. Récupérer le token depuis ton API route
  const tokenRes = await fetch("/api/agora-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channelName,
      uid: 0, // 0 = Agora choisit un uid automatiquement
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    throw new Error(err.error || "Impossible de récupérer le token");
  }

  const { token } = await tokenRes.json();

  // ✅ 2. Créer le client Agora
  clientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
  await clientRef.current.setClientRole("host");

  // ✅ 3. Rejoindre avec le TOKEN (3ème paramètre)
  await clientRef.current.join(APP_ID, channelName, token, null);

  // ✅ 4. Créer et publier les tracks
  const [videoTrack, audioTrack] = await Promise.all([
    AgoraRTC.createCameraVideoTrack(),
    AgoraRTC.createMicrophoneAudioTrack(),
  ]);

  videoTrackRef.current = videoTrack;
  audioTrackRef.current = audioTrack;

  await clientRef.current.publish([videoTrack, audioTrack]);

  if (localVideoRef.current) {
    videoTrack.play(localVideoRef.current);
  }
};

  const cleanupAgora = async () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.close();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.close();
      audioTrackRef.current = null;
    }
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }
  };

  const handleStopLive = async () => {
    if (!streamData) return;
    try {
      await cleanupAgora();
      await supabase
        .from("live_streams")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", streamData.id);
      router.push("/creator?tab=overview");
    } catch (err) {
      console.error("❌ Erreur lors de l'arrêt du live:", err);
      router.push("/creator?tab=overview");
    }
  };

  // ===== UI =====

  if (isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <p>Initialisation du studio de live...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", padding: "20px", textAlign: "center" }}>
        <h2 style={{ color: colors.red, marginBottom: "10px" }}>Erreur</h2>
        <p style={{ marginBottom: "20px" }}>{error}</p>
        <button
          onClick={() => router.push("/creator")}
          style={{ padding: "12px 24px", backgroundColor: colors.primary, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  // 🔹 Écran "Prêt à démarrer ?" avant d'activer la caméra
  if (!hasStarted) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#000", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", gap: "20px" }}>
        <h2 style={{ margin: 0 }}>{streamData?.title}</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: "400px" }}>
          Autorisez l'accès à la caméra et au microphone pour démarrer le live.
        </p>
        <button
          onClick={handleStartLive}
          disabled={isStarting}
          style={{
            backgroundColor: colors.red,
            color: "white",
            border: "none",
            borderRadius: "30px",
            padding: "16px 40px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: isStarting ? "wait" : "pointer",
            opacity: isStarting ? 0.6 : 1,
            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
          }}
        >
          {isStarting ? "Démarrage..." : "🎥 Démarrer le live"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", backgroundColor: "#000", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111" }}>
        <div
          ref={localVideoRef}
          style={{
            width: "100%",
            maxWidth: "500px",
            height: "100%",
            maxHeight: "900px",
            backgroundColor: "#222",
            position: "relative",
          }}
        />

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", backgroundColor: colors.red, borderRadius: "50%", animation: "pulse 1.5s infinite" }}></div>
            <span style={{ color: "white", fontWeight: "bold", fontSize: "16px", letterSpacing: "1px" }}>LIVE</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>• {streamData?.viewer_count || 0} spectateurs</span>
          </div>
          <div style={{ color: "white", fontWeight: "bold", fontSize: "16px", textShadow: "0 2px 4px rgba(0,0,0,0.8)", maxWidth: "60%", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {streamData?.title}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "40px", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
          <button
            onClick={handleStopLive}
            style={{
              backgroundColor: colors.red,
              color: "white",
              border: "none",
              borderRadius: "30px",
              padding: "16px 40px",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
            }}
          >
            ⏹️ Terminer le live
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}