import { getCurrentUser } from "@/lib/auth/data"
import { ShieldCheck, Mail, AlertTriangle, Bell, MonitorSmartphone, Settings, User } from "lucide-react"
import ChangePassword from "@/components/settings/change-password"
import ChangeEmail from "@/components/settings/change-email"
import DeleteAccount from "@/components/settings/delete-account"
import { Badge } from "@/components/ui/badge"
import EmailPreferences from "@/components/settings/email-preferences"
import ActiveSessions from "@/components/settings/active-sessions"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect("/login")
    }

    const supabase = await createClient()
    const { data: sessions } = await supabase.rpc("get_user_sessions")

    const providers = (user.app_metadata?.providers as string[] | undefined) ?? []
    const hasPassword = providers.includes("email")
    const isLinkedToGoogle = providers.includes("google")

    const sidebarItems = [
        { id: "profile", label: "Profil Bilgileri", icon: User },
        { id: "notifications", label: "Bildirimler", icon: Bell },
        { id: "security", label: "Güvenlik", icon: ShieldCheck },
        { id: "sessions", label: "Oturum Yönetimi", icon: MonitorSmartphone },
        { id: "danger", label: "Tehlikeli Bölge", icon: AlertTriangle, danger: true },
    ]

    return (
        <div className="">
            {/* Dekoratif Arka Plan Blobları */}
            <div className="fixed top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
                {/* Header Section */}
                <div className="mb-12 space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/15 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                            <Settings size={36} className="text-indigo-500 animate-[spin_8s_linear_infinite]" suppressHydrationWarning />
                        </div>
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                                Hesap Ayarları
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 text-lg">
                                Hesabını ve tercihlerini buradan yönetebilirsin.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative border-t border-slate-200 dark:border-white/5 pt-10">
                    {/* Sticky Sidebar Navigation */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 sticky top-24 scrollbar-hide">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        className={`
                                            flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 whitespace-nowrap group
                                            ${item.danger
                                                ? "text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-500/20"}
                                        `}
                                    >
                                        <Icon
                                            size={20}
                                            className={`shrink-0 transition-colors ${item.danger ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                                            suppressHydrationWarning
                                        />
                                        {item.label}
                                    </a>
                                )
                            })}
                        </nav>
                    </aside>

                    {/* Main Content Areas */}
                    <div className="flex-1 space-y-24">
                        {/* Profile Summary Card */}
                        <section id="profile" className="scroll-mt-28 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/20">
                                    <User size={20} className="text-indigo-600 dark:text-indigo-400" suppressHydrationWarning />
                                </div>
                                <h2 className="text-2xl font-serif font-bold dark:text-white">Profil Bilgileri</h2>
                            </div>

                            <div className="relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-indigo-500/30 shadow-2xl shadow-indigo-500/10 bg-white dark:bg-[#0f172a]/50 backdrop-blur-md p-8 transition-all hover:border-indigo-500/50 duration-500">
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-[#1e1b4b] border-2 border-white/50 dark:border-indigo-500/50 text-4xl font-serif font-bold text-indigo-600 dark:text-indigo-400 shadow-xl">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-center sm:text-left flex-1">
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                            <h2 className="text-3xl font-serif font-bold dark:text-white">
                                                {user.user_metadata?.full_name || "Kullanıcı"}
                                            </h2>
                                            {isLinkedToGoogle && (
                                                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1 text-xs font-semibold rounded-full">
                                                    Google Bağlı
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/10 tracking-tighter font-mono font-bold">
                                            <Mail size={16} className="text-indigo-600 dark:text-indigo-400" suppressHydrationWarning />
                                            <span className="text-sm">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Notifications Section */}
                        <section id="notifications" className="scroll-mt-28 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/20">
                                    <Bell size={20} className="text-indigo-600 dark:text-indigo-400" suppressHydrationWarning />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Bildirimler</h2>
                            </div>
                            <div className="rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 p-1 bg-white dark:bg-[#0f172a]/20 shadow-xl shadow-indigo-500/5 overflow-hidden backdrop-blur-sm">
                                <EmailPreferences />
                            </div>
                        </section>

                        {/* Security Section Area */}
                        <section id="security" className="scroll-mt-28 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/20">
                                    <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400" suppressHydrationWarning />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Güvenlik</h2>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                {!isLinkedToGoogle && (
                                    <div className="rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 p-1 bg-white dark:bg-[#0f172a]/20 shadow-lg group hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 backdrop-blur-sm">
                                        <ChangeEmail currentEmail={user.email || ""} />
                                    </div>
                                )}
                                <div className={`rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 p-1 bg-white dark:bg-[#0f172a]/20 shadow-lg group hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 backdrop-blur-sm ${isLinkedToGoogle ? 'md:col-span-2' : ''}`}>
                                    <ChangePassword isGoogleUser={!hasPassword} userEmail={user.email || ""} />
                                </div>
                            </div>
                        </section>

                        {/* Sessions Management */}
                        <section id="sessions" className="scroll-mt-28 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/20">
                                    <MonitorSmartphone size={20} className="text-indigo-600 dark:text-indigo-400" suppressHydrationWarning />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Oturum Yönetimi</h2>
                            </div>
                            <div className="rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 overflow-hidden shadow-2xl shadow-indigo-500/10 bg-white dark:bg-[#0f172a]/30 backdrop-blur-md transition-all hover:border-indigo-500/40 duration-500">
                                <ActiveSessions initialSessions={sessions || []} currentSessionId={user.id} />
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section id="danger" className="scroll-mt-28 space-y-6 pt-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/15 rounded-xl border border-red-500/20">
                                    <AlertTriangle size={20} className="text-red-600 dark:text-red-400" suppressHydrationWarning />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-red-600 uppercase tracking-tight">Tehlikeli Bölge</h2>
                            </div>
                            <div className="relative overflow-hidden rounded-3xl border-2 border-red-100 dark:border-red-900/40 p-10 bg-red-50/50 dark:bg-red-950/20 shadow-2xl shadow-red-500/10 backdrop-blur-xl">
                                <p className="text-red-700 dark:text-red-400 mb-8 text-lg font-medium leading-relaxed max-w-2xl font-serif italic">
                                    "Hesabınızı sildiğinizde tüm mesajlarınız, anılarınız ve verileriniz kalıcı olarak kaldırılacaktır. Bu işlem geri alınamaz."
                                </p>
                                <DeleteAccount />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
