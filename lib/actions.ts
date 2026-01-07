// lib/actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ROLES } from "@/lib/constants"

interface UpdateUserProfileData {
    first_name: string
    last_name: string
    school_number: string
    class: string
}

export async function updateUserLevel(userId: string, newLevel: number) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: "Oturum bulunamadı" }
        }

        // İşlemi yapan adminin seviyesini al
        const { data: currentUserProfile } = await supabase
            .from("profiles")
            .select("level")
            .eq("id", user.id)
            .single()

        const currentUserLevel = currentUserProfile?.level ?? 0

        // Sadece Süper Adminler yetki değiştirebilir (İsteğe bağlı kural)
        if (currentUserLevel < ROLES.SUPER_ADMIN) {
            return { success: false, error: "Bu işlem için yetkiniz yok" }
        }

        // Hedef kullanıcının seviyesini al
        const { data: targetUserProfile } = await supabase
            .from("profiles")
            .select("level")
            .eq("id", userId)
            .single()

        const targetUserLevel = targetUserProfile?.level ?? 0

        // Kural: Kendinden yüksek veya eşit rütbedekileri değiştiremezsin
        if (targetUserLevel >= currentUserLevel) {
            return {
                success: false,
                error: "Sizinle aynı veya daha yüksek seviyede olan kullanıcıların seviyesini değiştiremezsiniz"
            }
        }

        // Kural: Kimseyi kendi seviyene veya üstüne çıkaramazsın
        if (newLevel >= currentUserLevel) {
            return {
                success: false,
                error: "Kullanıcıyı sizinle aynı veya daha yüksek seviyeye atayamazsınız"
            }
        }

        // Kural: Kendini değiştiremezsin
        if (userId === user.id) {
            return { success: false, error: "Kendi seviyenizi değiştiremezsiniz" }
        }

        // Güncelleme işlemi
        const { error } = await supabase
            .from("profiles")
            .update({ level: newLevel })
            .eq("id", userId)

        if (error) {
            console.error("Level güncelleme hatası:", error)
            return { success: false, error: "Seviye güncellenirken bir hata oluştu" }
        }

        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Beklenmeyen hata:", error)
        return { success: false, error: "Beklenmeyen bir hata oluştu" }
    }
}

export async function updateUserProfile(
    userId: string,
    data: UpdateUserProfileData
) {
    try {
        const supabase = await createClient()

        // Mevcut kullanıcıyı kontrol et
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!currentUser) {
            return { success: false, error: "Yetkisiz erişim" }
        }

        // Mevcut kullanıcının seviyesini al
        const { data: currentProfile } = await supabase
            .from("profiles")
            .select("level")
            .eq("id", currentUser.id)
            .single()

        const currentUserLevel = currentProfile?.level ?? 0

        // Moderatör yetkisi kontrolü
        if (currentUserLevel < ROLES.MODERATOR) {
            return { success: false, error: "Bu işlem için yetkiniz yok" }
        }

        // Düzenlenecek kullanıcının seviyesini kontrol et
        const { data: targetUser } = await supabase
            .from("profiles")
            .select("level")
            .eq("id", userId)
            .single()

        if (!targetUser) {
            return { success: false, error: "Kullanıcı bulunamadı" }
        }

        // Kendinden düşük seviyedeki kullanıcıları düzenleyebilir
        if (currentUserLevel <= (targetUser.level ?? 0)) {
            return { success: false, error: "Bu kullanıcıyı düzenleme yetkiniz yok" }
        }

        // Kendi profilini düzenleyemez
        if (userId === currentUser.id) {
            return { success: false, error: "Kendi profilinizi düzenleyemezsiniz" }
        }

        // Profili güncelle
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                first_name: data.first_name,
                last_name: data.last_name,
                school_number: data.school_number,
                class: data.class,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

        if (updateError) {
            console.error("Profil güncelleme hatası:", updateError)
            return { success: false, error: "Profil güncellenirken bir hata oluştu" }
        }

        // Sayfayı yenile
        revalidatePath("/admin/users")

        return { success: true }
    } catch (error) {
        console.error("Server action hatası:", error)
        return { success: false, error: "Sunucu hatası" }
    }
}