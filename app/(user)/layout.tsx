import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/data"
import { getCurrentRoles } from "@/lib/auth/permissions"
import { redirect } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"
import Footer from "@/components/layout/footer"

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    const roles = await getCurrentRoles()

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
            {/* Background Blobs (Global for App) */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob dark:opacity-10"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 dark:opacity-10"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 dark:opacity-10"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-6000 dark:opacity-5"></div>
            </div>

            <AppHeader
                mode="user"
                userProfile={profile}
                roles={roles}
                signOut={handleSignOut}
            />

            <main className="animate-in fade-in zoom-in-95 duration-500">
                {children}
            </main>
            <Footer />
        </div>
    )
}
