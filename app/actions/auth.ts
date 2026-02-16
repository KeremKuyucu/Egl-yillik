"use server"

import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"
import jwt from "jsonwebtoken"

const resend = new Resend(process.env.RESEND_API_KEY)

function getOrigin() {
    const origin = process.env.NEXT_PUBLIC_APP_URL
    if (!origin) throw new Error("NEXT_PUBLIC_APP_URL missing")
    return origin
}

function getSecret() {
    const secret = process.env.DELETE_TOKEN_SECRET
    if (!secret) throw new Error("DELETE_TOKEN_SECRET missing")
    return secret
}

export async function requestDeleteAccount() {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { error: "Oturum geçersiz." }
    if (!user.email) return { error: "Email bulunamadı." }

    try {
        const token = jwt.sign(
            { sub: user.id, scope: "delete_account" },
            getSecret(),
            { expiresIn: "15m" }
        )

        const verificationUrl =
            `${getOrigin()}/verify-delete?token=${globalThis.encodeURIComponent(token)}`

        await resend.emails.send({
            from: "EGL Yıllık <egl@keremkk.com.tr>",
            to: user.email,
            subject: "Hesap Silme Onayı",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hesap Silme İsteği</h2>
          <p>Hesabınızı silmek için bir istek aldık. Bu işlemi onaylamak için aşağıdaki butona tıklayın:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Hesabımı Kalıcı Olarak Sil
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Bu işlemi siz talep etmediyseniz, bu e-postayı görmezden gelebilirsiniz.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Bu bağlantı 15 dakika boyunca geçerlidir.</p>
        </div>
      `,
        })

        return { success: true, message: "Onay e-postası gönderildi." }
    } catch (error: any) {
        console.error("Delete request error:", error)
        return { error: "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin." }
    }
}

export async function deleteAccount(token: string) {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) return { error: "Lütfen güvenliğiniz için tekrar giriş yapın." }

    try {
        const decoded = jwt.verify(token, getSecret()) as any

        if (decoded.scope !== "delete_account") return { error: "Geçersiz bağlantı." }
        if (decoded.sub !== user.id) return { error: "Bu bağlantı bu hesap için değil." }

        const { error: rpcError } = await supabase.rpc("delete_own_account")
        if (rpcError) return { error: rpcError.message || "Hesap silinemedi." }

        try { await supabase.auth.signOut() } catch { }
        return { success: true }
    } catch {
        return { error: "Bağlantı geçersiz veya süresi dolmuş." }
    }
}

export async function getDeleteAccountPreview(token: string) {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) return { error: "Lütfen güvenliğiniz için tekrar giriş yapın." }

    try {
        const decoded = jwt.verify(token, getSecret()) as any

        if (decoded.scope !== "delete_account") return { error: "Geçersiz bağlantı." }
        if (decoded.sub !== user.id) return { error: "Bu bağlantı bu hesap için değil." }

        // İstersen auth user'dan da gösterebilirsin:
        const email = user.email ?? null

        // Profil bilgisi
        const { data: profile, error: pErr } = await supabase
            .from("profiles")
            .select("first_name,last_name,school_number,class,user_year")
            .eq("id", user.id)
            .maybeSingle()

        if (pErr) return { error: "Profil bilgisi alınamadı." }

        return {
            success: true as const,
            account: {
                id: user.id,
                email,
                profile: profile ?? null,
            },
        }
    } catch {
        return { error: "Bağlantı geçersiz veya süresi dolmuş." }
    }
}
