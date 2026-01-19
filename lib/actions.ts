"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAdmin, getCurrentUser } from "@/lib/auth"

interface UpdateUserProfileData {
    first_name: string
    last_name: string
    school_number: string
    class: string
}

{/* Yapımcı GitHub:KeremKuyucu */ }
export async function updateUserLevel(userId: string, newLevel: number) {
    try {
        // Oturum kontrolü
        const auth = await checkAdmin()
        if (!auth.success) return { success: false, error: auth.error }

        const supabase = await createClient()

        // RPC çağrısı - Tüm yetki ve mantık kontrolleri DB tarafında yapılacak
        const { error } = await supabase.rpc('admin_update_user_level', {
            target_user_id: userId,
            new_level: newLevel
        })

        if (error) {
            console.error("Level güncelleme hatası:", error)
            // RPC'den dönen özel hataları kullanıcıya göster
            return { success: false, error: error.message }
        }

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Beklenmeyen hata:", error)
        return { success: false, error: "Beklenmeyen bir hata oluştu" }
    }
}

export async function updateUserProfile(
    userId: string,
    data: UpdateUserProfileData
) {
    try {
        // Merkezi admin kontrolü
        const auth = await checkAdmin()
        if (!auth.success) return { success: false, error: auth.error }

        const supabase = await createClient()

        // Düzenlenecek kullanıcının seviyesini kontrol et
        const { data: targetUser } = await supabase
            .from("user_levels")
            .select("level")
            .eq("id", userId)
            .single()

        if (!targetUser) {
            return { success: false, error: "Kullanıcı bulunamadı" }
        }

        // Kendinden düşük seviyedeki kullanıcıları düzenleyebilir
        if (auth.level <= (targetUser.level ?? 0)) {
            return { success: false, error: "Bu kullanıcıyı düzenleme yetkiniz yok" }
        }

        // Kendi profilini düzenleyemez
        if (userId === auth.user.id) {
            return { success: false, error: "Kendi profilinizi düzenleyemezsiniz" }
        }

        // Profili güncelle
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                first_name: data.first_name,
                last_name: data.last_name,
                school_number: data.school_number,
                class: data.class,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

        if (updateError) {
            console.error("Profil güncelleme hatası:", updateError)
            return { success: false, error: "Profil güncellenirken bir hata oluştu" }
        }

        // Sayfayı yenile
        revalidatePath("/admin/users")

        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}