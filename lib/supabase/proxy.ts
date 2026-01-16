import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Auth gerektirmeyen sayfalar - bunlara her zaman erişim var
  const publicPaths = ['/login', '/signup', '/forgot-password', '/auth/callback', '/update-password']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // Handle invalid refresh token by clearing cookies
      // Ama sadece korumalı sayfalarda redirect yap
      if ((error.code === 'refresh_token_not_found' || error.status === 400) && !isPublicPath) {
        // Clear all supabase auth cookies
        const response = NextResponse.redirect(new URL('/login', request.url))
        request.cookies.getAll().forEach(cookie => {
          if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
            response.cookies.delete(cookie.name)
          }
        })
        return response
      }
    }
    user = data.user
  } catch (error) {
    // If there's an auth error, clear cookies and redirect to login
    // Ama sadece korumalı sayfalarda redirect yap
    if (!isPublicPath) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
          response.cookies.delete(cookie.name)
        }
      })
      return response
    }
  }

  // Ana sayfa için yönlendirme
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = user ? "/dashboard" : "/login"
    return NextResponse.redirect(url)
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname === "/login" && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
