import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { ROLES } from "@/lib/constants"
import ReminderClientPage from "./client"

export default async function ReminderPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Check level from profiles table
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Only SUPER_ADMIN and OWNER can access
    if (!profile || profile.level < ROLES.SUPER_ADMIN) {
        redirect("/dashboard")
    }

    // Fetch all profiles
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order('class', { ascending: true })
        .order('first_name', { ascending: true })

    if (error) {
        return <div className="p-10 text-red-500">Hata: {error.message} - Profilleri çekerken sorun oluştu.</div>
    }

    // Fetch all auth users using admin client to get emails
    const adminClient = createAdminClient()
    const { data: authUsersData, error: authError } = await adminClient.auth.admin.listUsers({
        perPage: 1000
    })

    if (authError) {
        console.error("Auth users fetch error:", authError)
    }

    // Create a map of user_id -> email
    const emailMap: Record<string, string> = {}
    if (authUsersData?.users) {
        for (const authUser of authUsersData.users) {
            emailMap[authUser.id] = authUser.email || ''
        }
    }

    // Fetch stats for each user
    const usersWithStats = await Promise.all(
        profiles.map(async (p: any) => {
            let stats = null
            let statsError = null

            try {
                // Call the requested function with admin client (bypasses JWT check)
                const { data, error } = await adminClient.rpc('get_user_class_stats', { target_user_id: p.id })
                if (error) {
                    statsError = error.message
                } else {
                    stats = data
                }
            } catch (e: any) {
                statsError = e.message
            }

            return {
                ...p,
                email: emailMap[p.id] || null, // Get email from auth.users
                stats,
                statsError
            }
        })
    )

    return <ReminderClientPage users={usersWithStats} />
}
