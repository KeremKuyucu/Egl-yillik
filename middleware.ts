import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Giriş yapmamış kullanıcılar için public pathler
const publicPaths = [
  "/login",
  "/signup",
  "/forgot-password",
]

// Hem giriş yapmış hem de yapmamış kullanıcılar için erişilebilir pathler
const hybridPaths = [
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
  const isHybridPath = hybridPaths.some(p => pathname.startsWith(p))

  // Response'u önce oluştur
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          // Request cookie'lerini güncelle (Supabase'in o anki işlemde fark etmesi için)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // Response nesnesini güncelle (Client'a yeni cookie'leri göndermek için)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Auth durumunu kontrol et
  // DİKKAT: getUser() kullanımı getSession()'a göre daha güvenlidir çünkü 
  // her istekte veritabanına gidip kullanıcının hala geçerli olup olmadığını doğrular.
  const { data: { user } } = await supabase.auth.getUser()

  // --- YÖNLENDİRME MANTIĞI VE COOKIE TRANSFERİ ---

  // Yardımcı yönlendirme fonksiyonu:
  // Redirect response'u oluştururken mevcut response'daki (varsa yenilenmiş) cookie'leri taşır.
  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path

    const redirectResponse = NextResponse.redirect(url)

    // Mevcut response üzerindeki cookie'leri redirect response'a kopyala
    // Bu işlem refresh token'ın kaybolmamasını sağlar.
    const cookiesToSet = response.cookies.getAll()
    cookiesToSet.forEach(cookie => {
      redirectResponse.cookies.set(cookie)
    })

    return redirectResponse
  }

  // 🏠 Root path
  if (pathname === "/") {
    if (user) {
      return redirect("/dashboard")
    } else {
      return redirect("/login")
    }
  }

  // 🤝 Hybrid sayfa
  if (isHybridPath) {
    return response
  }

  // 🔓 Public sayfa (Login, Signup vb.)
  if (isPublicPath) {
    if (user) {
      return redirect("/dashboard")
    }
    return response
  }

  // 🔒 Protected sayfa
  if (!user) {
    // Kullanıcı giriş yapmaya çalışıyorsa ve oturumu yoksa login'e at
    // İstenirse returnTo parametresi eklenebilir: `/login?next=${pathname}`
    return redirect("/login")
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)"
  ]
}