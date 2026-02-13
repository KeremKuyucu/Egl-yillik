import { getCurrentUser } from "@/lib/auth/data"
import { ShieldCheck, Mail, KeyRound, AlertTriangle, User } from "lucide-react"
import ChangePassword from "@/components/settings/change-password"
import ChangeEmail from "@/components/settings/change-email"
import DeleteAccount from "@/components/settings/delete-account"
import { Badge } from "@/components/ui/badge"
import EmailPreferences from "@/components/settings/email-preferences"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login")
    }

    const isLinkedToGoogle = user.identities?.some((i: any) => i.provider === "google")
    const hasPassword = user.identities?.some((i: any) => i.provider === "email")

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
            {/* Hero Header */}
            <div className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-6 sm:p-8 shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxc m0tMTYgNnYySDR2LTJIMTB6bTAgNHYySDR2LTJoMTZ6bTAtOHYySDR2LTJoMTZ6TTQgMTh2Mkg0di0yaDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative flex items-start gap-4">
                    <div className="p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                        <ShieldCheck className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Hesap Ayarları
                        </h1>
                        <p className="text-indigo-100 text-sm mt-1.5 leading-relaxed">
                            Güvenlik tercihlerini ve hesap bilgilerini buradan yönetebilirsin.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <Badge className="bg-white/15 backdrop-blur-sm text-white border-white/20 gap-1.5 text-xs font-medium hover:bg-white/20">
                                <User className="h-3 w-3" />
                                {user.email}
                            </Badge>
                            {isLinkedToGoogle && (
                                <Badge className="bg-white/15 backdrop-blur-sm text-white border-white/20 gap-1.5 text-xs font-medium hover:bg-white/20">
                                    <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="Google" />
                                    Google ile Bağlı
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bildirimler Bölümü */}
            <section className="mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Mail className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Bildirimler
                    </h2>
                </div>
                <EmailPreferences />
            </section>

            {/* Güvenlik Bölümü */}
            <section className="mb-10">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <KeyRound className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Güvenlik
                    </h2>
                </div>
                <div className="space-y-6">
                    {!isLinkedToGoogle && (
                        <ChangeEmail currentEmail={user.email || ""} />
                    )}
                    <ChangePassword isGoogleUser={!hasPassword} userEmail={user.email || ""} />
                </div>
            </section>

            {/* Tehlikeli Alan */}
            <section>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
                        Tehlikeli Alan
                    </h2>
                </div>
                <DeleteAccount isGoogleUser={!hasPassword} userEmail={user.email || ""} />
            </section>
        </div>
    )
}
