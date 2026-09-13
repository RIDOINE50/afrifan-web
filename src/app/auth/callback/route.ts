import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Si un paramètre 'next' est passé, on l'utilise, sinon on redirige vers /interests
  const next = searchParams.get('next') ?? '/interests'

  if (code) {
    // On utilise l'instance 'supabase' déjà importée
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Succès : on redirige l'utilisateur vers la suite de l'application
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // En cas d'erreur, on renvoie vers la page de connexion avec un message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}