import { requireSuperAdmin } from "@/lib/auth/permissions"

export default async function SuperAdminGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()
  return <>{children}</>
}