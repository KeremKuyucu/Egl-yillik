import { createClient } from "@/lib/supabase/server"
import RoleGuard from "@/components/auth/role-guard"
import { ROLES, CLASSES } from "@/lib/constants"
import { requireAdmin } from "@/lib/auth"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementClient } from "@/components/admin/user-management-client"

export default async function UsersAdminPage() {
    // Merkezi admin kontrolü - user ve level bilgisi döner
    const { user: currentUser, level: currentUserLevel } = await requireAdmin()
    const supabase = await createClient()

    // Tüm kullanıcıları tek seferde çekiyoruz (Filtreleme client'ta yapılacak)
    const { data: usersData, error: usersError } = await supabase.rpc('get_admin_users_list', {
        sort_by: 'level'
    })

    // Hata kontrolü
    if (usersError) {
        console.error("Kullanıcı çekme hatası:", usersError)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card>
                    <CardHeader>
                        <CardTitle>Hata Oluştu</CardTitle>
                        <CardDescription>Kullanıcılar yüklenirken bir hata oluştu: {usersError.message}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Sınıf listesi (constants'tan)
    const classes = [...CLASSES]

    return (
        <RoleGuard minLevel={ROLES.ADMIN}>
            <UserManagementClient
                initialUsers={usersData || []}
                currentUser={{ id: currentUser.id }}
                currentUserLevel={currentUserLevel}
                classes={classes}
            />
        </RoleGuard>
    )
}
