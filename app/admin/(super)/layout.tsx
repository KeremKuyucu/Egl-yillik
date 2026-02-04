import { requireSuperAdmin } from "@/lib/auth"

export default async function SuperAdminGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()
  return <>{children}</>
}