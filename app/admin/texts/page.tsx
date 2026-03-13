import AdminTextsClient from "./client"
import { createClient } from "@/lib/supabase/server"
import { hasPermission } from "@/lib/auth/permissions"
import { PERMS } from "@/lib/auth/permission-constants"

export default async function AdminTextsPage() {
    const supabase = await createClient()

    const [res, canReadResult] = await Promise.all([
        supabase.rpc('get_admin_texts_page', {
            p_limit: 50,
            p_offset: 0,
            p_sort: 'newest',
        }),
        hasPermission(PERMS.ADMIN_TEXTS_READ_CONTENT),
    ])
    if (res.error) {
        console.error('Veriler yüklenemedi', res.error)
    }

    const data = res.data || { total: 0, stats: { all: 0, self: 0, others: 0, anonymous: 0 }, classes: [], years: [], items: [] }

    return (
        <AdminTextsClient
            initialItems={data.items || []}
            initialTotal={data.total || 0}
            initialStats={data.stats || { all: 0, self: 0, others: 0, anonymous: 0 }}
            initialClasses={data.classes || []}
            initialYears={data.years || []}
            canReadContent={canReadResult.ok}
        />
    )
}
