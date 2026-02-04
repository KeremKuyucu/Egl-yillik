import { createClient } from "@/lib/supabase/server"
import { getCurrentLevel,getCurrentUser } from "@/lib/auth"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementClient } from "@/components/admin/user-management-client"

export default async function UsersAdminPage() {
    // Merkezi admin kontrolü
    const currentUser = await getCurrentUser()
    const currentUserLevel = await getCurrentLevel()
  
    const supabase = await createClient()

    // 1. Kullanıcı verilerini ve Sınıf ayarlarını paralel olarak çekiyoruz
    const [usersResponse, settingsResponse] = await Promise.all([
        supabase.rpc('get_admin_users_list', { sort_by: 'level' }),
        supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'valid_classes')
            .single()
    ])

    const { data: usersData, error: usersError } = usersResponse
    const { data: settingsData, error: settingsError } = settingsResponse

    // Hata kontrolü
    if (usersError || settingsError) {
        console.error("Veri çekme hatası:", usersError || settingsError)
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Hata Oluştu</CardTitle>
                        <CardDescription>
                            Veriler yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // 2. Gelen string veriyi array'e çevir (Örn: "12A,12B" -> ["12A", "12B"])
    const dynamicClasses: string[] = settingsData?.value
        ? settingsData.value.split(',').map((c: string) => c.trim())
        : []

    return (
        <UserManagementClient
            initialUsers={usersData || []}
            currentUser={{ id: currentUser.id }}
            currentUserLevel={currentUserLevel}
            classes={dynamicClasses} // Artık dinamik liste gidiyor
        />
    )
}