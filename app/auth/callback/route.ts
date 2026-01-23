import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    // Eğer next parametresi varsa oraya, yoksa dashboard'a git
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Başarılı giriş sonrası yönlendirme
            const safeNext = next.startsWith('/') ? next : '/dashboard'

            const redirectUrl = new URL(`${origin}${safeNext}`)

            // E-posta değişikliği durumu için mesaj
            if (searchParams.get("type") === "email_change") {
                redirectUrl.searchParams.set("message", "E-posta onayı alındı. Lütfen diğer e-posta adresinize gelen bağlantıyı da onaylayın.")
            }

            return NextResponse.redirect(redirectUrl)
        }
    }

    // Hata varsa login sayfasına yönlendir
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}