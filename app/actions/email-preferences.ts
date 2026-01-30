"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

export async function toggleEmailReminders(isOptedOut: boolean) {
    // getUser() yerine merkezi fonksiyonu çağırıyoruz
    const user = await getCurrentUser()

    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    const supabase = await createClient()

    try {
        if (isOptedOut) {
            const { error } = await supabase
                .from("email_opt_outs")
                .upsert({ user_id: user.id }) // user.id kullanımı rasyonel

            if (error) throw error
        } else {
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
        return { error: "İşlem sırasında bir hata oluştu." }
    }
}

export async function getEmailPreference() {
    const user = await getCurrentUser()

    // Oturum yoksa varsayılan değer dön (Hata verme)
    if (!user) return { isOptedOut: false }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("email_opt_outs")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle() // .single() yerine .maybeSingle() kullanmak PGRST116 hatasını (satır bulunamadı) otomatik yönetir.

    if (error) {
        console.error("Get Email Preference Error:", error)
        return { isOptedOut: false }
    }

    return { isOptedOut: !!data }
}