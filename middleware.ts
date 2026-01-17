import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const publicPaths = [
  "/login",
  "/signup",
  "/forgot-password",
  "/update-password",
  "/auth/callback"
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static dosyalar
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|svg|gif|webp)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const isPublicPath = publicPaths.some(p => pathname.startsWith(p))

  // 🔓 Public sayfa → auth YOK
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 🔒 Protected sayfa
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: cookies => {
          cookies.forEach(c =>
            response.cookies.set(c.name, c.value, c.options)
          )
        }
      }
    }
  )

  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)"
  ]
}