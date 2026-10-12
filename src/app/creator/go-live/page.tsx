"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

// ❌ SUPPRIME L'IMPORT DIRECT D'AGORA EN HAUT DU FICHIER
// import AgoraRTC from "agora-rtc-sdk-ng"; 

export default function GoLivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const streamId = searchParams.get("streamId");
  const { theme } = useAppTheme();

  const [streamData, setStreamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const videoTrackRef = useRef<any>(null);
  const audioTrackRef = useRef<any>(null);

  const colors = {
    red: "#EF4444",
    primary: theme?.primary || "#3B82F6",
  };

  useEffect(() => {
    if (!streamId) {
      router.push("/creator");
      return;
    }

    const verifyAndStartStream = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
      
      // ✅ IMPORT DYNAMIQUE : Charge Agora UNIQUEMENT dans le navigateur
      const AgoraRTCModule = await import("agora-rtc-sdk-ng");
      const AgoraRTC = AgoraRTCModule.default;
      
      startAgoraStream(data.id.toString(), AgoraRTC);
    };

    verifyAndStartStream();

    return () => {
      cleanupAgora();
    };
  }, [streamId, router]);

  const startAgoraStream = async (channelName: string, AgoraRTC: any) => {
    try {
      // ⚠️ REMPLACE CECI PAR TON VRAI APP ID AGORA (celui que tu as copié)
      const APP_ID = "cb6d0b31fe534c92a619c224ba714e2b"; // <-- Colle ton App ID complet ici entre les guillemets
      
      clientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await clientRef.current.setClientRole("host");
      await clientRef.current.join(APP_ID, channelName, null, null);

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
    } catch (err) {
      console.error("❌ Erreur Agora:", err);
      setError("Impossible d'accéder à la caméra/microphone. Vérifiez les permissions de votre navigateur.");
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
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("id", streamData.id);

      router.push("/creator?tab=overview");
    } catch (err) {
      console.error("❌ Erreur lors de l'arrêt du live:", err);
      alert("Une erreur est survenue, mais votre flux est coupé.");
      router.push("/creator?tab=overview");
    }
  };

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
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
            Terminer le live
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