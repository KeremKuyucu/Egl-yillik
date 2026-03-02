"use server"

import { createClient } from "@/lib/supabase/server"

export async function deleteAccountPassword() {
    const supabase = await createClient()

    const { error: rpcError } = await supabase.rpc("delete_own_account")
    if (rpcError) return { error: rpcError.message || "Hesap silinemedi." }

    try { await supabase.auth.signOut() } catch { }
    return { success: true as const }
}
