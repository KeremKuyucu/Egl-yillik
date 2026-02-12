"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth/data"
import { isMessagingEnabled } from "@/lib/settings"

export async function createAnonymousTextAction(
    recipientId: string,
    content: string,
    displayName?: string
) {
    // Messaging açık mı kontrol et
    const messagingEnabled = await isMessagingEnabled()
    if (!messagingEnabled) {
        return { error: "Mesaj yazma şu anda kapalıdır. Lütfen daha sonra tekrar deneyin." }
    }

    const user = await getCurrentUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    if (user.id === recipientId) {
        return { error: "Kendinize anonim mesaj yazamazsınız" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("insert_anonymous_text", {
        p_recipient_id: recipientId,
        p_content: content,
        p_display_name: displayName || null,
    })

    if (error) {
        console.error("Anonymous text RPC error:", error)
        return { error: "Mesaj kaydedilirken bir hata oluştu" }
    }

    // RPC jsonb dönüyor
    if (data && !data.success) {
        return { error: data.error || "Mesaj kaydedilemedi" }
    }

    revalidatePath("/home")
    revalidatePath("/anonymous")
    return { success: true }
}
