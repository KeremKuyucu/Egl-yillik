"use server"

import { createClient } from "@/lib/supabase/server"

export async function deleteAccountWithPassword(password: string) {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { error: "Oturum geçersiz." }
    if (!user.email) return { error: "Email bulunamadı." }

    if (!password || password.length < 6) {
        return { error: "Şifre geçersiz." }
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
    })

    if (signInErr) {
        return { error: "Şifre yanlış." }
    }

    // Soft delete RPC
    const { error: rpcError } = await supabase.rpc("delete_own_account")
    if (rpcError) return { error: rpcError.message || "Hesap silinemedi." }

    try { await supabase.auth.signOut() } catch { }
    return { success: true as const }
}
