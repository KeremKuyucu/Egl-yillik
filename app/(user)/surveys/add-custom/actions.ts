"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth/data"

interface SuggestCategoryData {
    title: string
    emoji: string
    description: string
    color: string
}

export async function suggestCategory(data: SuggestCategoryData) {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const user = await getCurrentUser();

    if (!user) { return null; }

    // Validation
    if (!data.title || data.title.length < 3) {
        return { error: "Başlık en az 3 karakter olmalı" }
    }
    if (!data.emoji) {
        return { error: "Emoji zorunludur" }
    }
    if (!data.description || data.description.length < 10) {
        return { error: "Açıklama en az 10 karakter olmalı" }
    }

    // Renk formatı kontrolü (CSS Injection Security Fix)
    // Sadece 'from-color-shade to-color-shade' formatına izin ver
    const colorRegex = /^from-[a-z]+-\d{1,3} to-[a-z]+-\d{1,3}$/
    if (!data.color || !colorRegex.test(data.color)) {
        // Fallback or reject
        // Güvenlik için reddediyoruz, ama kullanıcıya daha nazik bir mesaj dönüyoruz
        return { error: "Geçersiz renk formatı seçildi" }
    }

    // Kullanıcının bekleyen öneri sayısını kontrol et (spam önleme)
    const { data: pendingCount } = await supabase
        .from("user_category_suggestions")
        .select("id", { count: 'exact', head: true })
        .eq("suggested_by", user.id)
        .eq("status", "pending")

    if (pendingCount && (pendingCount as any).count >= 5) {
        return { error: "En fazla 5 bekleyen öneriniz olabilir. Lütfen önceki önerilerinizin onaylanmasını bekleyin." }
    }

    // Benzer isimli kategori var mı kontrol et
    const { data: existingCategory } = await supabase
        .from("survey_categories")
        .select("id")
        .ilike("title", data.title.trim())
        .single()

    if (existingCategory) {
        return { error: "Bu isimde bir kategori zaten mevcut" }
    }

    // Benzer isimli bekleyen öneri var mı kontrol et
    const { data: existingSuggestion } = await supabase
        .from("user_category_suggestions")
        .select("id")
        .ilike("title", data.title.trim())
        .eq("status", "pending")
        .single()

    if (existingSuggestion) {
        return { error: "Bu isimde bir öneri zaten beklemede" }
    }

    // Öneriyi ekle
    const { error } = await supabase
        .from("user_category_suggestions")
        .insert({
            title: data.title.trim(),
            emoji: data.emoji.trim(),
            description: data.description.trim(),
            color: data.color,
            suggested_by: user.id,
            status: "pending"
        })

    if (error) {
        console.error("Suggest category error:", error)
        return { error: "Öneri gönderilirken hata oluştu: " + error.message }
    }

    revalidatePath("/surveys/add-custom")

    return { success: true }
}
