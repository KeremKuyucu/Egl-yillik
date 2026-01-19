"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ROLES } from "@/lib/constants"
import { isMessagingEnabled } from "@/lib/settings"

export async function deleteTextAction(id: string) {
    const supabase = await createClient()

    // Önce yetki kontrolü (Ekstra güvenlik)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data: profile } = await supabase.from("profiles").select("level").eq("id", user.id).single()
    if (!profile || profile.level < ROLES.ADMIN) return { error: "Forbidden" }

    // Soft delete: is_active = false yap (gerçek silme yapmıyoruz)
    const { error } = await supabase
        .from("texts")
        .update({ is_active: false })
        .eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/admin/texts")
    return { success: true }
}

export async function createTextAction(recipientId: string, content: string) {
    const supabase = await createClient()

    // Mesaj yazma açık mı kontrol et
    const messagingEnabled = await isMessagingEnabled()
    if (!messagingEnabled) {
        return { error: "Mesaj yazma şu anda kapalıdır. Lütfen daha sonra tekrar deneyin." }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    if (user.id === recipientId) {
        return { error: "Kendinize mesaj yazamazsınız" }
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

    // Kullanıcının daha önce bu kişiye mesaj yazıp yazmadığını kontrol et (Aktif veya Pasif)
    const { data: existingText } = await supabase
        .from("texts")
        .select("id, is_active")
        .eq("author_id", user.id)
        .eq("recipient_id", recipientId)
        .maybeSingle() // unique constraint olduğu için en fazla 1 kayıt olabilir

    if (existingText) {
        if (existingText.is_active) {
            // Aktif mesaj varsa hata dön
            return { error: "Bu kişiye zaten bir mesaj yazdınız" }
        } else {
            // Pasif (silinmiş) mesaj varsa, onu güncelle ve tekrar aktif yap
            const { error: updateError } = await supabase
                .from("texts")
                .update({
                    content: content,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq("id", existingText.id)

            if (updateError) {
                console.error("Text restore error:", updateError)
                return { error: "Mesaj güncellenirken bir hata oluştu" }
            }

            revalidatePath("/dashboard")
            return { success: true }
        }
    }

    // Hiç kayıt yoksa yeni oluştur
    const { error } = await supabase.from("texts").insert({
        author_id: user.id,
        recipient_id: recipientId,
        content: content,
        is_active: true // Varsayılan true ama açıkça belirtelim
    })

    if (error) {
        console.error("Text creation error:", error)
        return { error: "Mesaj kaydedilirken bir hata oluştu" }
    }

    revalidatePath("/dashboard")
    return { success: true }
}

export async function updateTextAction(id: string, content: string) {
    const supabase = await createClient()

    // Sistem kontrolü
    const messagingEnabled = await isMessagingEnabled()
    if (!messagingEnabled) {
        return { error: "Sistem kilitli: Yazı güncelleme kapalıdır." }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    // Yazının kullanıcıya ait olduğunu kontrol et
    const { data: text } = await supabase
        .from("texts")
        .select("author_id")
        .eq("id", id)
        .single()

    if (!text) return { error: "Yazı bulunamadı" }
    if (text.author_id !== user.id) return { error: "Bu yazıyı düzenleme yetkiniz yok" }

    const { error } = await supabase
        .from("texts")
        .update({
            content,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/dashboard")
    return { success: true }
}

export async function deleteMyTextAction(id: string) {
    const supabase = await createClient()

    // Sistem kontrolü
    const messagingEnabled = await isMessagingEnabled()
    if (!messagingEnabled) {
        return { error: "Sistem kilitli: Yazı silme kapalıdır." }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    // Yazının kullanıcıya ait olduğunu kontrol et
    const { data: text } = await supabase
        .from("texts")
        .select("author_id")
        .eq("id", id)
        .single()

    if (!text) return { error: "Yazı bulunamadı" }
    if (text.author_id !== user.id) return { error: "Bu yazıyı silme yetkiniz yok" }

    // Hard delete
    const { error } = await supabase
        .from("texts")
        .delete()
        .eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/dashboard")
    return { success: true }
}
