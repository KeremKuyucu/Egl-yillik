"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkSuperAdmin } from "@/lib/auth"

export async function getSystemClasses(): Promise<{ name: string; id: string }[]> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'valid_classes')
            .single()

        if (error || !data) return []

        return data.value.split(',').map((cls: string) => ({
            name: cls.trim(),
            id: cls.trim()
        }))
    } catch {
        return []
    }
}

export async function updateSiteSetting(key: string, value: string) {
    const auth = await checkSuperAdmin()
    if (!auth.success) return { error: auth.error }

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

export async function getReminderSettings() {
    const auth = await checkSuperAdmin()
    if (!auth.success) return { error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["reminder_auto_enabled", "reminder_auto_interval", "reminder_last_run"])

    if (error) {
        console.error("Error fetching reminder settings:", error)
        return { error: error.message }
    }

    const settings = {
        enabled: data.find(s => s.key === "reminder_auto_enabled")?.value === "true",
        interval: parseInt(data.find(s => s.key === "reminder_auto_interval")?.value || "3"),
        lastRun: data.find(s => s.key === "reminder_last_run")?.value || null
    }

    return { success: true, settings }
}
