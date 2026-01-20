import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireSuperAdmin } from "@/lib/auth"
import ReminderClientPage from "./client"

export default async function ReminderPage() {
    // Merkezi super admin kontrolü
    await requireSuperAdmin()

    const supabase = await createClient()

    // Fetch all profiles
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order('class', { ascending: true })
        .order('first_name', { ascending: true })

    if (error) {
        return <div className="p-10 text-red-500">Hata: {error.message} - Profilleri çekerken sorun oluştu.</div>
    }

    // Toplam anket kategorisi sayısını al
    const { data: categories } = await supabase
        .from("survey_categories")
        .select("id")
        .eq("is_active", true)

    const totalCategories = categories?.length || 0

    // Her kullanıcının anket oylarını al
    const { data: allVotes } = await supabase
        .from("survey_votes")
        .select("voter_id, category_id")

    // Kullanıcı bazlı oy sayısı haritası
    const userSurveyVotes: Record<string, Set<string>> = {}
    if (allVotes) {
        for (const vote of allVotes) {
            if (!userSurveyVotes[vote.voter_id]) {
                userSurveyVotes[vote.voter_id] = new Set()
            }
            userSurveyVotes[vote.voter_id].add(vote.category_id)
        }
    }

    // Auth Users'dan emailleri çek
    const adminClient = createAdminClient()
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers({
        perPage: 1000
    })

    if (authError) {
        console.error("Auth users fetch error:", authError)
    }

    const userEmails = new Map(authUsers?.map(u => [u.id, u.email]) || [])

    // Fetch stats for each user
    const usersWithStats = await Promise.all(
        profiles.map(async (p: any) => {
            let stats = null
            let statsError = null

            try {
                const { data, error } = await supabase.rpc('get_user_class_stats', { target_user_id: p.id })
                if (error) {
                    statsError = error.message
                } else {
                    stats = data
                }
            } catch (e: any) {
                statsError = e.message
            }

            // Anket istatistikleri
            const votedCategories = userSurveyVotes[p.id]?.size || 0
            const surveyStats = {
                total: totalCategories,
                completed: votedCategories,
                remaining: totalCategories - votedCategories,
                percentage: totalCategories > 0 ? Math.round((votedCategories / totalCategories) * 100) : 0
            }

            return {
                ...p,
                // Email auth.users'dan geliyor
                email: userEmails.get(p.id) || null,
                stats,
                statsError,
                surveyStats
            }
        })
    )

    return <ReminderClientPage users={usersWithStats} totalCategories={totalCategories} />
}

