import { getCurrentUser } from "@/lib/auth/data"
import { ShieldCheck, Mail, KeyRound, AlertTriangle, User, Bell } from "lucide-react"
import ChangePassword from "@/components/settings/change-password"
import ChangeEmail from "@/components/settings/change-email"
import DeleteAccount from "@/components/settings/delete-account"
import { Badge } from "@/components/ui/badge"
import EmailPreferences from "@/components/settings/email-preferences"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    const providers = (user.app_metadata?.providers as string[] | undefined) ?? []
    const hasPassword = providers.includes("email")
    const isLinkedToGoogle = providers.includes("google")

    return (
        <div className="container mx-auto px-4 max-w-4xl py-10 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
                <p className="text-muted-foreground mt-2">
                    Hesap tercihlerinizi ve güvenlik ayarlarınızı yönetin.
                </p>
            </div>

            {/* Profile Summary Card */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-2xl font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{user.user_metadata?.full_name || "Kullanıcı"}</h2>
                            {isLinkedToGoogle && (
                                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-1">
                                    <span className="text-[10px]">Google</span>
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-indigo-100 text-sm">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{user.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Notifications Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Bell className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Bildirimler</h2>
                    </div>
                    <EmailPreferences />
                </section>

                {/* Security Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Güvenlik</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {!isLinkedToGoogle && (
                            <ChangeEmail currentEmail={user.email || ""} />
                        )}
                        <ChangePassword isGoogleUser={!hasPassword} userEmail={user.email || ""} />
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 border-b border-red-100 dark:border-red-900/30 pb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Tehlikeli Bölge</h2>
                    </div>
                    <DeleteAccount />
                </section>
            </div>
        </div>
    )
}
