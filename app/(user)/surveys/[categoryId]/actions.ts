"use server"

import { createClient } from "@/lib/supabase/server"
import { getAuthContext } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { isVotingEnabled } from "@/lib/settings"

export async function submitSurveyVote(
    categoryId: string,
    votedForId: string
) {
    const supabase = await createClient()

    // Oylama açık mı kontrol et
    const votingEnabled = await isVotingEnabled()
    if (!votingEnabled) {
        return { error: "Oylama şu anda kapalıdır. Lütfen daha sonra tekrar deneyin." }
    }

    if (!votedForId) {
        return { error: "Bir seçim yapmanız gerekiyor" }
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

    // JWT'den kullanıcı ve profil bilgilerini al
    const { user, profile: userProfile } = await getAuthContext()

    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    if (!userProfile) {
        return { error: "Kullanıcı profili bulunamadı" }
    }

    // Oy verilecek kişi kontrolü
    // Kendine oy veremez
    if (user.id === votedForId) {
        return { error: "Kendinize oy veremezsiniz" }
    }

    // Oy verilecek kişi gerçekten var mı ve aynı sınıfta mı?
    // Oy verilecek kişi gerçekten var mı ve aynı sınıfta mı?
    const { data: votedFor } = await supabase
        .from("profiles")
        .select("id, class, user_year")
        .eq("id", votedForId)
        .single()

    if (!votedFor) {
        return { error: "Seçilen kişi bulunamadı" }
    }

    if (votedFor.class !== userProfile.class) {
        return { error: "Sadece kendi sınıfınızdan birine oy verebilirsiniz" }
    }

    if (votedFor.user_year !== userProfile.user_year) {
        return { error: "Sadece kendi döneminizden birine oy verebilirsiniz" }
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
                category_id: categoryId
            })

        if (error) {
            console.error("Vote insert error:", error)
            return { error: "Oy kaydedilirken hata oluştu" }
        }
    }

    revalidatePath("/surveys")
    revalidatePath(`/surveys/${categoryId}`)
    return { success: true }
}
