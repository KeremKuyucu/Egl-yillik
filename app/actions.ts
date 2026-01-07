"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ROLES } from "@/lib/constants"

export async function deleteTextAction(id: string) {
    const supabase = await createClient()

    // Önce yetki kontrolü (Ekstra güvenlik)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data: profile } = await supabase.from("profiles").select("level").eq("id", user.id).single()
    if (!profile || profile.level < ROLES.ADMIN) return { error: "Forbidden" }

    const { error } = await supabase.from("texts").delete().eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: true }
}

export async function createTextAction(recipientId: string, content: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    if (user.id === recipientId) {
        return { error: "Kendinize mesaj yazamazsınız" }
    }

    // Kullanıcının daha önce yazıp yazmadığını kontrol et
    const { data: existingText } = await supabase
        .from("texts")
        .select("id")
        .eq("author_id", user.id)
        .eq("recipient_id", recipientId)
        .single()

    if (existingText) {
        return { error: "Bu kişiye zaten bir mesaj yazdınız" }
    }

    // Alıcının var olduğunu kontrol et
    const { data: recipient } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", recipientId)
        .single()

    if (!recipient) {
        return { error: "Alıcı bulunamadı" }
    }

    const { error } = await supabase.from("texts").insert({
        author_id: user.id,
        recipient_id: recipientId,
        content: content,
    })

    if (error) {
        console.error("Text creation error:", error)
        return { error: "Mesaj kaydedilirken bir hata oluştu" }
    }

    revalidatePath("/dashboard")
    return { success: true }
}