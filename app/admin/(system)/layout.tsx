// app/admin/(system)/layout.tsx
import { requireSystemAdmin } from "@/lib/auth"

export default async function OwnerGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSystemdmin()
  return <>{children}</>
}