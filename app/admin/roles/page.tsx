import { createClient } from "@/lib/supabase/server"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RolesManagementClient } from "@/components/admin/roles-management-client"
import { getCurrentPermissions } from "@/lib/auth/permissions"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Rol Yönetimi | Admin",
    robots: {
        index: false,
        follow: false,
    },
}

interface Role {
    role_key: string
    label: string
    level: number
    description: string
    badge_color: string
}

interface Permission {
    perm_key: string
    description: string | null
}

interface RolePermission {
    role_key: string
    perm_key: string
}

export default async function RolesAdminPage() {
    const supabase = await createClient()
    const permissions = await getCurrentPermissions()

    // Paralel olarak rolleri, izinleri ve rol-izin eşlemelerini çek (RPC fonksiyonları ile)
    const [rolesResponse, permissionsResponse, rolePermissionsResponse] = await Promise.all([
        supabase.rpc('admin_list_roles'),
        supabase.rpc('admin_list_permissions'),
        supabase.rpc('admin_list_role_permissions')
    ])

    const { data: rolesData, error: rolesError } = rolesResponse
    const { data: permissionsData, error: permissionsError } = permissionsResponse
    const { data: rolePermissionsData, error: rolePermissionsError } = rolePermissionsResponse

    // Hata kontrolü
    if (rolesError || permissionsError || rolePermissionsError) {
        console.error("Veri çekme hatası:", rolesError || permissionsError || rolePermissionsError)
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

    // RPC dönen veriyi normalize et (role_key -> key formatına çevir)
    const normalizedRoles = (rolesData || []).map((r: Role) => ({
        key: r.role_key,
        label: r.label,
        level: r.level,
        description: r.description,
        badge_color: r.badge_color,
        created_at: '' // RPC'den gelmiyor ama client'ta kullanılmıyor
    }))

    const normalizedPermissions = (permissionsData || []).map((p: Permission) => ({
        key: p.perm_key,
        description: p.description
    }))

    return (
        <RolesManagementClient
            initialRoles={normalizedRoles}
            initialPermissions={normalizedPermissions}
            initialRolePermissions={(rolePermissionsData || []) as RolePermission[]}
            currentUserPermissions={permissions}
        />
    )
}
