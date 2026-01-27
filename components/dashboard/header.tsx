import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/layout/mode-toggle"
import RoleGuard from "@/components/auth/role-guard"
import { ROLES } from "@/lib/constants"
import { LogOut, Shield, Settings } from "lucide-react"

interface DashboardHeaderProps {
    userProfile: {
        first_name: string
        last_name: string
        school_number: string
        class: string
    }
    greeting: string
    signOut: () => Promise<void>
}

export default function DashboardHeader({ userProfile, greeting, signOut }: DashboardHeaderProps) {
    const initials = `${userProfile.first_name?.[0] || ''}${userProfile.last_name?.[0] || ''}`.toUpperCase()

    return (
        <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 shadow-lg">
            <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 gap-2">
                {/* Sol taraf - Logo ve Admin butonu */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <img
                            src="/image.png"
                            className="h-7 w-7 sm:h-9 sm:w-9 shrink-0"
                            alt="EGL Yıllık"
                        />
                        <span className="text-base sm:text-xl font-bold font-serif bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            EGL
                        </span>
                    </div>
                    <RoleGuard minLevel={ROLES.ADMIN}>
                        <Link href="/admin" prefetch={false}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 sm:h-8 sm:px-3 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-sm"
                            >
                                <Shield className="h-3.5 w-3.5 sm:mr-1.5" suppressHydrationWarning />
                                <span className="hidden sm:inline">Admin</span>
                            </Button>
                        </Link>
                    </RoleGuard>
                </div>

                {/* Sağ taraf - Profil ve Ayarlar */}
                <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                    {/* Profil bilgileri - Desktop */}
                    <Link href={`/profile/${userProfile?.school_number}`} prefetch={false} className="hidden md:flex flex-col items-end mr-2 min-w-0 hover:opacity-80 transition-opacity cursor-pointer group">
                        <span className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {greeting}, {userProfile?.first_name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            #{userProfile?.school_number}
                        </span>
                    </Link>

                    {/* Avatar - Mobil */}
                    <Link href={`/profile/${userProfile?.school_number}`} prefetch={false} className="md:hidden">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                            {initials}
                        </div>
                    </Link>

                    <Link href="/settings" prefetch={false}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200" title="Ayarlar">
                            <Settings className="h-4 w-4" suppressHydrationWarning />
                        </Button>
                    </Link>
                    <ModeToggle />
                    <form action={signOut}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            title="Çıkış Yap"
                        >
                            <LogOut className="h-4 w-4" suppressHydrationWarning />
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    )
}
