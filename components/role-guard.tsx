// components/role-guard.tsx
import { createClient } from "@/lib/supabase/server"
import { ROLES } from "@/lib/constants"
import { ReactNode } from "react"

interface RoleGuardProps {
    children: ReactNode
    minLevel?: number // Varsayılan olarak Admin olsun istersen 50 verebilirsin
    fallback?: ReactNode
}

export default async function RoleGuard({
    children,
    minLevel = ROLES.ADMIN,
    fallback
}: RoleGuardProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return fallback ? <>{fallback}</> : null

    const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .single()

    // Seviye kontrolü
    if (!profile || profile.level < minLevel) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}