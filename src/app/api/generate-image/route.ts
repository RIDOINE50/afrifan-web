import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt manquant' }, { status: 400 });
  }

  try {
    // L'URL de Pollinations (le serveur Next.js fait cette requête, pas le navigateur)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&noCache=true`;

    const response = await fetch(pollinationsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Erreur Pollinations: ${response.status}` }, { status: response.status });
    }

    // Récupérer l'image en tant que buffer binaire
    const imageBuffer = await response.arrayBuffer();

    // Renvoyer l'image au navigateur avec les bons headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Erreur serveur IA:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}