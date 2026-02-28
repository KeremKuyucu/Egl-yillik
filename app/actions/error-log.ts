"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function logClientError(data: {
    message: string
    digest?: string
    stack?: string
    source: "global" | "user" | "admin"
    url?: string
    user_agent?: string
}) {
    try {
        const supabase = createAdminClient()

        await supabase.from("error_logs").insert({
            message: data.message.slice(0, 2000),
            digest: data.digest?.slice(0, 100) ?? null,
            stack: data.stack?.slice(0, 5000) ?? null,
            source: data.source,
            url: data.url?.slice(0, 500) ?? null,
            user_agent: data.user_agent?.slice(0, 500) ?? null,
        })
    } catch {
        // Loglama başarısız olsa bile sessizce geç
    }
}
