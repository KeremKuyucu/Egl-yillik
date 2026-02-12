import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/data"
import { getCurrentRoles, getCurrentPermissions } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"
import Footer from "@/components/layout/footer"
import AnnouncementBanner from "@/components/layout/announcement-banner"
import BackgroundBlobs from "@/components/layout/background-blobs"

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    const roles = await getCurrentRoles()
    const permissions = await getCurrentPermissions()

    if (!user) {
        redirect("/login")
    }
    if (!profile) {
        redirect("/complete-profile")
    }

    const handleSignOut = async () => {
        "use server"
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect("/login")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground font-sans transition-colors duration-300">
            <BackgroundBlobs />
            <AnnouncementBanner />
            <AppHeader
                mode="user"
                userProfile={profile}
                roles={roles}
                permissions={permissions}
                signOut={handleSignOut}
            />
            <main className="animate-in fade-in zoom-in-95 duration-500">
                {children}
            </main>
            <Footer />
        </div>
    )
}
