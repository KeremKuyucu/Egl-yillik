"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAdmin, checkAdminSuggestionsUpdate } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/data"

interface ApproveData {
    suggestionId: string
    title: string
    emoji: string
    description: string
    color: string
    adminNote?: string
}

export async function approveSuggestion(data: ApproveData) {
    // Merkezi admin kontrolü
    const user = await getCurrentUser()
    if (!user) return { error: "Oturum bulunamadı" }

    const supabase = await createClient()

    // Öneriyi al
    const { data: suggestion } = await supabase
        .from("user_category_suggestions")
        .select("*")
        .eq("id", data.suggestionId)
        .single()

    if (!suggestion) {
        return { error: "Öneri bulunamadı" }
    }

    if (suggestion.status !== "pending") {
        return { error: "Bu öneri zaten işlenmiş" }
    }

    // Kategori ID'si oluştur (title'dan)
    const categoryId = data.title
        .toLowerCase()
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ş/g, 's')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')

    // En yüksek sort_order'ı bul
    const { data: maxOrder } = await supabase
        .from("survey_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .single()

    const nextSortOrder = (maxOrder?.sort_order || 0) + 1

    // Aynı ID'li kategori var mı kontrol et
    const { data: existingCategory } = await supabase
        .from("survey_categories")
        .select("id")
        .eq("id", categoryId)
        .single()

    const finalCategoryId = existingCategory
        ? `${categoryId}_${Date.now()}`
        : categoryId

    // Kategoriyi oluştur
    const { error: categoryError } = await supabase
        .from("survey_categories")
        .insert({
            id: finalCategoryId,
            title: data.title,
            emoji: data.emoji,
            description: data.description,
            color: data.color,
            sort_order: nextSortOrder,
            is_active: true,
            is_user_suggested: true,
            suggested_by: suggestion.suggested_by
        })

    if (categoryError) {
        console.error("Create category error:", categoryError)
        return { error: "Kategori oluşturulurken hata oluştu: " + categoryError.message }
    }

    // Öneriyi güncelle
    const { error: updateError } = await supabase
        .from("user_category_suggestions")
        .update({
            status: "approved",
            admin_note: data.adminNote || null,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            approved_category_id: finalCategoryId
        })
        .eq("id", data.suggestionId)

    if (updateError) {
        console.error("Update suggestion error:", updateError)
        return { error: "Öneri güncellenirken hata oluştu" }
    }

    revalidatePath("/admin/suggestions")
    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true, categoryId: finalCategoryId }
}

export async function rejectSuggestion(suggestionId: string, adminNote: string = "") {
    // Merkezi admin kontrolü
    const user = await getCurrentUser()
    if (!user) return { error: "Oturum bulunamadı" }

    const supabase = await createClient()

    const { error } = await supabase
        .from("user_category_suggestions")
        .update({
            status: "rejected",
            admin_note: adminNote || null,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
        })
        .eq("id", suggestionId)

    if (error) {
        console.error("Reject suggestion error:", error)
        return { error: "Öneri reddedilirken hata oluştu" }
    }

    revalidatePath("/admin/suggestions")

    return { success: true }
}

export async function deleteSuggestion(suggestionId: string) {
    // Merkezi admin kontrolü
    const user = await getCurrentUser()
    if (!user) return { error: "Oturum bulunamadı" }

    const supabase = await createClient()

    const { error } = await supabase
        .from("user_category_suggestions")
        .delete()
        .eq("id", suggestionId)

    if (error) {
        console.error("Delete suggestion error:", error)
        return { error: "Öneri silinirken hata oluştu" }
    }

    revalidatePath("/admin/suggestions")

    return { success: true }
}
