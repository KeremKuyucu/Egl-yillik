import AdminTextsClient from "./client"
import { createClient } from "@/lib/supabase/server"
import { hasPermission } from "@/lib/auth/permissions"
import { PERMS } from "@/lib/auth/permission-constants"

export default async function AdminTextsPage() {
    const supabase = await createClient()

    const [textsRes, anonRes] = await Promise.all([
        supabase.rpc('get_admin_texts'),
        supabase.rpc('get_admin_anonymous_texts'),
    ])

    const texts = textsRes.data || []
    const anonymousTexts = anonRes.data || []
    const result = await hasPermission(PERMS.ADMIN_TEXTS_READ)
    const canReadContent = result.ok

    return (
        <AdminTextsClient
            initialTexts={texts}
            initialAnonymousTexts={anonymousTexts}
            canReadContent={canReadContent}
        />
    )
}
