import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/data"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagementClient } from "@/components/admin/user-management-client"
import { getCurrentPermissions, hasPermission } from "@/lib/auth/permissions"
import { PERMS } from "@/lib/auth/permission-constants"

interface Role {
    role_key: string
    label: string
    level: number
    description: string
    badge_color: string
}

export default async function UsersAdminPage() {
    // Merkezi admin kontrolü
    const currentUser = await getCurrentUser()
    const [permissions, canExportResult] = await Promise.all([
        getCurrentPermissions(),
        hasPermission(PERMS.ADMIN_TEXTS_READ_CONTENT)
    ])
    if (!currentUser) {
        return null
    }

    const supabase = await createClient()

    // 1. Kullanıcı verilerini, Sınıf ayarlarını, Rolleri ve Yılları paralel olarak çekiyoruz
    const [usersResponse, settingsResponse, rolesResponse, yearsResponse] = await Promise.all([
        supabase.rpc('get_admin_users_list', { sort_by: 'role' }),
        supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'valid_classes')
            .single(),
        supabase.rpc('admin_list_roles'),
        supabase.rpc('get_available_years')
    ])

    const { data: usersData, error: usersError } = usersResponse
    const { data: settingsData, error: settingsError } = settingsResponse
    const { data: rolesData, error: rolesError } = rolesResponse
    const { data: yearsData, error: yearsError } = yearsResponse

    // Hata kontrolü
    if (usersError || settingsError || rolesError || yearsError) {
        console.error("Veri çekme hatası:", usersError || settingsError || rolesError || yearsError)
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

    // 3. Rolleri normalize et (RPC'den gelen veriyi component interface'ine dönüştür)
    const normalizedRoles = (rolesData || []).map((r: Role) => ({
        key: r.role_key,
        label: r.label,
        level: r.level,
        description: r.description,
        badge_color: r.badge_color
    }))

    // 4. Yılları çıkar
    const availableYears: number[] = (yearsData || []).map((y: { year: number }) => y.year)

    return (
        <UserManagementClient
            initialUsers={usersData || []}
            currentUser={{ id: currentUser.id }}
            classes={dynamicClasses}
            availableRoles={normalizedRoles}
            availableYears={availableYears}
            permissions={permissions}
            canExportTexts={canExportResult.ok}
        />
    )
}