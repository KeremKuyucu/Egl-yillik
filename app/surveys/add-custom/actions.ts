"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface SuggestCategoryData {
    title: string
    emoji: string
    description: string
    color: string
}

export async function suggestCategory(data: SuggestCategoryData) {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

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
