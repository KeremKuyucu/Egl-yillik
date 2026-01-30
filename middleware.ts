import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const publicPaths = ["/login", "/signup", "/forgot-password"]
const hybridPaths = ["/update-password", "/auth/callback"]

export const config = {
  matcher: [
    /*
     * Aşağıdakiler hariç tüm istekleri yakala:
     * - api (özellikle cron ve webhooks için muafiyet)
     * - _next/static (statik dosyalar)
     * - _next/image (resim optimizasyonu)
     * - favicon.ico, logo.png vb. (statik varlıklar)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const user = (await supabase.auth.getUser()).data.user

  // --- REDIRECT HELPER ---
  const redirect = (path: string, includeCallback = false) => {
    const url = request.nextUrl.clone()
    if (includeCallback && path === "/login") {
      url.searchParams.set("callbackUrl", pathname + request.nextUrl.search)
    }
    url.pathname = path
    const res = NextResponse.redirect(url)
    response.cookies.getAll().forEach(c => res.cookies.set(c))
    return res
  }

  // 🏠 Root logic
  if (pathname === "/") return redirect(user ? "/dashboard" : "/login")

  // 🤝 Hybrid & Public logic
  if (hybridPaths.some(p => pathname.startsWith(p))) return response
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return user ? redirect("/dashboard") : response
  }

  // 🔒 Auth Guard
  if (!user) return redirect("/login", true)

  return response
}