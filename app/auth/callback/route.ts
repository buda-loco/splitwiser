import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { autoClaimOnLogin } from '@/lib/actions/claim'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    // No code provided, redirect to error
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/error', request.url))
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    // Attempt auto-claim if user has email
    if (user?.email) {
      const { needsManualClaim } = await autoClaimOnLogin(user.email)

      // If multiple participants found, redirect to claim page
      if (needsManualClaim) {
        return NextResponse.redirect(new URL('/auth/claim', request.url))
      }
    }

    // Successful authentication, redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  } catch (err) {
    console.error('Unexpected error in auth callback:', err)
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}
