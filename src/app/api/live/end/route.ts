import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get("streamId");

    if (!streamId) {
      return NextResponse.json({ error: "streamId manquant" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ 1. Marquer le live comme terminé + reset le viewer_count
    const { error: updateErr } = await supabase
      .from("live_streams")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        viewer_count: 0, // 👈 reset à 0
      })
      .eq("id", streamId)
      .eq("status", "live"); // 👈 sécurité : ne touche que les lives actifs

    if (updateErr) {
      console.error("❌ Erreur update end live:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    console.log("✅ Live terminé via sendBeacon:", streamId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur end live:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}