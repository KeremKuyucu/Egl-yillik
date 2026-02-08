import { requirePermission, PAGE_PERMS } from "@/lib/auth/permissions"

export default async function RolesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Sayfa erişim kontrolü
    await requirePermission(PAGE_PERMS.PAGE_ADMIN_ROLES)

    return <>{children}</>
}
