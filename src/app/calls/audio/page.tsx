"use client";

import { Suspense } from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ✅ Désactiver le pré-rendu de cette page
export const dynamic = 'force-dynamic';

// ─── COMPOSANT CONTENU (utilise useSearchParams) ──────────
function VoiceCallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const otherUserId = searchParams.get("otherId") || "";
  const otherUserName = searchParams.get("name") || "Utilisateur";
  const otherUserAvatar = searchParams.get("avatar") || "";
  const callId = searchParams.get("callId") || "";
  const isReceiver = searchParams.get("isReceiver") === "true";

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isOtherUserJoined, setIsOtherUserJoined] = useState(isReceiver);
  const [isLeaving, setIsLeaving] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const clientRef = useRef<any>(null);
  const localTrackRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const agoraModuleRef = useRef<any>(null);

  const colors = {
    bg: "#000000",
    card: "#1C1C1F",
    primary: "#6366F1",
    green: "#22C55E",
    orange: "#F59E0B",
    red: "#EF4444",
  };

  // ════════════════════════════════════════════════════════════
  // 1. CHARGEMENT DYNAMIQUE D'AGORA (côté client)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!callId) {
      router.push("/messages");
      return;
    }

    import("agora-rtc-sdk-ng")
      .then((module) => {
        agoraModuleRef.current = module.default || module;
        setupSupabaseChannel();
        initAgora();
      })
      .catch((err) => {
        console.error("❌ Erreur chargement Agora:", err);
        alert("Impossible de charger l'audio. Vérifiez votre connexion.");
        router.push("/messages");
      });

    return () => {
      cleanup();
    };
  }, [callId]);

  // ════════════════════════════════════════════════════════════
  // 2. CANAL DE SYNCHRONISATION SUPABASE (Broadcast)
  // ════════════════════════════════════════════════════════════
  const setupSupabaseChannel = () => {
    const channel = supabase.channel(`call_sync_${callId}`);
    channel.on("broadcast", { event: "user_joined" }, () => {
      if (!isOtherUserJoined) {
        setIsOtherUserJoined(true);
        startTimer();
      }
    });
    channel.on("broadcast", { event: "call_ended" }, () => {
      handleLeave(false);
    });
    channel.subscribe();
    channelRef.current = channel;

    if (isReceiver) {
      setTimeout(async () => {
        await channel.send({
          type: "broadcast",
          event: "user_joined",
          payload: { user: "receiver" },
        });
      }, 1000);
    }
  };

  // ════════════════════════════════════════════════════════════
  // 3. INITIALISATION AGORA
  // ════════════════════════════════════════════════════════════
  const initAgora = async () => {
    const AgoraRTC = agoraModuleRef.current;
    if (!AgoraRTC) return;

    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      const res = await fetch("/api/agora-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName: callId }),
      });
      const { token } = await res.json();

      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID || "18d7051c40f14cea8953b23824683c0b",
        callId,
        token,
        null
      );
      setIsJoined(true);

      const localTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "speech_standard",
      });
      localTrack.setEnabled(true);
      localTrackRef.current = localTrack;
      await client.publish(localTrack);

      client.on("user-published", async (user: any, mediaType: any) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.play();
          setIsOtherUserJoined(true);
          startTimer();
        }
      });
      client.on("user-unpublished", () => setIsOtherUserJoined(false));
      client.on("user-left", () => setIsOtherUserJoined(false));
    } catch (error) {
      console.error("❌ Erreur Agora:", error);
      alert("Impossible de démarrer l'appel. Vérifiez le microphone.");
      router.push("/messages");
    }
  };

  // ════════════════════════════════════════════════════════════
  // 4. TIMER
  // ════════════════════════════════════════════════════════════
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // ════════════════════════════════════════════════════════════
  // 5. CONTRÔLES
  // ════════════════════════════════════════════════════════════
  const toggleMute = async () => {
    if (localTrackRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      localTrackRef.current.setEnabled(!newMuted);
    }
  };

  const toggleSpeaker = async () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // ════════════════════════════════════════════════════════════
  // 6. RACROCHER
  // ════════════════════════════════════════════════════════════
  const handleLeave = async (sendSignal = true) => {
    if (isLeaving) return;
    setIsLeaving(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const { data: { user } } = await supabase.auth.getUser();
    if (user && callId) {
      const durationFormatted = formatDuration(callDuration);
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        type: "call_log",
        content: `Appel vocal terminé • ${durationFormatted}`,
        created_at: new Date().toISOString(),
      });
    }

    if (sendSignal && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call_ended",
        payload: { user: isReceiver ? "receiver" : "caller" },
      }).catch(() => {});
      channelRef.current.unsubscribe();
    }

    if (localTrackRef.current) {
      localTrackRef.current.close();
      localTrackRef.current = null;
    }
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }

    router.push("/messages");
  };

  // ════════════════════════════════════════════════════════════
  // 7. NETTOYAGE
  // ════════════════════════════════════════════════════════════
  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (channelRef.current) channelRef.current.unsubscribe();
    if (localTrackRef.current) {
      localTrackRef.current.close();
      localTrackRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.leave();
      clientRef.current = null;
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDU
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{ height: "100vh", backgroundColor: colors.bg, color: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px" }}>
        <button onClick={() => handleLeave(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "24px", cursor: "pointer" }}>←</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <div style={{
            width: "120px", height: "120px", borderRadius: "50%", backgroundColor: colors.card,
            backgroundImage: otherUserAvatar ? `url(${otherUserAvatar})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {!otherUserAvatar && <span style={{ fontSize: "60px", color: "white" }}>👤</span>}
          </div>
          <div style={{
            position: "absolute", bottom: "4px", right: "4px", width: "24px", height: "24px",
            backgroundColor: isOtherUserJoined ? colors.green : colors.orange,
            borderRadius: "50%", border: "3px solid #000000"
          }} />
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0", textAlign: "center" }}>
          {otherUserName}
        </h1>

        <p style={{
          fontSize: "20px",
          fontWeight: isOtherUserJoined ? 600 : 400,
          color: isOtherUserJoined ? colors.primary : "rgba(255,255,255,0.6)",
          margin: 0
        }}>
          {isOtherUserJoined ? formatDuration(callDuration) : "En attente de réponse..."}
        </p>
      </div>

      <div style={{ paddingBottom: "60px", display: "flex", justifyContent: "center", gap: "24px" }}>
        <ControlButton icon={isMuted ? "🔇" : "🎤"} bgColor={colors.card} iconColor={isMuted ? colors.red : "#FFFFFF"} onClick={toggleMute} />
        <ControlButton icon={isSpeakerOn ? "🔊" : "🔈"} bgColor={colors.card} iconColor={isSpeakerOn ? colors.primary : "#FFFFFF"} onClick={toggleSpeaker} />
        <button onClick={() => handleLeave(true)} style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: colors.red, border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", cursor: "pointer", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)" }}>📞</button>
      </div>
    </div>
  );
}

// ─── COMPOSANT BOUTON ──────────────────────────────────────
function ControlButton({ icon, bgColor, iconColor, onClick }: { icon: string; bgColor: string; iconColor: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "64px", height: "64px", borderRadius: "50%", backgroundColor: bgColor,
        border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "28px", cursor: "pointer", transition: "transform 0.1s"
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon}
    </button>
  );
}

// ─── EXPORT PRINCIPAL AVEC SUSPENSE ──────────────────────
export default function VoiceCallPage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#000", color: "#fff" }}>
        Chargement...
      </div>
    }>
      <VoiceCallContent />
    </Suspense>
  );
}