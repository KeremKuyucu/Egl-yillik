"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { SURVEY_CATEGORIES } from "@/lib/survey-categories"

export async function submitSurveyVote(categoryId: string, votedForId: string) {
    const supabase = await createClient()

    // Kategori kontrolü
    const validCategory = SURVEY_CATEGORIES.find(c => c.id === categoryId)
    if (!validCategory) {
        return { error: "Geçersiz kategori" }
    }

    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    // Kendine oy veremez
    if (user.id === votedForId) {
        return { error: "Kendinize oy veremezsiniz" }
    }

    // Oy verilecek kişi gerçekten var mı?
    const { data: votedFor } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", votedForId)
        .single()

    if (!votedFor) {
        return { error: "Seçilen kişi bulunamadı" }
    }

    // Daha önce bu kategoride oy verilmiş mi?
    const { data: existingVote } = await supabase
        .from("survey_votes")
        .select("id")
        .eq("voter_id", user.id)
        .eq("category_id", categoryId)
        .single()

    if (existingVote) {
        // Oy güncelle (upsert)
        const { error } = await supabase
            .from("survey_votes")
            .update({ voted_for_id: votedForId, updated_at: new Date().toISOString() })
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
                category_id: categoryId
            })

        if (error) {
            console.error("Vote insert error:", error)
            return { error: "Oy kaydedilirken hata oluştu" }
        }
    }

    revalidatePath("/surveys")
    revalidatePath(`/surveys/${categoryId}`)
    revalidatePath(`/profile/${votedForId}`)

    return { success: true }
}
