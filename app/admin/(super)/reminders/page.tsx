
import ReminderClientPage from "./client"
import type { BulkStatsRPCResponse, UserWithStats } from "@/types/reminder"
import { createClient } from "@/lib/supabase/server"

export default async function ReminderPage() {
    const supabase = await createClient();

    // ✅ TEK BİR RPC ÇAĞRISI - Email dahil tüm veriler birleşik geliyor
    const { data: usersData, error: rpcError } = await supabase
        .rpc('get_bulk_user_stats') as { data: BulkStatsRPCResponse[] | null, error: any }

    if (rpcError) {
        return (
            <div className="p-8 text-red-500">
                <h2 className="text-xl font-bold mb-2">Hata</h2>
                <p>{rpcError.message}</p>
                <pre className="mt-4 p-4 bg-red-50 rounded text-xs overflow-auto">
                    {JSON.stringify(rpcError, null, 2)}
                </pre>
            </div>
        )
    }

    if (!usersData || usersData.length === 0) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold mb-2">Kullanıcı Bulunamadı</h2>
                <p className="text-slate-600">Sistemde hiç aktif kullanıcı yok.</p>
            </div>
        )
    }

    // ✅ Email artık RPC'den geliyor, ayrı çekmeye gerek yok!
    // Verileri frontend formatına dönüştür
    const users: UserWithStats[] = usersData.map((user) => ({
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        class: user.class,
        email: user.email,

        // Yazı istatistikleri
        stats: {
            user_id: user.user_id,
            class: user.class,
            total_classmates: user.total_classmates,
            messages_sent_to_classmates: user.messages_sent_to_classmates,
            remaining_classmates: user.remaining_classmates,
            completion_percentage: user.text_completion_percentage
        },

        // Anket istatistikleri
        surveyStats: {
            total: user.total_survey_categories,
            completed: user.completed_surveys,
            remaining: user.remaining_surveys,
            percentage: user.survey_completion_percentage
        },

        is_opted_out: user.is_opted_out,
        statsError: null
    }))

    return <ReminderClientPage users={users} />
}