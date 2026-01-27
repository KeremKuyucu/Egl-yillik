"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleEmailReminders(isOptedOut: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    try {
        if (isOptedOut) {
            // İstemiyor -> Ekle
            const { error } = await supabase
                .from("email_opt_outs")
                .upsert({ user_id: user.id })

            if (error) throw error
        } else {
            // İstiyor -> Sil
            const { error } = await supabase
                .from("email_opt_outs")
                .delete()
                .eq("user_id", user.id)

            if (error) throw error
        }

        revalidatePath("/settings")
        return { success: true }
    } catch (error: any) {
        console.error("Toggle Email Error:", error)
        return { error: error.message }
    }
}

export async function getEmailPreference() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { isOptedOut: false }

    const { data, error } = await supabase
        .from("email_opt_outs")
        .select("user_id")
        .eq("user_id", user.id)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error("Get Email Preference Error:", error)
        return { isOptedOut: false }
    }

    return { isOptedOut: !!data }
}
