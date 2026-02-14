import { createClient } from "@/lib/supabase/server"
import LogsClient from "./logs-client"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sistem Logları | Admin",
    robots: {
        index: false,
        follow: false,
    },
}

export default async function AdminLogsPage() {
    const supabase = await createClient()

    const { data: logs } = await supabase.rpc(
        'get_activity_logs_latest',
        { p_limit: 100 }
    )

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Sistem Logları</h1>
                <p className="text-muted-foreground">
                    Veritabanı üzerinde gerçekleşen önemli değişiklikleri buradan takip edebilirsiniz.
                </p>
            </div>

            <LogsClient logs={logs || []} />
        </div>
    )
}
