import { createClient } from "@/lib/supabase/server"
import ReminderClientPage from "./client"
import type { UserWithStats, BulkStatsRPCResponse } from "@/types/reminder"

export default async function RemindersPage() {
  const supabase = await createClient()

  const { data, error } = (await supabase.rpc("get_bulk_user_stats")) as {
    data: BulkStatsRPCResponse[] | null
    error: any
  }

  if (error) {
    console.error("Reminders page RPC error:", error)
    return (
      <div className="p-8 text-center text-red-500">
        Kullanıcı verileri yüklenirken hata oluştu.
      </div>
    )
  }

  const users: UserWithStats[] = (data ?? []).map((u) => ({
    id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    class: u.class,
    email: u.email,
    is_opted_out: u.is_opted_out,
    statsError: null,
    stats: {
      user_id: u.user_id,
      class: u.class,
      total_classmates: u.total_classmates,
      messages_sent_to_classmates: u.messages_sent_to_classmates,
      remaining_classmates: u.remaining_classmates,
      completion_percentage: Number(u.text_completion_percentage),
    },
    surveyStats: {
      total: u.total_survey_categories,
      completed: u.completed_surveys,
      remaining: u.remaining_surveys,
      percentage: Number(u.survey_completion_percentage),
    },
  }))

  return <ReminderClientPage users={users} />
}