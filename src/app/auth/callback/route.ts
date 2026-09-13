import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    // 1️⃣ Échanger le code contre une session
    const { error: sessionError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      // C'est ICI que l'erreur "User already registered" s'affichera dans la console
      console.error('❌ Erreur session Supabase:', sessionError.message)
      
      // On affiche l'erreur dans l'URL pour que tu puisses la lire
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(sessionError.message)}`)
    }

    const user = data.user
    
    if (user) {
      try {
        // 2️⃣ Vérifier si le profil existe déjà (avec maybeSingle pour éviter les erreurs)
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileCheckError) {
          console.error('Erreur vérification profil:', profileCheckError.message)
        }

        // 3️⃣ Si le profil n'existe pas, le créer avec les infos Google
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
            console.error('❌ Erreur création profil:', profileError.message)
          }
        }

        // 4️⃣ Succès : Rediriger vers les intérêts
        return NextResponse.redirect(`${origin}/interests`)
        
      } catch (err) {
        console.error('❌ Erreur inattendue dans le callback:', err)
        return NextResponse.redirect(`${origin}/login?error=unexpected_error`)
      }
    }
  }

  // Pas de code ou pas d'utilisateur
  return NextResponse.redirect(`${origin}/login?error=no_code_or_user`)
}