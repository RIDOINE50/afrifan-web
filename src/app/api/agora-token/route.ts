import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelName, uid, role } = body; // 👈 AJOUT de "role"

    // ✅ Validation
    if (!channelName) {
      return NextResponse.json(
        { error: "channelName est requis" },
        { status: 400 }
      );
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("❌ Variables d'env Agora manquantes");
      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 500 }
      );
    }

    // ✅ Token valide 24h (en secondes)
    const expirationTimeInSeconds = 24 * 60 * 60;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // ✅ uid = 0 signifie "n'importe quel uid"
    const userUid = uid ? parseInt(uid.toString(), 10) : 0;

    // ✅ NOUVEAU : choisir le rôle selon la demande
    // - "audience" → SUBSCRIBER (peut seulement REGARDER)
    // - tout le reste (ou rien) → PUBLISHER (peut DIFFUSER)
    const agoraRole = role === "audience" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    // ✅ Génère le token avec le bon rôle
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      userUid,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return NextResponse.json({ token, uid: userUid, role: agoraRole });
  } catch (error) {
    console.error("❌ Erreur génération token Agora:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du token" },
      { status: 500 }
    );
  }
}