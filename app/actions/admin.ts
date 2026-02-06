"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface UpdateUserProfileData {
    first_name: string
    last_name: string
    school_number: string
    class: string
}

export async function updateUserRole(userId: string, newRoleKey: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc('admin_update_user_role', {
            target_user_id: userId,
            new_role_key: newRoleKey
        })

        if (error) {
            console.error("Rol güncelleme hatası:", error)
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

        if (result && !result.success) {
            return { success: false, error: result.error }
        }

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}
