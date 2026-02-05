// app/(auth-locked)/layout.tsx
import { getCurrentUser } from "@/lib/auth/data"
import { redirect } from "next/navigation"

export default async function AuthLockedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Oturum açıksa login/signup/forgot sayfalarına sokma
  if (user) redirect("/home")

  return <>{children}</>
}