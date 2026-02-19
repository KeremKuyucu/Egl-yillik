import Footer from "@/components/layout/footer"
import { AppHeader } from "@/components/layout/app-header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth/data"
import { getHighestRole } from "@/lib/roles"

import { getCurrentRoles, getCurrentPermissions } from "@/lib/auth/permissions"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentProfile = await getCurrentProfile()
  const roles = await getCurrentRoles()
  const permissions = await getCurrentPermissions()
  const highestRole = await getHighestRole(roles)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col text-foreground font-sans transition-colors duration-300">
      <AppHeader
        mode="admin"
        userProfile={currentProfile}
        roles={roles}
        permissions={permissions}
        signOut={handleSignOut}
        highestRoleLabel={highestRole?.label}
      />

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
        {children}
      </main>

      <Footer />
    </div>
  )
}