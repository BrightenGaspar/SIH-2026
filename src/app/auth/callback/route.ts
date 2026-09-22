import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || searchParams.get('role') || '/buyer/dashboard' // Target destination panel

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybtncqqphsnbazmwvuvi.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const resolvedNext = (next === '/buyer/dashboard' || next === 'buyer' || next === 'consumer')
        ? '/consumer/dashboard'
        : (next === 'farmer' ? '/farmer/dashboard' : (next === 'logistics' ? '/logistics/dashboard' : next))
      return NextResponse.redirect(`${origin}${resolvedNext.startsWith('/') ? resolvedNext : `/${resolvedNext}`}`)
    }
  }
  // Fallback link if the security verification exchanges crash
  return NextResponse.redirect(`${origin}/consumer/login?error=auth_callback_failed`)
}
