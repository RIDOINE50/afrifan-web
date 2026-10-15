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

// 🎨 Icônes SVG inline (pas de dépendance externe)
const IconChat = ({ size = 24, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconSwitchCamera = ({ size = 24, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 5h-3l-2-2h-6L7 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
    <path d="M9 12a3 3 0 0 0 5.12 2.12" />
    <path d="M15 12a3 3 0 0 0-5.12-2.12" />
    <path d="M17 10l2 2-2 2" />
    <path d="M7 14l-2-2 2-2" />
  </svg>
);

const IconStop = ({ size = 20, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const IconClose = ({ size = 24, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconVideo = ({ size = 20, color = "white" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

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
  const isEndingRef = useRef(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId, router]);

  // 💬 Écoute temps réel des messages
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
          setMessages((prev) => [...prev, payload.new as LiveMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  // 🔔 Arrêter le live si fermeture onglet
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (streamData?.id && !isEndingRef.current) {
        isEndingRef.current = true;
        const url = `/api/live/end?streamId=${streamData.id}`;
        navigator.sendBeacon?.(url);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [streamData]);

  // 🔹 Démarrer Agora
  const handleStartLive = async () => {
    if (!streamData) return;
    setIsStarting(true);
    setError(null);

    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      testStream.getTracks().forEach((t) => t.stop());

      const AgoraRTCModule = await import("agora-rtc-sdk-ng");
      const AgoraRTC = AgoraRTCModule.default;

      setHasStarted(true);
      await startAgoraStream(streamData.id.toString(), AgoraRTC);
    } catch (err: any) {
      console.error("❌ Erreur getUserMedia:", err);
      let msg = "Erreur d'accès aux périphériques.";
      if (err?.name === "NotAllowedError") msg = "Permission refusée. Autorisez la caméra et le micro.";
      else if (err?.name === "NotFoundError") msg = "Aucune caméra ou micro détecté.";
      else if (err?.name === "NotReadableError") msg = "Caméra/micro déjà utilisés.";
      setError(msg + ` (${err?.name || err?.message})`);
    } finally {
      setIsStarting(false);
    }
  };

  const startAgoraStream = async (channelName: string, AgoraRTC: any) => {
    const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    if (!APP_ID) throw new Error("NEXT_PUBLIC_AGORA_APP_ID manquant");

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
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (localVideoRef.current) {
      videoTrack.play(localVideoRef.current);
    }
  };

  // 🔄 Basculer caméra
  const switchCamera = async () => {
    if (!videoTrackRef.current) return;
    try {
      await videoTrackRef.current.switchCamera();
      console.log("🔄 Caméra basculée");
    } catch (err) {
      console.error("❌ Impossible de basculer la caméra:", err);
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
    } catch (err) {
      console.error("❌ Erreur cleanup Agora:", err);
    }
  };

  // 🔴 Terminer le live
  const handleStopLive = async () => {
    if (!streamData || isEndingRef.current) return;
    isEndingRef.current = true;

    try {
      await cleanupAgora();

      const { error: updateErr } = await supabase
        .from("live_streams")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", streamData.id);

      if (updateErr) console.error("❌ Erreur update DB:", updateErr);
      router.push("/creator/dashboard");
    } catch (err) {
      console.error("❌ Erreur arrêt live:", err);
      router.push("/creator/dashboard");
    }
  };

  // ===== UI =====

  if (isLoading) {
    return (
      <div style={{ height: "100dvh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <p>Initialisation du studio de live...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: "100dvh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", padding: "20px", textAlign: "center" }}>
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
      <div style={{ height: "100dvh", backgroundColor: "#000", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", gap: "20px" }}>
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
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <IconVideo size={20} />
          {isStarting ? "Démarrage..." : "Démarrer le live"}
        </button>
      </div>
    );
  }

  // 📱 Styles communs pour les boutons ronds flottants
  const floatingBtnStyle: React.CSSProperties = {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.65)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.25)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    transition: "transform 0.15s ease, background-color 0.15s ease",
    padding: 0,
  };

  return (
    <div style={{ height: "100dvh", backgroundColor: "#000", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111" }}>
        {/* Vidéo locale */}
        <div
          ref={localVideoRef}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#222",
            position: "relative",
          }}
        />

        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "16px 20px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div style={{ width: "10px", height: "10px", backgroundColor: colors.red, borderRadius: "50%", animation: "pulse 1.5s infinite" }}></div>
            <span style={{ color: "white", fontWeight: "bold", fontSize: "14px", letterSpacing: "1px" }}>LIVE</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>• {streamData?.viewer_count || 0}</span>
          </div>
          <div
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              maxWidth: "55%",
              textAlign: "right",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {streamData?.title}
          </div>
        </div>

        {/* 💬 Messages overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "110px",
            left: "16px",
            right: "80px",
            maxHeight: "30vh",
            overflowY: "auto",
            zIndex: 8,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maskImage: "linear-gradient(to bottom, transparent, black 25%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 25%)",
          }}
        >
          {messages.slice(-8).map((msg) => (
            <div
              key={msg.id}
              style={{
                backgroundColor: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderRadius: "18px",
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
                <img src={msg.user_avatar} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", flexShrink: 0 }}>
                  {(msg.user_name || "?")[0].toUpperCase()}
                </div>
              )}
              <span style={{ fontWeight: "600", color: "#93C5FD" }}>{msg.user_name || "Anonyme"}</span>
              <span>{msg.content}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 🎛️ Barre de contrôle du bas */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: 0,
            right: 0,
            padding: "0 16px",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            pointerEvents: "none",
          }}
        >
          {/* Bouton stop (gauche) */}
          <button
            onClick={handleStopLive}
            style={{
              backgroundColor: colors.red,
              color: "white",
              border: "none",
              borderRadius: "26px",
              padding: "14px 22px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
              pointerEvents: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <IconStop size={18} />
            <span style={{ display: "none" }} className="stop-label">Terminer</span>
          </button>

          {/* Boutons droite : rotation + chat */}
          <div style={{ display: "flex", gap: "12px", pointerEvents: "auto" }}>
            <button
              onClick={switchCamera}
              style={floatingBtnStyle}
              aria-label="Basculer caméra"
            >
              <IconSwitchCamera size={24} />
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              style={{ ...floatingBtnStyle, position: "relative" }}
              aria-label="Ouvrir le chat"
            >
              <IconChat size={24} />
              {messages.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    backgroundColor: colors.red,
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 5px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  {messages.length > 99 ? "99+" : messages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 💬 Panneau chat */}
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
              maxHeight: "75dvh",
              backgroundColor: "#111",
              borderTopLeftRadius: "20px",
              borderTopRightRadius: "20px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ color: "white", margin: 0, fontSize: "16px" }}>Commentaires</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px", display: "flex" }}
                aria-label="Fermer"
              >
                <IconClose size={22} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "8px 0" }}>
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
                    <div style={{ flex: 1, minWidth: 0 }}>
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
        /* 📱 Sur écran plus large, on affiche le label "Terminer" */
        @media (min-width: 480px) {
          .stop-label { display: inline !important; }
        }
      `}</style>
    </div>
  );
}