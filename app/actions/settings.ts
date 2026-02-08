"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateSiteSetting(key: string, value: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from("site_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)

    if (error) {
        console.error(`Error updating setting ${key}:`, error)
        return { error: error.message }
    }

    revalidatePath("/admin/reminders")
    return { success: true }
}
