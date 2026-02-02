"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const profileSchema = z.object({
    firstName: z.string().trim().min(1, "Ad gerekli"),
    lastName: z.string().trim().min(1, "Soyad gerekli"),
    schoolNumber: z.string().trim().min(1, "Okul numarası gerekli"),
    classRoom: z.string().trim().min(1, "Sınıf gerekli"),
})

export async function completeProfile(formData: {
    firstName: string
    lastName: string
    schoolNumber: string
    classRoom: string
}) {
    const parsed = profileSchema.safeParse(formData)
    if (!parsed.success) {
        return { error: parsed.error.errors[0].message }
    }

    const supabase = await createClient()

    // getUser burada şart değil; RPC zaten auth.uid() kontrol ediyor.
    // ama “oturum yok” mesajını erken vermek istiyorsan kalsın:
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
        return { error: "Oturum bulunamadı" }
    }

    const { data, error: rpcError } = await supabase.rpc("complete_profile", {
        p_first_name: parsed.data.firstName,
        p_last_name: parsed.data.lastName,
        p_school_number: parsed.data.schoolNumber,
        p_class_room: parsed.data.classRoom,
    })

    // Burada iki ayrı şey var:
    // 1) rpcError: fonksiyona erişim yok / beklenmeyen DB hatası / network
    if (rpcError) {
        console.error("RPC Error:", rpcError)

        // Eğer DB’den “hatalı giriş” exception mesajı geliyorsa burada ayrıştırıp gösterebilirsin.
        // Şimdilik güvenli varsayılan:
        return { error: "İşlem sırasında hata oluştu." }
    }

    // 2) Fonksiyon düzgün çalıştı ama iş mantığı gereği reddetti
    if (data?.success === false) {
        return { error: data.error ?? "Geçersiz işlem" }
    }

    revalidatePath("/home")
    return { success: true }
}
