// app/admin/(owner)/layout.tsx
import { requireOwner } from "@/lib/auth"

export default async function OwnerGuardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireOwner()
  return <>{children}</>
}