import Footer from "@/components/layout/footer"
import { AppHeader } from "@/components/layout/app-header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCurrentLevel, getCurrentProfile } from "@/lib/auth/data"
import { requireAdmin } from "@/lib/auth/permissions"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  const currentProfile = await getCurrentProfile()
  const currentLevel = await getCurrentLevel()

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground font-sans transition-colors duration-300">
      {/* aynı user layout’taki gibi blobları istersen buraya da koy */}
      <AppHeader
        mode="admin"
        userProfile={currentProfile}
        level={currentLevel}
        signOut={handleSignOut}
      />

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
        {children}
      </main>

      <Footer />
    </div>
  )
}