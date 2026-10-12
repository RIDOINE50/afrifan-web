"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);

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

  // 2. Rejoindre le live : rejoint en AUDIENCE (peut juste regarder/écouter)
  const handleJoinLive = async () => {
    if (!liveData || isJoining) return;
    setIsJoining(true);
    setError(null);

    try {
      const AgoraRTCModule = await import("agora-rtc-sdk-ng");
      const AgoraRTC = AgoraRTCModule.default;

      const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!APP_ID) throw new Error("NEXT_PUBLIC_AGORA_APP_ID manquant");

      // ✅ Token en rôle AUDIENCE (peut seulement regarder/écouter)
      const tokenRes = await fetch("/api/agora-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: liveData.id.toString(),
          uid: 0,
          role: "audience", // 👈 SUBSCRIBER : pas de micro
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.error || "Impossible de récupérer le token");
      }
      const { token } = await tokenRes.json();

      // ✅ Créer le client en mode "live" et rôle "audience"
      clientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      await clientRef.current.setClientRole("audience"); // 👈 SPECTATEUR
      await clientRef.current.join(APP_ID, liveData.id.toString(), token, 0);

      console.log("✅ Rejoint le channel en audience:", liveData.id);

      // ✅ Compter les spectateurs
      clientRef.current.on("user-joined", () => {
        setViewerCount((p: number) => p + 1);
      });
      clientRef.current.on("user-left", () => {
        setViewerCount((p: number) => Math.max(0, p - 1));
      });

      // ✅ S'abonner à la vidéo + audio du créateur (quand il publie)
      clientRef.current.on("user-published", async (remoteUser: any, mediaType: string) => {
        console.log("👤 user-published:", remoteUser.uid, mediaType);
        await clientRef.current.subscribe(remoteUser, mediaType);

        if (mediaType === "video" && remoteVideoRef.current) {
          remoteUser.videoTrack.play(remoteVideoRef.current);
        }
        if (mediaType === "audio") {
          remoteUser.audioTrack.play();
          console.log("🔊 Audio du créateur en lecture");
        }
      });

      // ✅ S'abonner aux utilisateurs DÉJÀ présents (si le créateur publie AVANT)
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

      // ✅ Mettre à jour viewer_count
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
        {creatorData && (
          <button
            onClick={() => router.push(`/creator/profile?id=${creatorData.id}`)}
            style={{ padding: "12px 24px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Voir le profil du créateur
          </button>
        )}
        <button
          onClick={() => router.back()}
          style={{ padding: "12px 24px", backgroundColor: "transparent", color: "white", border: "1px solid #333", borderRadius: "8px", cursor: "pointer" }}
        >
          Retour
        </button>
      </div>
    );
  }

  // Écran "Rejoindre le live" (1 clic)
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

  // Vue live (le spectateur regarde et écoute)
  return (
    <div style={{ height: "100vh", backgroundColor: "#000", position: "relative", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Vidéo du créateur */}
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
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>
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
      </div>
    </div>
  );
}