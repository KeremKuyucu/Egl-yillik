import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Auth oturumunu yeniler ve korumalı route'lara erişimi kontrol eder.
 * Her request'te edge seviyesinde çalışır.
 */

// Auth gerektirmeyen public route'lar
const PUBLIC_ROUTES = [
    "/login",
    "/signup",
    "/forgot-password",
    "/auth",
    "/health",
    "/register-closed",
    "/unsubscribe",
]

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: createServerClient ile auth kontrolü arasında başka kod çalıştırma.
    // Token yenileme (refresh) bu çağrı sırasında otomatik yapılır.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        pathname.startsWith(route)
    )

    // Oturum yoksa ve korumalı route'taysa → login'e yönlendir
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        // Geri dönüş için mevcut path'i sakla
        if (pathname !== "/") {
            url.searchParams.set("next", pathname)
        }
        return NextResponse.redirect(url)
    }

    // Oturum varsa ve login/signup'taysa → home'a yönlendir
    if (user && (pathname === "/login" || pathname === "/signup")) {
        const url = request.nextUrl.clone()
        url.pathname = "/home"
        return NextResponse.redirect(url)
    }

    // IMPORTANT: supabaseResponse objesini olduğu gibi döndür.
    // Cookie'ler bu response üzerinden tarayıcıya iletilir.
    return supabaseResponse
}
