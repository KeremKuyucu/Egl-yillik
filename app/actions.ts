"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ROLES } from "@/lib/constants"

export async function deleteTextAction(id: string) {
    const supabase = await createClient()

    // Önce yetki kontrolü (Ekstra güvenlik)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data: profile } = await supabase.from("profiles").select("level").eq("id", user.id).single()
    if (!profile || profile.level < ROLES.ADMIN) return { error: "Forbidden" }

    const { error } = await supabase.from("texts").delete().eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: true }
}