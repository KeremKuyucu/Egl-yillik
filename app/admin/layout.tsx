import { requireAdmin } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Shield,
    LayoutDashboard,
    Sparkles,
    ChartNoAxesCombined,
    FileText,
    Vote,
    Users,
    MessageSquare,
    MessageSquarePlus,
    Bell,
    Settings,
    Menu,
    ShieldAlert,
    ChevronDown,
    UserCog,
    Activity,
    Home,
    LogOut,
    User,
    ChevronRight,
    Zap
} from "lucide-react"
import { getLevelInfo, ROLES } from "@/lib/constants"
import { ModeToggle } from "@/components/layout/mode-toggle"
import Footer from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
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
    const levelInfo = getLevelInfo(currentLevel)

    // Categorized navigation structure
    const navCategories = [
        {
            label: "Genel",
            icon: Activity,
            gradient: "from-blue-600 to-cyan-600",
            items: [
                { href: "/admin", label: "Genel Bakış", icon: ChartNoAxesCombined, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-blue-600 to-cyan-600" },
                { href: "/home", label: "Ana Sayfa", icon: Home, roles: [ROLES.USER], gradient: "from-slate-600 to-gray-600" },
            ]
        },
        {
            label: "Admin",
            icon: UserCog,
            gradient: "from-green-600 to-emerald-600",
            items: [
                { href: "/admin/categories", label: "Kategoriler", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-indigo-600 to-purple-600" },
                { href: "/admin/suggestions", label: "Kategori Önerileri", icon: MessageSquare, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-orange-600 to-amber-600" },
                { href: "/admin/users", label: "Öğrenciler", icon: Users, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-green-600 to-emerald-600" },
                { href: "/admin/feedback", label: "Geri Bildirimler", icon: MessageSquarePlus, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-teal-600 to-cyan-600" },
            ]
        },
        {
            label: "Super Admin",
            icon: Settings,
            gradient: "from-violet-600 to-purple-600",
            items: [
                { href: "/admin/texts", label: "Yazılar", icon: FileText, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-pink-600 to-rose-600" },
                { href: "/admin/votes", label: "Anket Sonuçları", icon: Vote, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-violet-600 to-fuchsia-600" },
                { href: "/admin/reminders", label: "Hatırlatıcılar", icon: Bell, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-yellow-600 to-orange-600" },
                { href: "/admin/settings", label: "Site Ayarları", icon: Settings, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-slate-600 to-gray-600" },
                { href: "/admin/logs", label: "Aktivite Logları", icon: ShieldAlert, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER], gradient: "from-red-600 to-rose-600" },
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

    // Get user initials
    const initials = currentProfile
        ? `${currentProfile.first_name?.[0] || ''}${currentProfile.last_name?.[0] || ''}`.toUpperCase()
        : 'AD'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative">
            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex h-16 items-center justify-between">
                        {/* Left Side - Logo & Brand */}
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="group flex items-center gap-3 hover:opacity-90 transition-all">
                                {/* Logo */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
                                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg group-hover:scale-105 transition-transform">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="hidden sm:flex flex-col">
                                    <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                                        Admin Panel
                                    </h1>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Zap className="h-3 w-3 text-amber-500" />
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                            EGL Yıllık
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Breadcrumb Separator */}
                            <div className="hidden md:flex items-center">
                                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                            </div>

                            {/* Quick Nav Pills */}
                            <nav className="hidden md:flex items-center gap-1">
                                <Link href="/admin">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <ChartNoAxesCombined className="h-3.5 w-3.5 mr-1.5" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/admin/users">
                                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <Users className="h-3.5 w-3.5 mr-1.5" />
                                        Öğrenciler
                                    </Button>
                                </Link>
                                {currentLevel >= ROLES.SUPER_ADMIN && (
                                    <Link href="/admin/settings">
                                        <Button variant="ghost" size="sm" className="h-8 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <Settings className="h-3.5 w-3.5 mr-1.5" />
                                            Ayarlar
                                        </Button>
                                    </Link>
                                )}
                            </nav>
                        </div>

                        {/* Right Side Controls */}
                        <div className="flex items-center gap-2">
                            {/* Full Navigation Menu */}
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <Menu className="h-4 w-4" />
                                        <span className="hidden sm:inline font-medium">Menü</span>
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-72 p-2 shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-[75vh] overflow-y-auto"
                                >
                                    {availableCategories.map((category, categoryIndex) => (
                                        <DropdownMenuGroup key={category.label}>
                                            {/* Category Header */}
                                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground mt-2 first:mt-0">
                                                <div className={`flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${category.gradient}`}>
                                                    <category.icon className="h-3 w-3 text-white" />
                                                </div>
                                                {category.label}
                                            </DropdownMenuLabel>

                                            {/* Category Items */}
                                            <div className="space-y-0.5 px-1">
                                                {category.items.map((item) => (
                                                    <DropdownMenuItem
                                                        key={item.href}
                                                        asChild
                                                        className="rounded-lg cursor-pointer transition-colors focus:bg-slate-100 dark:focus:bg-slate-800"
                                                    >
                                                        <Link href={item.href} className="flex items-center gap-3 w-full py-2.5 px-2">
                                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} text-white shadow-sm`}>
                                                                <item.icon className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-medium text-sm text-slate-700 dark:text-slate-200">
                                                                {item.label}
                                                            </span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>

                                            {/* Separator */}
                                            {categoryIndex < availableCategories.length - 1 && (
                                                <DropdownMenuSeparator className="my-2" />
                                            )}
                                        </DropdownMenuGroup>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Mode Toggle */}
                            <ModeToggle />

                            {/* User Profile */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-9 gap-2 pl-2 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 group"
                                    >
                                        <div className="relative">
                                            <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${levelInfo.badgeColor.includes('amber') ? 'from-amber-500 to-orange-500' : levelInfo.badgeColor.includes('purple') ? 'from-purple-500 to-pink-500' : 'from-indigo-500 to-purple-500'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                                                {initials}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                                        </div>
                                        <div className="hidden lg:flex flex-col items-start">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">
                                                {currentProfile?.first_name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                                {levelInfo.label}
                                            </span>
                                        </div>
                                        <ChevronDown className="h-3 w-3 opacity-50 hidden lg:block" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2">
                                    {/* User Info Header */}
                                    <div className="px-3 py-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${levelInfo.badgeColor.includes('amber') ? 'from-amber-500 to-orange-500' : levelInfo.badgeColor.includes('purple') ? 'from-purple-500 to-pink-500' : 'from-indigo-500 to-purple-500'} flex items-center justify-center text-white font-bold shadow-lg`}>
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {currentProfile?.first_name} {currentProfile?.last_name}
                                                </p>
                                                <Badge className={`${levelInfo.badgeColor} text-[9px] h-4 px-1.5 mt-1`}>
                                                    {levelInfo.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                        <Link href={`/profile/${currentProfile?.user_year}/${currentProfile?.school_number}`} className="flex items-center gap-2 py-2">
                                            <User className="h-4 w-4" />
                                            <span>Profilim</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                        <Link href="/home" className="flex items-center gap-2 py-2">
                                            <Home className="h-4 w-4" />
                                            <span>Siteye Dön</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-2" />
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                                        <Link href="/auth/signout" className="flex items-center gap-2 py-2">
                                            <LogOut className="h-4 w-4" />
                                            <span>Çıkış Yap</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
                {children}
            </main>

            <Footer />
        </div>
    )
}
