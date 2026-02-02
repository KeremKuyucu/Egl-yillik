import { requireAdmin } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, LayoutDashboard, Sparkles, ChartNoAxesCombined, FileText, Vote, Users, MessageSquare, MessageSquarePlus, Bell, Settings, Menu, ShieldAlert, ChevronDown, Database, UserCog, Activity } from "lucide-react"
import { getLevelInfo, ROLES } from "@/lib/constants"
import { ModeToggle } from "@/components/layout/mode-toggle"
import Footer from "@/components/layout/footer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile: currentProfile, level: currentLevel } = await requireAdmin()

    // Categorized navigation structure
    const navCategories = [
        {
            label: "Genel",
            icon: Activity,
            gradient: "from-blue-600 to-cyan-600",
            items: [
                { href: "/admin", label: "Genel Bakış", icon: ChartNoAxesCombined, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-blue-600 to-cyan-600" },
                { href: "/dashboard", label: "Normal Site", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-indigo-600 to-purple-600" },
            ]
        },
        {
            label: "İçerik Yönetimi",
            icon: Database,
            gradient: "from-purple-600 to-pink-600",
            items: [
                { href: "/admin/categories", label: "Kategoriler", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-indigo-600 to-purple-600" },
                { href: "/admin/suggestions", label: "Kategori Önerileri", icon: MessageSquare, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-orange-600 to-amber-600" },
            ]
        },
        {
            label: "Kullanıcı Yönetimi",
            icon: UserCog,
            gradient: "from-green-600 to-emerald-600",
            items: [
                { href: "/admin/users", label: "Öğrenciler", icon: Users, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-green-600 to-emerald-600" },
                { href: "/admin/feedback", label: "Geri Bildirimler", icon: MessageSquarePlus, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-teal-600 to-cyan-600" },
            ]
        },
        {
            label: "Sistem Yönetimi",
            icon: Settings,
            gradient: "from-slate-600 to-gray-600",
            items: [
                { href: "/admin/reminders", label: "Hatırlatıcılar", icon: Bell, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-yellow-600 to-orange-600" },
                { href: "/admin/settings", label: "Site Ayarları", icon: Settings, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-slate-600 to-gray-600" },
                { href: "/admin/logs", label: "Aktivite Logları", icon: ShieldAlert, roles: [ROLES.OWNER], gradient: "from-indigo-600 to-purple-600" },
            ]
        },
    ]

    // Filter categories and items based on user role
    const availableCategories = navCategories.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.roles.some(role => currentLevel >= role)
        )
    })).filter(category => category.items.length > 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden">
            {/* Enhanced Animated Background */}
            <div className="fixed inset-0 -z-10">
                {/* Gradient Orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-rose-400/30 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            {/* Header */}
            <header className="border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 shadow-xl shadow-indigo-500/10">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="group flex items-center gap-4 hover:opacity-90 transition-all duration-300">
                                {/* Logo with enhanced animation */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-indigo-500/50 group-hover:scale-110 transition-transform duration-300">
                                        <Shield className="h-7 w-7" />
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="flex flex-col">
                                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-serif leading-tight">
                                        {currentProfile ? `${getLevelInfo(currentLevel).label} Paneli` : "Yönetim Paneli"}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                                            <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400 animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                                Admin Erişimi
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Right Side Controls */}
                        <div className="flex items-center gap-3">
                            {/* Navigation Menu */}
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="gap-2 h-11 px-4 border-2 border-indigo-200/50 bg-white/80 dark:bg-slate-800/80 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950 dark:hover:to-purple-950 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 backdrop-blur-sm shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/20 group"
                                    >
                                        <Menu className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
                                        <span className="font-semibold bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent hidden sm:inline">
                                            Menü
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 opacity-50 group-hover:translate-y-0.5 transition-transform" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-80 p-3 shadow-2xl border-2 border-indigo-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto"
                                >
                                    {availableCategories.map((category, categoryIndex) => (
                                        <DropdownMenuGroup key={category.label}>
                                            {/* Category Header */}
                                            <DropdownMenuLabel className="px-3 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2.5 mt-2 first:mt-0">
                                                <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${category.gradient} shadow-md`}>
                                                    <category.icon className="h-3.5 w-3.5 text-white" />
                                                </div>
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    {category.label}
                                                </span>
                                            </DropdownMenuLabel>

                                            {/* Category Items */}
                                            <div className="space-y-1 mt-1 px-1">
                                                {category.items.map((item) => (
                                                    <DropdownMenuItem
                                                        key={item.href}
                                                        asChild
                                                        className="rounded-xl focus:bg-gradient-to-r focus:from-indigo-50 focus:to-purple-50 dark:focus:from-indigo-900/30 dark:focus:to-purple-900/30 cursor-pointer transition-all duration-200 group hover:scale-[1.02]"
                                                    >
                                                        <Link href={item.href} className="flex items-center gap-3 w-full py-3 px-2 focus:outline-none">
                                                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl`}>
                                                                <item.icon className="h-5 w-5" />
                                                            </div>
                                                            <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {item.label}
                                                            </span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>

                                            {/* Separator between groups */}
                                            {categoryIndex < availableCategories.length - 1 && (
                                                <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                                            )}
                                        </DropdownMenuGroup>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Mode Toggle */}
                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative">
                    {/* Content wrapper with subtle glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-3xl -z-10" />
                    {children}
                </div>
            </main>

            <Footer />
        </div>
    )
}