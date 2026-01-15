"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

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
    const supabase = await createClient()

    // Admin kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    if (!profile || profile.level < 50) {
        return { error: "Bu işlem için yetkiniz yok" }
    }

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
            is_active: true
        })

    if (error) {
        console.error("Add category error:", error)
        return { error: "Kategori eklenirken hata oluştu: " + error.message }
    }

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true }
}

export async function toggleCategoryStatus(categoryId: string, newStatus: boolean) {
    const supabase = await createClient()

    // Admin kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    if (!profile || profile.level < 50) {
        return { error: "Bu işlem için yetkiniz yok" }
    }

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
    const supabase = await createClient()

    // Admin kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    if (!profile || profile.level < 50) {
        return { error: "Bu işlem için yetkiniz yok" }
    }

    // Kategoriye ait oy var mı kontrol et
    const { data: votes } = await supabase
        .from("survey_votes")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1)

    if (votes && votes.length > 0) {
        return { error: "Bu kategoride oylar var, önce oyları silmeniz gerekiyor veya kategoriyi pasife alın" }
    }

    // Kategoriye ait özel seçenekler var mı?
    const { data: customOptions } = await supabase
        .from("survey_custom_options")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1)

    if (customOptions && customOptions.length > 0) {
        return { error: "Bu kategoride özel seçenekler var, önce onları silmeniz gerekiyor veya kategoriyi pasife alın" }
    }

    const { error } = await supabase
        .from("survey_categories")
        .delete()
        .eq("id", categoryId)

    if (error) {
        console.error("Delete category error:", error)
        return { error: "Kategori silinirken hata oluştu" }
    }

    // Sıra numaralarını yeniden düzenle
    await reorderCategories(supabase)

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true }
}

export async function updateCategory(categoryId: string, data: Partial<CategoryFormData>) {
    const supabase = await createClient()

    // Admin kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    if (!profile || profile.level < 50) {
        return { error: "Bu işlem için yetkiniz yok" }
    }

    // Eğer sıra numarası değişiyorsa, çakışma kontrolü yap
    if (data.sort_order !== undefined) {
        const { data: currentCategory } = await supabase
            .from("survey_categories")
            .select("sort_order")
            .eq("id", categoryId)
            .single()

        if (currentCategory && currentCategory.sort_order !== data.sort_order) {
            // Yeni sıra numarasında başka kategori var mı?
            const { data: sameOrder } = await supabase
                .from("survey_categories")
                .select("id")
                .eq("sort_order", data.sort_order)
                .neq("id", categoryId)
                .single()

            if (sameOrder) {
                // Varsa, o sıradan itibaren kaydır
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

    // Sıra numaralarını yeniden düzenle (boşluk varsa kapat)
    await reorderCategories(supabase)

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")

    return { success: true }
}

export async function deleteVotesForCategory(categoryId: string) {
    const supabase = await createClient()

    // Admin kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    if (!profile || profile.level < 50) {
        return { error: "Bu işlem için yetkiniz yok" }
    }

    // Admin client kullan (RLS bypass)
    const adminClient = createAdminClient()

    // Kategoriye ait oy sayısını al
    const { count } = await adminClient
        .from("survey_votes")
        .select("id", { count: 'exact', head: true })
        .eq("category_id", categoryId)

    // Oyları sil - Admin client ile RLS bypass
    const { error, data } = await adminClient
        .from("survey_votes")
        .delete()
        .eq("category_id", categoryId)
        .select()

    if (error) {
        console.error("Delete votes error:", error)
        return { error: "Oylar silinirken hata oluştu: " + error.message }
    }

    const deletedCount = data?.length || count || 0

    revalidatePath("/admin/categories")
    revalidatePath("/surveys")
    revalidatePath(`/surveys/${categoryId}`)

    return { success: true, deletedCount }
}

export async function getVoteCountForCategory(categoryId: string) {
    const supabase = await createClient()

    const { count } = await supabase
        .from("survey_votes")
        .select("id", { count: 'exact', head: true })
        .eq("category_id", categoryId)

    return count || 0
}
