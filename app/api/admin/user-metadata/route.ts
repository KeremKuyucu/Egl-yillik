import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLES } from "@/lib/constants"

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Oturum kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 })
    }

    // Admin kontrolü
    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    if (!profile || profile.level < ROLES.SUPER_ADMIN) {
        return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 })
    }

    // UserId parametresini al
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ error: "userId parametresi gerekli" }, { status: 400 })
    }

    try {
        // Admin client ile kullanıcı bilgilerini al
        const adminClient = createAdminClient()

        const { data: userData, error } = await adminClient.auth.admin.getUserById(userId)

        if (error) {
            console.error("Get user error:", error)
            return NextResponse.json({ error: "Kullanıcı bilgisi alınamadı" }, { status: 500 })
        }

        if (!userData.user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
        }

        // Sadece gerekli bilgileri döndür
        return NextResponse.json({
            id: userData.user.id,
            email: userData.user.email,
            phone: userData.user.phone,
            created_at: userData.user.created_at,
            last_sign_in_at: userData.user.last_sign_in_at,
            email_confirmed_at: userData.user.email_confirmed_at,
            user_metadata: userData.user.user_metadata,
            app_metadata: userData.user.app_metadata,
            identities: userData.user.identities,
        })
    } catch (e) {
        console.error("Metadata fetch error:", e)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
