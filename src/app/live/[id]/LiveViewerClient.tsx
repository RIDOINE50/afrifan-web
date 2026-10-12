"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TipDialog from "@/components/TipDialog";

type LiveMessage = {
  id: string;
  live_stream_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
};

export default function LiveViewerClient() {
  const router = useRouter();
  const params = useParams();
  const liveId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [creatorData, setCreatorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // 💬 Chat
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🎁 Cadeau
  const [showTipDialog, setShowTipDialog] = useState(false);

  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);

  // Auto-scroll du chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 1. Charger les données du live + vérifier l'accès
  useEffect(() => {
    if (!liveId) return;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);

        const { data: live, error: liveErr } = await supabase
          .from("live_streams")
          .select("*")
          .eq("id", liveId)
          .maybeSingle();

        if (liveErr || !live) {
          setError("Live introuvable.");
          setIsLoading(false);
          return;
        }

        if (live.status !== "live") {
          setError("Ce live est terminé.");
          setIsLoading(false);
          return;
        }

        setLiveData(live);
        setViewerCount(live.viewer_count || 0);

        const { data: creator } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, is_verified, role, premium_price, pro_price")
          .eq("id", live.creator_id)
          .maybeSingle();

        setCreatorData(creator);

        // Vérifier l'accès si le live est payant
        if (live.requires_subscription) {
          if (!session?.user) {
            setError("Ce live est réservé aux abonnés. Connectez-vous pour y accéder.");
            setIsLoading(false);
            return;
          }

          const { data: sub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("fan_id", session.user.id)
            .eq("creator_id", live.creator_id)
            .eq("status", "active")
            .gte("end_date", new Date().toISOString())
            .limit(1)
            .maybeSingle();

          if (!sub) {
            setError("Ce live est réservé aux abonnés. Abonnez-vous pour y accéder.");
            setIsLoading(false);
            return;
          }
        }

        // 💬 Charger les derniers messages
        const { data: msgs } = await supabase
          .from("live_messages")
          .select("*")
          .eq("live_stream_id", liveId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (msgs) setMessages(msgs);

        setIsLoading(false);
      } catch (err) {
        console.error("❌ Erreur init viewer:", err);
        setError("Une erreur est survenue.");
        setIsLoading(false);
      }
    };

    init();

    return () => {
      cleanupAgora();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId]);

  // 💬 Écoute en temps réel des nouveaux messages
  useEffect(() => {
    if (!liveId) return;

    const channel = supabase
      .channel(`live-chat-${liveId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_messages",
          filter: `live_stream_id=eq.${liveId}`,
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
  }, [liveId]);

  // 💬 Envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !liveData || isSending) return;
    setIsSending(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const displayName =
        profile?.full_name || profile?.username || user.email?.split("@")[0] || "Anonyme";

      const { error: insertErr } = await supabase.from("live_messages").insert({
        live_stream_id: liveData.id,
        user_id: user.id,
        content: newMessage.trim(),
        user_name: displayName,
        user_avatar: profile?.avatar_url || null,
      });

      if (insertErr) throw insertErr;

      setNewMessage("");
    } catch (err) {
      console.error("❌ Erreur envoi message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 2. Rejoindre le live en AUDIENCE
  const handleJoinLive = async () => {
    if (!liveData || isJoining) return;
    setIsJoining(true);
    setError(null);

    try {
      const AgoraRTCModule = await import("agora-rtc-sdk-ng");
      const AgoraRTC = AgoraRTCModule.default;

      const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!APP_ID) throw new Error("NEXT_PUBLIC_AGORA_APP_ID manquant");

      const tokenRes = await fetch("/api/agora-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: liveData.id.toString(),
          uid: 0,
          role: "audience",
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.error || "Impossible de récupérer le token");
      }
      const { token } = await tokenRes.json();

      clientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await clientRef.current.setClientRole("audience");
      await clientRef.current.join(APP_ID, liveData.id.toString(), token, 0);

      console.log("✅ Rejoint le channel en audience:", liveData.id);

      clientRef.current.on("user-joined", () => {
        setViewerCount((p: number) => p + 1);
      });
      clientRef.current.on("user-left", () => {
        setViewerCount((p: number) => Math.max(0, p - 1));
      });

      clientRef.current.on("user-published", async (remoteUser: any, mediaType: string) => {
        await clientRef.current.subscribe(remoteUser, mediaType);
        if (mediaType === "video" && remoteVideoRef.current) {
          remoteUser.videoTrack.play(remoteVideoRef.current);
        }
        if (mediaType === "audio") {
          remoteUser.audioTrack.play();
        }
      });

      clientRef.current.remoteUsers.forEach(async (remoteUser: any) => {
        if (remoteUser.hasVideo) {
          await clientRef.current.subscribe(remoteUser, "video");
          if (remoteVideoRef.current) {
            remoteUser.videoTrack.play(remoteVideoRef.current);
          }
        }
        if (remoteUser.hasAudio) {
          await clientRef.current.subscribe(remoteUser, "audio");
          remoteUser.audioTrack.play();
        }
      });

      await supabase
        .from("live_streams")
        .update({ viewer_count: (liveData.viewer_count || 0) + 1 })
        .eq("id", liveData.id);

      setHasJoined(true);
    } catch (err: any) {
      console.error("❌ Erreur join viewer:", err);
      setError(err?.message || "Impossible de rejoindre le live.");
    } finally {
      setIsJoining(false);
    }
  };

  const cleanupAgora = async () => {
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current = null;
    }
  };

  const handleLeave = async () => {
    if (liveData?.id) {
      await supabase
        .from("live_streams")
        .update({ viewer_count: Math.max(0, (liveData.viewer_count || 1) - 1) })
        .eq("id", liveData.id);
    }
    await cleanupAgora();
    router.back();
  };

  // ===== UI =====

  if (isLoading) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        Chargement du live...
      </div>
    );
  }

  if (error && !hasJoined) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#000", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", gap: "20px" }}>
        <h2 style={{ color: "#EF4444" }}>Accès impossible</h2>
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          style={{ padding: "12px 24px", backgroundColor: "transparent", color: "white", border: "1px solid #333", borderRadius: "8px", cursor: "pointer" }}
        >
          Retour
        </button>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#000", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", gap: "20px" }}>
        {creatorData?.avatar_url && (
          <img
            src={creatorData.avatar_url}
            alt={creatorData.username}
            style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #EF4444" }}
          />
        )}
        <div>
          <h2 style={{ margin: 0 }}>
            {creatorData?.full_name || creatorData?.username}
            {creatorData?.is_verified && <span style={{ color: "#3B82F6", marginLeft: "8px" }}>✓</span>}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>{liveData?.title}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", backgroundColor: "#EF4444", borderRadius: "50%" }} />
          <span style={{ fontWeight: "bold" }}>EN DIRECT</span>
          <span style={{ color: "rgba(255,255,255,0.7)" }}>• {viewerCount} spectateurs</span>
        </div>

        <button
          onClick={handleJoinLive}
          disabled={isJoining}
          style={{
            padding: "16px 40px",
            backgroundColor: "#EF4444",
            color: "white",
            border: "none",
            borderRadius: "30px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: isJoining ? "wait" : "pointer",
            opacity: isJoining ? 0.6 : 1,
            boxShadow: "0 4px 15px rgba(239,68,68,0.4)",
          }}
        >
          {isJoining ? "Connexion..." : "🎥 Regarder le live"}
        </button>
      </div>
    );
  }

  // ===== Vue live avec CHAT + CADEAU =====
  return (
    <div style={{ height: "100vh", backgroundColor: "#000", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Vidéo */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          ref={remoteVideoRef}
          style={{
            width: "100%",
            maxWidth: "500px",
            height: "100%",
            maxHeight: "900px",
            backgroundColor: "#111",
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
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {creatorData?.avatar_url && (
              <img
                src={creatorData.avatar_url}
                alt=""
                style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #EF4444" }}
              />
            )}
            <div>
              <div style={{ color: "white", fontWeight: "bold", fontSize: "14px" }}>
                {creatorData?.full_name || creatorData?.username}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                <div style={{ width: "6px", height: "6px", backgroundColor: "#EF4444", borderRadius: "50%" }} />
                {viewerCount} spectateurs
              </div>
            </div>
          </div>

          <button
            onClick={handleLeave}
            style={{
              padding: "8px 16px",
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            ✕ Quitter
          </button>
        </div>

        {/* 💬 Messages overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "90px",
            left: "16px",
            right: "16px",
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

        {/* 🎁 Bouton cadeau */}
        <button
          onClick={() => setShowTipDialog(true)}
          style={{
            position: "absolute",
            bottom: "20px",
            right: "90px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.9)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            fontSize: "26px",
            zIndex: 10,
            backdropFilter: "blur(6px)",
            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Envoyer un cadeau"
        >
          🎁
        </button>

        {/* 💬 Bouton chat */}
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: "absolute",
            bottom: "20px",
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
      </div>

      {/* 💬 Panneau chat ouvert */}
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
              <h3 style={{ color: "white", margin: 0, fontSize: "16px" }}>💬 Chat en direct</h3>
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
                  Aucun message. Soyez le premier !
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

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={user ? "Écrire un message..." : "Connectez-vous pour écrire"}
                disabled={!user || isSending}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                }}
                maxLength={200}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !user || isSending}
                style={{
                  padding: "12px 20px",
                  borderRadius: "24px",
                  border: "none",
                  backgroundColor: newMessage.trim() && user ? "#EF4444" : "#333",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: newMessage.trim() && user ? "pointer" : "not-allowed",
                }}
              >
                {isSending ? "..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎁 TipDialog (cadeau) */}
      {showTipDialog && creatorData?.id && (
        <TipDialog
          creatorId={creatorData.id}
          creatorName={creatorData.full_name || creatorData.username || "Créateur"}
          onClose={() => setShowTipDialog(false)}
          onSuccess={() => {
            console.log("🎁 Cadeau envoyé !");
          }}
        />
      )}
    </div>
  );
}