"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

import { isMessagingEnabled } from "@/lib/settings"

export async function deleteTextAction(id: string) {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    // RPC fonksiyonu ile soft delete (RLS bypass, yetki kontrolü DB'de yapılır)
    const { data, error } = await supabase.rpc('soft_delete_text', {
        target_text_id: id
    })

    if (error) return { error: error.message }

    // RPC'den dönen sonucu kontrol et
    if (data && !data.success) {
        return { error: data.error || "Silme işlemi başarısız" }
    }

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

    const user = await getCurrentUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    if (user.id === recipientId) {
        return { error: "Kendinize mesaj yazamazsınız" }
    }

    // Kullanıcının daha önce bu kişiye mesaj yazıp yazmadığını kontrol et (Aktif veya Pasif)
    const { data: existingText } = await supabase
        .from("texts")
        .select("id, is_active")
        .eq("author_id", user.id)
        .eq("recipient_id", recipientId)
        .maybeSingle()

    if (existingText) {
        if (existingText.is_active) {
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
        is_active: true
    })

    if (error) {
        console.error("Text creation error:", error)
        // Foreign key hatası = alıcı bulunamadı
        if (error.code === "23503") {
            return { error: "Alıcı bulunamadı" }
        }
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

    const user = await getCurrentUser()
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

    const user = await getCurrentUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    // RPC fonksiyonu ile soft delete (RLS bypass, yetki kontrolü DB'de yapılır)
    // Kullanıcı kendi yazısını silebilir veya admin her yazıyı silebilir
    const { data, error } = await supabase.rpc('soft_delete_text', {
        target_text_id: id
    })

    if (error) return { error: error.message }

    // RPC'den dönen sonucu kontrol et
    if (data && !data.success) {
        return { error: data.error || "Bu yazıyı silme yetkiniz yok" }
    }

    revalidatePath("/my-texts")
    return { success: true }
}
