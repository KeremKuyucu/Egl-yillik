"use server"

import jwt from "jsonwebtoken"
import { createAdminClient } from "@/lib/supabase/admin"

const UNSUB_SECRET = process.env.UNSUB_SECRET!

type UnsubTokenPayload = {
    uid: string
    scope: "email_unsubscribe"
    // exp zaten jwt standardında var
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

    const admin = createAdminClient()

    const { error } = await admin
        .from("email_opt_outs")
        .upsert({ user_id: payload.uid }, { onConflict: "user_id" })

    if (error) {
        return { ok: false as const, reason: "DB_ERROR" as const }
    }

    return { ok: true as const }
}
