import { Metadata } from "next"
import AdminTextsClient from "./client"
import { createClient } from "@/lib/supabase/server"
import { getCurrentPermissions } from "@/lib/auth/permissions"
import { PERMS } from "@/lib/auth/permission-constants"

export const metadata: Metadata = {
    title: "Yazılar | Admin",
    robots: {
        index: false,
        follow: false,
    },
}

export default async function AdminTextsPage() {
    const supabase = await createClient()

    const [textsRes, anonRes, permissions] = await Promise.all([
        supabase.rpc('get_admin_texts'),
        supabase.rpc('get_admin_anonymous_texts'),
        getCurrentPermissions()
    ])

    const texts = textsRes.data || []
    const anonymousTexts = anonRes.data || []
    const canReadContent = permissions.includes(PERMS.ADMIN_TEXTS_READ)

    return (
        <AdminTextsClient
            initialTexts={texts}
            initialAnonymousTexts={anonymousTexts}
            canReadContent={canReadContent}
        />
    )
}
