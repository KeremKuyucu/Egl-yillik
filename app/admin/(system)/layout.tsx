"use server";
import { requireSystemAdmin } from "@/lib/auth/permissions"

export default async function SystemAdminGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSystemAdmin()
  return <>{children}</>
}