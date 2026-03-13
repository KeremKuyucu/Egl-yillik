"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth/data"
import { hasPermission } from "@/lib/auth/permissions"
import { isGalleryEnabled, getSystemClosedMessage } from "@/lib/settings"

const BUCKET_NAME = "gallery"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/webp", "image/jpeg", "image/png"]
const MAX_PHOTOS_PER_USER = 20

export async function uploadPhotoAction(formData: FormData) {
    const galleryEnabled = await isGalleryEnabled()
    if (!galleryEnabled) {
        return { error: await getSystemClosedMessage('gallery') }
    }

    const user = await getCurrentUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    const file = formData.get("file") as File | null
    const caption = (formData.get("caption") as string)?.trim() || null

    if (!file) return { error: "Dosya seçilmedi" }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { error: "Sadece WebP, JPEG ve PNG formatları desteklenir" }
    }
    if (file.size > MAX_FILE_SIZE) {
        return { error: "Dosya boyutu 5MB'ı geçemez" }
    }

    const supabase = createAdminClient()

    // Kullanıcının fotoğraf limitini kontrol et
    const { data: userPhotos, error: fetchError } = await supabase
        .from("gallery_photos")
        .select("file_size")
        .eq("user_id", user.id)

    if (fetchError) {
        console.error("Fetch sizes error:", fetchError)
        return { error: "Fotoğraf limitleri kontrol edilirken bir hata oluştu" }
    }

    const currentCount = userPhotos ? userPhotos.length : 0;
    if (currentCount >= MAX_PHOTOS_PER_USER) {
        return { error: `En fazla ${MAX_PHOTOS_PER_USER} fotoğraf yükleyebilirsiniz` }
    }

    const currentTotalSize = userPhotos ? userPhotos.reduce((acc, curr) => acc + (curr.file_size || 0), 0) : 0;
    if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
        return { error: "Toplam fotoğraf boyutunuz 10MB'ı geçemez. Lütfen eski fotoğraflarınızdan bazılarını silin veya daha küçük boyutlu bir fotoğraf yükleyin." }
    }

    // Benzersiz dosya adı oluştur
    const ext = file.name.split(".").pop() || "webp"
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Supabase Storage'a yükle (admin client — policy gerekmez)
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
        })

    if (uploadError) {
        console.error("Upload error:", uploadError)
        return { error: "Fotoğraf yüklenirken bir hata oluştu" }
    }

    // DB'ye kaydet (admin client — RLS bypass)
    const { error: dbError } = await supabase.from("gallery_photos").insert({
        user_id: user.id,
        storage_path: fileName,
        file_name: file.name,
        file_size: file.size,
        caption: caption,
    })

    if (dbError) {
        // DB hatası varsa storage'dan sil
        await supabase.storage.from(BUCKET_NAME).remove([fileName])
        console.error("DB error:", dbError)
        return { error: "Fotoğraf kaydedilirken bir hata oluştu" }
    }

    revalidatePath("/gallery")
    return { success: true }
}

export async function deletePhotoAction(photoId: string) {
    const galleryEnabled = await isGalleryEnabled()
    if (!galleryEnabled) {
        return { error: await getSystemClosedMessage('gallery') }
    }

    const user = await getCurrentUser()
    if (!user) return { error: "Oturum açmanız gerekiyor" }

    const supabase = createAdminClient()

    // Fotoğrafı bul
    const { data: photo, error: fetchError } = await supabase
        .from("gallery_photos")
        .select("id, user_id, storage_path")
        .eq("id", photoId)
        .single()

    if (fetchError || !photo) return { error: "Fotoğraf bulunamadı" }

    // Yetki kontrolü: kendi fotoğrafı veya admin izni
    if (photo.user_id !== user.id) {
        const adminCheck = await hasPermission("admin.gallery.delete")
        if (!adminCheck.ok) {
            return { error: "Bu fotoğrafı silme yetkiniz yok" }
        }
    }

    // Storage'dan sil (admin client — policy gerekmez)
    const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([photo.storage_path])

    if (storageError) {
        console.error("Storage delete error:", storageError)
    }

    // DB'den sil (admin client — RLS bypass)
    const { error: dbError } = await supabase
        .from("gallery_photos")
        .delete()
        .eq("id", photoId)

    if (dbError) {
        console.error("DB delete error:", dbError)
        return { error: "Fotoğraf silinirken bir hata oluştu" }
    }

    revalidatePath("/gallery")
    revalidatePath("/admin/gallery")
    return { success: true }
}
