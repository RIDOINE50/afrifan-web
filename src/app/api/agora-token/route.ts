import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(request: Request) {
  try {
    const { channelName } = await request.json();
    
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '18d7051c40f14cea8953b23824683c0b';
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || 'ea5e4a39245d4849bfd84a99d5100632';
    
    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // ✅ La fonction attend 7 arguments : (appId, appCertificate, channelName, uid, role, privilegeExpire, tokenExpire)
    // Nous fournissons les deux timestamps (ils peuvent être identiques)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,   // privilegeExpire
      privilegeExpiredTs    // tokenExpire (7ème argument)
    );
    
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur génération token' }, { status: 500 });
  }
}