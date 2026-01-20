"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAdmin } from "@/lib/auth"

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
        const supabase = await createClient()

        // RPC çağrısı - Tüm yetki ve mantık kontrolleri DB tarafında yapılacak
        const { data: result, error } = await supabase.rpc('admin_update_user_profile', {
            target_user_id: userId,
            new_first_name: data.first_name,
            new_last_name: data.last_name,
            new_school_number: data.school_number,
            new_class: data.class
        })

        if (error) {
            console.error("Profil güncelleme hatası:", error)
            return { success: false, error: error.message }
        }

        // RPC'den dönen sonucu kontrol et
        if (result && !result.success) {
            return { success: false, error: result.error }
        }

        // Sayfayı yenile
        revalidatePath("/admin/users")

        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}