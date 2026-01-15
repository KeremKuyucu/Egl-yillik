"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface AddCustomOptionData {
    categoryId: string
    optionName: string
    classFilter: string
}

export async function addCustomOption(data: AddCustomOptionData) {
    const supabase = await createClient()

    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    // Validation
    if (!data.categoryId) {
        return { error: "Kategori seçilmedi" }
    }
    if (!data.optionName || data.optionName.length < 2) {
        return { error: "İsim en az 2 karakter olmalı" }
    }
    if (!data.classFilter) {
        return { error: "Sınıf bilgisi bulunamadı" }
    }

    // Kategori var mı kontrol et
    const { data: category } = await supabase
        .from("survey_categories")
        .select("id")
        .eq("id", data.categoryId)
        .eq("is_active", true)
        .single()

    if (!category) {
        return { error: "Geçersiz kategori" }
    }

    // Aynı isim bu kategoride bu sınıf için zaten var mı?
    const { data: existing } = await supabase
        .from("survey_custom_options")
        .select("id")
        .eq("category_id", data.categoryId)
        .eq("class_filter", data.classFilter)
        .ilike("option_name", data.optionName.trim())
        .single()

    if (existing) {
        return { error: "Bu seçenek zaten mevcut" }
    }

    // Özel seçeneği ekle
    const { error } = await supabase
        .from("survey_custom_options")
        .insert({
            category_id: data.categoryId,
            option_name: data.optionName.trim(),
            class_filter: data.classFilter,
            created_by: user.id
        })

    if (error) {
        console.error("Add custom option error:", error)
        return { error: "Seçenek eklenirken hata oluştu: " + error.message }
    }

    revalidatePath("/surveys")
    revalidatePath(`/surveys/${data.categoryId}`)

    return { success: true }
}
