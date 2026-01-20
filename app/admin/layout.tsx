import { requireAdmin } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, LayoutDashboard, Sparkles, LogOut, ChartNoAxesCombined, FileText, Vote, Users, MessageSquare, Bell, Settings, Menu } from "lucide-react"
import { getLevelInfo, ROLES } from "@/lib/constants"
import { ModeToggle } from "@/components/mode-toggle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile: currentProfile, level: currentLevel } = await requireAdmin()

    const navItems = [
        { href: "/admin", label: "Genel Bakış", icon: ChartNoAxesCombined, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/texts", label: "Mesaj Yönetimi", icon: FileText, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/users", label: "Öğrenciler", icon: Users, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/suggestions", label: "Öneriler", icon: MessageSquare, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/categories", label: "Kategoriler", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/surveys", label: "Anketler", icon: Vote, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/reminders", label: "Hatırlatıcılar", icon: Bell, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/settings", label: "Site Ayarları", icon: Settings, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER] },
    ]

    // Filter items based on user role
    const availableNavItems = navItems.filter(item =>
        item.roles.some(role => currentLevel >= role)
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-300/20 via-transparent to-transparent pointer-events-none" />
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-300/20 via-transparent to-transparent pointer-events-none" />

            {/* Header */}
            <header className="border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-indigo-500/5">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/40 animate-pulse">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-serif leading-none">
                                        {currentProfile ? `${getLevelInfo(currentLevel).label} Paneli` : "Yönetim Paneli"}
                                    </h1>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                        <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                        Admin Erişimi
                                    </p>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Mobile Menu */}
                            <div className="md:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="mr-1">
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        {availableNavItems.map((item) => (
                                            <DropdownMenuItem key={item.href} asChild>
                                                <Link href={item.href} className="w-full cursor-pointer gap-2">
                                                    <item.icon className="h-4 w-4" />
                                                    {item.label}
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="hidden md:flex items-center gap-1 mr-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg">
                                {availableNavItems.map((item) => (
                                    <Link key={item.href} href={item.href} prefetch={false}>
                                        <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-white dark:hover:bg-slate-700">
                                            <item.icon className="h-4 w-4" />
                                            <span className="hidden lg:inline">{item.label}</span>
                                        </Button>
                                    </Link>
                                ))}
                            </div>

                            <Link href="/dashboard" prefetch={false}>
                                <Button variant="outline" size="sm" className="border-indigo-200/50 bg-white/50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-300 backdrop-blur-sm">
                                    <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Normal Site</span>
                                </Button>
                            </Link>
                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4 sm:p-6 pb-24 sm:pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </main>
        </div>
    )
}
