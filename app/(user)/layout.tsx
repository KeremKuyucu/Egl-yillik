import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/data"
import { getCurrentRoles, getCurrentPermissions } from "@/lib/auth/permissions"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"
import Footer from "@/components/layout/footer"
import AnnouncementBanner from "@/components/layout/announcement-banner"

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
        // middleware üzerinden x-url veya referer geliyorsa onu al, yoksa /home
        const headersList = await headers()
        const fullUrl = headersList.get("x-url") || headersList.get("referer") || ""
        let next = "/home"

        try {
            if (fullUrl) {
                const url = new URL(fullUrl)
                next = url.pathname + url.search
            }
        } catch (e) { }

        redirect(`/login?next=${encodeURIComponent(next)}`)
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
        <div className="min-h-screen flex flex-col text-foreground font-sans transition-colors duration-300">
            <AnnouncementBanner />

            <AppHeader
                mode="user"
                userProfile={profile}
                roles={roles}
                permissions={permissions}
                signOut={handleSignOut}
            />

            <main className="flex-1 w-full">
                {children}
            </main>

            <Footer />
        </div>
    )
}
