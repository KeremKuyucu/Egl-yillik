import ReminderClientPage from "./client"
import type { BulkStatsRPCResponse, UserWithStats } from "@/types/reminder"
import { createClient } from "@/lib/supabase/server"

function toNumberSafe(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default async function ReminderPage() {
  const supabase = await createClient()

  // Admin panel listesi: hepsini göstermek istiyorsun -> param vermeden çekmek OK.
  const { data: usersData, error: rpcError } = (await supabase.rpc(
    "get_bulk_user_stats"
  )) as { data: BulkStatsRPCResponse[] | null; error: any }

  if (rpcError) {
    return (
      <div className="p-8 text-red-500">
        <h2 className="text-xl font-bold mb-2">Hata</h2>
        <p>{rpcError?.message ?? "Kullanıcı verileri alınırken hata oluştu."}</p>
      </div>
    )
  }

  if (!usersData?.length) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Kullanıcı Bulunamadı</h2>
        <p className="text-slate-600">Sistemde hiç aktif kullanıcı yok.</p>
      </div>
    )
  }

  const users: UserWithStats[] = usersData.map((u) => ({
    id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    class: u.class,
    email: u.email,

    stats: {
      user_id: u.user_id,
      class: u.class,
      total_classmates: u.total_classmates,
      messages_sent_to_classmates: u.messages_sent_to_classmates,
      remaining_classmates: u.remaining_classmates,
      completion_percentage: toNumberSafe(u.text_completion_percentage),
    },

    surveyStats: {
      total: u.total_survey_categories,
      completed: u.completed_surveys,
      remaining: u.remaining_surveys,
      percentage: toNumberSafe(u.survey_completion_percentage),
    },

    is_opted_out: !!u.is_opted_out,
    statsError: null,
  }))

  return <ReminderClientPage users={users} />
}