"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
interface CategoryFormData {
    id: string
    title: string
    emoji: string
    description: string
    color: string
    sort_order: number
}

// Sıra numaralarını yeniden düzenle (boşlukları kapat)
async function reorderCategories(supabase: any) {
    const { data: categories } = await supabase
        .from("survey_categories")
        .select("id, sort_order")
        .order("sort_order", { ascending: true })

    if (!categories || categories.length === 0) return

    // Sıra numaralarını 1'den başlayarak yeniden ata
    for (let i = 0; i < categories.length; i++) {
        const newOrder = i + 1
        if (categories[i].sort_order !== newOrder) {
            await supabase
                .from("survey_categories")
                .update({ sort_order: newOrder })
                .eq("id", categories[i].id)
        }
    }
}

// Belirli bir sıra numarasından itibaren kaydır
async function shiftCategoriesFrom(supabase: any, fromOrder: number, excludeId?: string) {
    // fromOrder ve üzerindeki tüm kategorileri al
    let query = supabase
        .from("survey_categories")
        .select("id, sort_order")
        .gte("sort_order", fromOrder)
        .order("sort_order", { ascending: false }) // Sondan başlayarak kaydır (çakışma önleme)

    if (excludeId) {
        query = query.neq("id", excludeId)
    }

    const { data: categories } = await query

    if (!categories || categories.length === 0) return

    // Her birini 1 artır
    for (const cat of categories) {
        await supabase
            .from("survey_categories")
            .update({ sort_order: cat.sort_order + 1 })
            .eq("id", cat.id)
    }
}

export async function addCategory(data: CategoryFormData) {
    // Merkezi admin kontrolü
    const auth = await checkAdmin()
    if (!auth.success) return { error: auth.error }

    const supabase = await createClient()

    // Validation
    if (!data.id || !/^[a-z_]+$/.test(data.id)) {
        return { error: "Geçersiz ID formatı" }
    }
    if (!data.title || data.title.length < 2) {
        return { error: "Başlık en az 2 karakter olmalı" }
    }
    if (!data.emoji) {
        return { error: "Emoji zorunludur" }
    }
    if (!data.description || data.description.length < 5) {
        return { error: "Açıklama en az 5 karakter olmalı" }
    }

    // Aynı ID var mı?
    const { data: existing } = await supabase
        .from("survey_categories")
        .select("id")
        .eq("id", data.id)
        .single()

    if (existing) {
        return { error: "Bu ID zaten kullanılıyor" }
    }

    // Aynı sıra numarası var mı? Varsa kaydır
    const { data: sameOrder } = await supabase
        .from("survey_categories")
        .select("id")
        .eq("sort_order", data.sort_order)
        .single()

    if (sameOrder) {
        await shiftCategoriesFrom(supabase, data.sort_order)
    }

    // Ekle
    const { error } = await supabase
        .from("survey_categories")
        .insert({
            id: data.id,
            title: data.title,
            emoji: data.emoji,
            description: data.description,
            color: data.color,
            sort_order: data.sort_order || 0,
            is_active: true,
            is_user_suggested: true,
            suggested_by: auth.user.id
        })
        .select()
        .single()

    if (error) {
        console.error("Add category error:", error)
        return { error: "Kategori eklenirken hata oluştu: " + error.message }
    }

    // Admin tarafından eklendiği için otomatik olarak onaylanmış öneri kaydı oluştur
    if (data) {
        const { error: suggestionError } = await supabase
            .from("user_category_suggestions")
            .insert({
                title: data.title,
                emoji: data.emoji,
                description: data.description,
                color: data.color,
                status: 'approved',
                suggested_by: auth.user.id,
                reviewed_by: auth.user.id,
                reviewed_at: new Date().toISOString(),
                approved_category_id: data.id,
                admin_note: 'Admin tarafından doğrudan eklendi'
            })

        if (suggestionError) {
            console.error("Auto suggestion create error:", suggestionError)
        }
    }

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true }
}

export async function toggleCategoryStatus(categoryId: string, newStatus: boolean) {
    // Merkezi admin kontrolü
    const auth = await checkAdmin()
    if (!auth.success) return { error: auth.error }

    const supabase = await createClient()

    const { error } = await supabase
        .from("survey_categories")
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq("id", categoryId)

    if (error) {
        console.error("Toggle status error:", error)
        return { error: "Durum güncellenirken hata oluştu" }
    }

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true }
}

export async function deleteCategory(categoryId: string) {
    // Merkezi admin kontrolü
    const auth = await checkAdmin()
    if (!auth.success) return { error: auth.error }

    const supabase = await createClient()

    // Kategoriye ait oy var mı kontrol et
    const { data: votes } = await supabase
        .from("survey_votes")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1)

    if (votes && votes.length > 0) {
        return { error: "Bu kategoride oylar var, önce oyları silmeniz gerekiyor veya kategoriyi pasife alın" }
    }

    // Fix FK constraint issue manually
    const { error: updateError } = await supabase
        .from("user_category_suggestions")
        .update({ approved_category_id: null })
        .eq("approved_category_id", categoryId)

    if (updateError) {
        console.error("Update related suggestions error:", updateError)
    }

    const { error } = await supabase
        .from("survey_categories")
        .delete()
        .eq("id", categoryId)

    if (error) {
        console.error("Delete category error:", error)
        return { error: "Kategori silinirken hata oluştu" }
    }

    await reorderCategories(supabase)

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true }
}

export async function updateCategory(categoryId: string, data: Partial<CategoryFormData>) {
    // Merkezi admin kontrolü
    const auth = await checkAdmin()
    if (!auth.success) return { error: auth.error }

    const supabase = await createClient()

    // Eğer sıra numarası değişiyorsa, çakışma kontrolü yap
    if (data.sort_order !== undefined) {
        const { data: currentCategory } = await supabase
            .from("survey_categories")
            .select("sort_order")
            .eq("id", categoryId)
            .single()

        if (currentCategory && currentCategory.sort_order !== data.sort_order) {
            const { data: sameOrder } = await supabase
                .from("survey_categories")
                .select("id")
                .eq("sort_order", data.sort_order)
                .neq("id", categoryId)
                .single()

            if (sameOrder) {
                await shiftCategoriesFrom(supabase, data.sort_order, categoryId)
            }
        }
    }

    const { error } = await supabase
        .from("survey_categories")
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq("id", categoryId)

    if (error) {
        console.error("Update category error:", error)
        return { error: "Kategori güncellenirken hata oluştu" }
    }

    await reorderCategories(supabase)

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true }
}

export async function deleteVotesForCategory(categoryId: string) {
    // Merkezi admin kontrolü (UI / API güvenliği için)
    const auth = await checkAdmin()
    const adminClient = await createAdminClient()
    if (!auth.success) return { error: auth.error }

    // Önce kaç oy var al (admin client → RLS yok)
    const { count, error: countError } = await adminClient
        .from("survey_votes")
        .select("id", { count: "exact", head: true })
        .eq("category_id", categoryId)

    if (countError) {
        return { error: "Oy sayısı alınamadı: " + countError.message }
    }

    // Oyları sil
    const { error: deleteError } = await adminClient
        .from("survey_votes")
        .delete()
        .eq("category_id", categoryId)

    if (deleteError) {
        return { error: "Oylar silinirken hata oluştu: " + deleteError.message }
    }

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")
    revalidatePath(`/surveys/${categoryId}`)

    return {
        success: true,
        deletedCount: count ?? 0,
    }
}

export async function getVoteCountForCategory(categoryId: string) {
    const supabase = await createClient()

    const { count } = await supabase
        .from("survey_votes")
        .select("id", { count: 'exact', head: true })
        .eq("category_id", categoryId)

    return count || 0
}
