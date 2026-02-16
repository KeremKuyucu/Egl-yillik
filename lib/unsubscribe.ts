"use server"

import jwt from "jsonwebtoken"
import { createClient } from "@/lib/supabase/server"

const UNSUB_SECRET = process.env.UNSUB_SECRET!

type UnsubTokenPayload = {
    uid: string
    scope: "email_unsubscribe"
}

export async function unsubscribeWithToken(token: string) {
    let payload: UnsubTokenPayload

    try {
        payload = jwt.verify(token, UNSUB_SECRET) as UnsubTokenPayload
    } catch {
        return { ok: false as const, reason: "INVALID_OR_EXPIRED" as const }
    }

    if (!payload?.uid || payload.scope !== "email_unsubscribe") {
        return { ok: false as const, reason: "INVALID_TOKEN" as const }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from("email_opt_outs")
        .upsert({ user_id: payload.uid }, { onConflict: "user_id" })

    if (error) {
        return { ok: false as const, reason: "DB_ERROR" as const }
    }

    return { ok: true as const }
}