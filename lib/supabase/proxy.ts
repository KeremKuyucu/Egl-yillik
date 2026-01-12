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

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // Handle invalid refresh token by clearing cookies
      if (error.code === 'refresh_token_not_found' || error.status === 400) {
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
    const response = NextResponse.redirect(new URL('/login', request.url))
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.delete(cookie.name)
      }
    })
    return response
  }

  if (
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/new") ||
      request.nextUrl.pathname.startsWith("/edit")) &&
    !user
  ) {
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
