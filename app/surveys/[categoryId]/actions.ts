"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitSurveyVote(
    categoryId: string,
    votedForId: string | null,
    customOptionId: string | null
) {
    const supabase = await createClient()

    // En az biri dolu olmalı
    if (!votedForId && !customOptionId) {
        return { error: "Bir seçim yapmanız gerekiyor" }
    }

    // Sadece biri dolu olmalı
    if (votedForId && customOptionId) {
        return { error: "Sadece bir seçim yapabilirsiniz" }
    }

    // Kategori kontrolü - Supabase'den kontrol et
    const { data: category } = await supabase
        .from("survey_categories")
        .select("id")
        .eq("id", categoryId)
        .eq("is_active", true)
        .single()

    if (!category) {
        return { error: "Geçersiz veya pasif kategori" }
    }

    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    // Kullanıcı profili (sınıf bilgisi için)
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("class")
        .eq("id", user.id)
        .single()

    if (!userProfile) {
        return { error: "Kullanıcı profili bulunamadı" }
    }

    // Oy verilecek kişi kontrolü
    if (votedForId) {
        // Kendine oy veremez
        if (user.id === votedForId) {
            return { error: "Kendinize oy veremezsiniz" }
        }

        // Oy verilecek kişi gerçekten var mı ve aynı sınıfta mı?
        const { data: votedFor } = await supabase
            .from("profiles")
            .select("id, class")
            .eq("id", votedForId)
            .single()

        if (!votedFor) {
            return { error: "Seçilen kişi bulunamadı" }
        }

        if (votedFor.class !== userProfile.class) {
            return { error: "Sadece kendi sınıfınızdan birine oy verebilirsiniz" }
        }
    }

    // Custom option kontrolü
    if (customOptionId) {
        const { data: customOption } = await supabase
            .from("survey_custom_options")
            .select("id, class, category_id")
            .eq("id", customOptionId)
            .single()

        if (!customOption) {
            return { error: "Seçilen özel seçenek bulunamadı" }
        }

        if (customOption.class !== userProfile.class) {
            return { error: "Bu özel seçenek sizin sınıfınıza ait değil" }
        }

        if (customOption.category_id !== categoryId) {
            return { error: "Bu özel seçenek bu kategoriye ait değil" }
        }
    }

    // Daha önce bu kategoride oy verilmiş mi?
    const { data: existingVote } = await supabase
        .from("survey_votes")
        .select("id")
        .eq("voter_id", user.id)
        .eq("category_id", categoryId)
        .single()

    if (existingVote) {
        // Oy güncelle
        const { error } = await supabase
            .from("survey_votes")
            .update({
                voted_for_id: votedForId,
                custom_option_id: customOptionId,
                updated_at: new Date().toISOString()
            })
            .eq("id", existingVote.id)

        if (error) {
            console.error("Vote update error:", error)
            return { error: "Oy güncellenirken hata oluştu" }
        }
    } else {
        // Yeni oy ekle
        const { error } = await supabase
            .from("survey_votes")
            .insert({
                voter_id: user.id,
                voted_for_id: votedForId,
                custom_option_id: customOptionId,
                category_id: categoryId
            })

        if (error) {
            console.error("Vote insert error:", error)
            return { error: "Oy kaydedilirken hata oluştu" }
        }
    }

    revalidatePath("/surveys")
    revalidatePath(`/surveys/${categoryId}`)
    if (votedForId) {
        revalidatePath(`/profile/${votedForId}`)
    }

    return { success: true }
}

export async function addCustomOption(categoryId: string, optionText: string) {
    const supabase = await createClient()

    // Kategori kontrolü
    const { data: category } = await supabase
        .from("survey_categories")
        .select("id")
        .eq("id", categoryId)
        .eq("is_active", true)
        .single()

    if (!category) {
        return { error: "Geçersiz veya pasif kategori" }
    }

    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    // Kullanıcı profili
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("class")
        .eq("id", user.id)
        .single()

    if (!userProfile) {
        return { error: "Kullanıcı profili bulunamadı" }
    }

    // Text validation
    const cleanText = optionText.trim()
    if (cleanText.length < 3) {
        return { error: "Seçenek en az 3 karakter olmalı" }
    }
    if (cleanText.length > 100) {
        return { error: "Seçenek en fazla 100 karakter olabilir" }
    }

    // Aynı seçenek zaten var mı kontrol et
    const { data: existing } = await supabase
        .from("survey_custom_options")
        .select("id")
        .eq("category_id", categoryId)
        .eq("class", userProfile.class)
        .ilike("option_text", cleanText)
        .single()

    if (existing) {
        return { error: "Bu seçenek zaten mevcut" }
    }

    // Seçeneği ekle
    const { data: newOption, error } = await supabase
        .from("survey_custom_options")
        .insert({
            category_id: categoryId,
            option_text: cleanText,
            created_by: user.id,
            class: userProfile.class
        })
        .select(`
            id,
            category_id,
            option_text,
            created_by,
            class,
            vote_count,
            created_at,
            creator:created_by (
                first_name,
                last_name
            )
        `)
        .single()

    if (error) {
        console.error("Custom option insert error:", error)
        return { error: "Seçenek eklenirken hata oluştu" }
    }

    revalidatePath(`/surveys/${categoryId}`)

    return { success: true, option: newOption }
}
