import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    // 1️⃣ Échanger le code contre une session
    const { error: sessionError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Erreur session:', sessionError)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }

    // 2️⃣ Récupérer les infos de l'utilisateur connecté
    const user = data.user
    
    if (user) {
      // 3️ Vérifier si le profil existe déjà
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // 4️⃣ Si le profil n'existe pas, le créer avec les infos Google
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error('Erreur création profil:', profileError)
        }
      }

      // 5️⃣ Rediriger vers la page des intérêts (que ce soit nouveau ou ancien utilisateur)
      return NextResponse.redirect(`${origin}/interests`)
    }
  }

  // En cas d'erreur, rediriger vers login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}