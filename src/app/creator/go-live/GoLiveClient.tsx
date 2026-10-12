"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAppTheme } from "@/contexts/ThemeContext";

type LiveMessage = {
  id: string;
  live_stream_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
};

export default function GoLiveClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const streamId = searchParams.get("streamId");
  const { theme } = useAppTheme();

  const [streamData, setStreamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 💬 Chat
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const videoTrackRef = useRef<any>(null);
  const audioTrackRef = useRef<any>(null);
  const isEndingRef = useRef(false); // 👈 pour éviter double appel

  const colors = {
    red: "#EF4444",
    primary: theme?.primary || "#3B82F6",
  };

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Étape 1 : vérifier la session
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

        // 💬 Charger les derniers messages
        const { data: msgs } = await supabase
          .from("live_messages")
          .select("*")
          .eq("live_stream_id", streamId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (msgs) setMessages(msgs);

        setIsLoading(false);
      } catch (err) {
        console.error("❌ Erreur critique:", err);
        setError("Une erreur est survenue lors du chargement du live.");
        setIsLoading(false);
      }
    };

    verify();

    return () => {
      // ⚠️ NE PAS appeler cleanupAgora ici (sinon React Strict Mode en dev
      // peut faire quitter Agora immédiatement après le join)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId, router]);

  // 💬 Écoute temps réel des messages du chat
  useEffect(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`live-chat-creator-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_messages",
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload: any) => {
          console.log("💬 Nouveau message:", payload.new);
          setMessages((prev) => [...prev, payload.new as LiveMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  // 🔔 Arrêter le live automatiquement si on quitte la page (fermeture onglet)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (streamData?.id && !isEndingRef.current) {
        isEndingRef.current = true;
        // sendBeacon = requête fiable même si la page se ferme
        const url = `/api/live/end?streamId=${streamData.id}`;
        navigator.sendBeacon?.(url);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [streamData]);

  // 🔹 Étape 2 : démarrer Agora APRÈS clic utilisateur
  const handleStartLive = async () => {
    if (!streamData) return;

    setIsStarting(true);
    setError(null);

    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      testStream.getTracks().forEach((t) => t.stop());

      const AgoraRTCModule = await import("agora-rtc-sdk-ng");
      const AgoraRTC = AgoraRTCModule.default;

      setHasStarted(true);
      await startAgoraStream(streamData.id.toString(), AgoraRTC);
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
    const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!APP_ID) {
      throw new Error("NEXT_PUBLIC_AGORA_APP_ID manquant dans les variables d'env");
    }

    const tokenRes = await fetch("/api/agora-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelName, uid: 0 }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      throw new Error(err.error || "Impossible de récupérer le token");
    }

    const { token } = await tokenRes.json();

    clientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    await clientRef.current.setClientRole("host");
    await clientRef.current.join(APP_ID, channelName, token, null);

    const [videoTrack, audioTrack] = await Promise.all([
      AgoraRTC.createCameraVideoTrack(),
      AgoraRTC.createMicrophoneAudioTrack(),
    ]);

    videoTrackRef.current = videoTrack;
    audioTrackRef.current = audioTrack;

    await clientRef.current.publish([videoTrack, audioTrack]);
    console.log("📡 Publish success");

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (localVideoRef.current) {
      videoTrack.play(localVideoRef.current);
      console.log("▶️ Play lancé");
    } else {
      console.error("❌ localVideoRef est NULL après 800ms !");
    }
  };

  const cleanupAgora = async () => {
    try {
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
      console.log("✅ Agora cleanup terminé");
    } catch (err) {
      console.error("❌ Erreur cleanup Agora:", err);
    }
  };

  // 🔴 TERMINER LE LIVE : cleanup + update DB + redirect
  const handleStopLive = async () => {
    if (!streamData || isEndingRef.current) return;
    isEndingRef.current = true;

    try {
      console.log("🛑 Arrêt du live en cours...");

      // 1. Quitter Agora (couper caméra/micro/déconnexion channel)
      await cleanupAgora();

      // 2. Mettre à jour la DB (status = ended)
      const { error: updateErr } = await supabase
        .from("live_streams")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("id", streamData.id);

      if (updateErr) {
        console.error("❌ Erreur update DB:", updateErr);
      } else {
        console.log("✅ Live terminé en DB");
      }

      // 3. Redirection
router.push("/creator/dashboard");    } catch (err) {
      console.error("❌ Erreur lors de l'arrêt du live:", err);
router.push("/creator/dashboard");    }
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

        {/* Header */}
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

        {/* 💬 Messages overlay (bas gauche) */}
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "20px",
            right: "20px",
            maxWidth: "400px",
            maxHeight: "35vh",
            overflowY: "auto",
            zIndex: 8,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maskImage: "linear-gradient(to bottom, transparent, black 20%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%)",
          }}
        >
          {messages.slice(-10).map((msg) => (
            <div
              key={msg.id}
              style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
                borderRadius: "16px",
                padding: "6px 12px",
                color: "white",
                fontSize: "13px",
                maxWidth: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {msg.user_avatar ? (
                <img src={msg.user_avatar} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
              ) : (
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>
                  {(msg.user_name || "?")[0].toUpperCase()}
                </div>
              )}
              <span style={{ fontWeight: "600", color: "#93C5FD" }}>{msg.user_name || "Anonyme"}</span>
              <span>{msg.content}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 💬 Bouton chat (créateur) */}
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: "absolute",
            bottom: "40px",
            right: "20px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            fontSize: "22px",
            zIndex: 10,
            backdropFilter: "blur(6px)",
          }}
        >
          💬
          {messages.length > 0 && (
            <span style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              backgroundColor: "#EF4444",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              fontSize: "11px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {messages.length > 99 ? "99+" : messages.length}
            </span>
          )}
        </button>

        {/* 🔴 Bouton terminer */}
        <div style={{ position: "absolute", bottom: "40px", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
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
              pointerEvents: "auto",
            }}
          >
            ⏹️ Terminer le live
          </button>
        </div>
      </div>

      {/* 💬 Panneau chat ouvert (créateur) */}
      {isChatOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={() => setIsChatOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxHeight: "70vh",
              backgroundColor: "#111",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ color: "white", margin: 0, fontSize: "16px" }}>💬 Commentaires</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{ background: "none", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                padding: "8px 0",
              }}
            >
              {messages.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", fontSize: "14px" }}>
                  Aucun commentaire pour le moment.
                </p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    {msg.user_avatar ? (
                      <img src={msg.user_avatar} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", color: "white", flexShrink: 0 }}>
                        {(msg.user_name || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#93C5FD", fontSize: "13px", fontWeight: "600" }}>
                        {msg.user_name || "Anonyme"}
                      </div>
                      <div style={{ color: "white", fontSize: "14px", wordBreak: "break-word" }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

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