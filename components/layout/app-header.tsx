"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { cn } from "@/lib/utils"
import { ROLES } from "@/lib/constants"
import {
  Shield,
  Settings,
  LogOut,
  Menu,
  Home,
  FileText,
  Vote,
  Users,
  Plus,
  User,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  MessageSquarePlus,
  Bell,
  ShieldAlert,
  ChartNoAxesCombined,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type HeaderMode = "user" | "admin"

type NavItem = {
  href: string
  label: string
  icon: any
  minRole?: number
}

interface PrettyAppHeaderProps {
  mode: HeaderMode
  userProfile: any
  level: number
  signOut: () => Promise<void>
  brandHref?: string
  brandLabel?: string
  showNewButton?: boolean
}

export function AppHeader({
  mode,
  userProfile,
  level,
  signOut,
  brandHref,
  brandLabel = "EGL",
  showNewButton,
}: PrettyAppHeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    const cleanPath = path.split("?")[0]
    return pathname === cleanPath || pathname.startsWith(`${cleanPath}/`)
  }

  const profileLink = `/profile/${userProfile.user_year}/${userProfile.school_number}`

  const computedBrandHref = brandHref ?? (mode === "admin" ? "/admin" : "/home")
  const computedShowNewButton = showNewButton ?? (mode === "user")

  const userNavItems: NavItem[] = [
    { href: "/home", label: "Ana Sayfa", icon: Home },
    { href: "/my-texts", label: "Yazılarım", icon: FileText },
    { href: "/surveys", label: "Anketler", icon: Vote },
    { href: `/school?year=${userProfile.user_year}`, label: "Okul", icon: Users },
    { href: "/future-me", label: "Geleceğe Not", icon: Sparkles },
  ]

  const adminNavItems: NavItem[] = [
    { href: "/admin", label: "Genel Bakış", icon: ChartNoAxesCombined, minRole: ROLES.ADMIN },
    { href: "/admin/categories", label: "Kategoriler", icon: LayoutDashboard, minRole: ROLES.ADMIN },
    { href: "/admin/suggestions", label: "Kategori Önerileri", icon: MessageSquare, minRole: ROLES.ADMIN },
    { href: "/admin/users", label: "Öğrenciler", icon: Users, minRole: ROLES.ADMIN },
    { href: "/admin/feedback", label: "Geri Bildirimler", icon: MessageSquarePlus, minRole: ROLES.ADMIN },
    { href: "/admin/texts", label: "Yazılar", icon: FileText, minRole: ROLES.SUPER_ADMIN },
    { href: "/admin/votes", label: "Anket Sonuçları", icon: Vote, minRole: ROLES.SUPER_ADMIN },
    { href: "/admin/reminders", label: "Hatırlatıcılar", icon: Bell, minRole: ROLES.SUPER_ADMIN },
    { href: "/admin/settings", label: "Site Ayarları", icon: Settings, minRole: ROLES.SUPER_ADMIN },
    { href: "/admin/logs", label: "Aktivite Logları", icon: ShieldAlert, minRole: ROLES.SUPER_ADMIN },
  ].filter((i) => (i.minRole ? level >= i.minRole : true))

  const navItems = mode === "admin" ? adminNavItems : userNavItems

  return (
    <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-800/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo + Pills */}
        <div className="flex items-center gap-6">
          <Link 
            href={computedBrandHref} 
            className="flex items-center gap-3 group transition-all duration-300"
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl rotate-6 opacity-20 group-hover:rotate-12 group-hover:opacity-30 transition-all duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
              <img 
                src="/image.png" 
                className="w-10 h-10 relative z-10 drop-shadow-lg group-hover:scale-105 transition-transform duration-300" 
                alt="Logo" 
              />
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-serif tracking-tight">
                {brandLabel}
              </span>

              {mode === "admin" && (
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r from-red-50 to-rose-50 text-red-700 dark:from-red-950/30 dark:to-rose-950/30 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-sm">
                  Admin
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Pills - Premium Style */}
          <nav className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-800/30 p-1.5 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                    "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400",
                    "hover:bg-white/80 dark:hover:bg-slate-700/50 hover:shadow-md hover:scale-105",
                    isActive(item.href) && 
                    "bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-700 dark:to-slate-700/50 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5 scale-105 border border-blue-100 dark:border-blue-900/30"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Admin Shortcut - Premium Style */}
          {mode === "user" && level >= ROLES.ADMIN && (
            <Link href="/admin" className="hidden lg:flex">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 px-4 rounded-xl font-medium border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 dark:hover:from-red-950/30 dark:hover:to-rose-950/30 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden xl:inline">Yönetim</span>
              </Button>
            </Link>
          )}

          {/* New Button - Premium Style */}
          {computedShowNewButton && (
            <Link href="/new" className="hidden sm:flex">
              <Button
                size="sm"
                className="gap-2 px-5 h-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Yazı Yaz</span>
              </Button>
            </Link>
          )}

          <div className="hidden sm:block">
            <ModeToggle />
          </div>

          {/* Mobile: + + menu */}
          <div className="md:hidden flex items-center gap-2">
            {computedShowNewButton && (
              <Link href="/new">
                <Button
                  size="icon"
                  className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent 
                align="end" 
                className="w-80 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl"
              >
                {/* Header Card - Premium */}
                <div className="flex items-center gap-3 p-3 mb-3 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {userProfile?.first_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      #{userProfile?.school_number}
                    </p>
                  </div>
                </div>

                {/* Nav items - Premium */}
                <div className="space-y-1 mb-3">
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-200",
                          isActive(item.href)
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>

                {mode === "admin" && (
                  <>
                    <DropdownMenuSeparator className="my-3 bg-slate-200 dark:bg-slate-800" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/home"
                        className="flex items-center gap-3 cursor-pointer p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-medium text-sm">Siteye Dön</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="my-3 bg-slate-200 dark:bg-slate-800" />

                {/* Profile + Settings */}
                <DropdownMenuItem asChild>
                  <Link
                    href={profileLink}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium text-sm">Profilim</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href={mode === "admin" ? "/admin/settings" : "/settings"}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium text-sm">Ayarlar</span>
                  </Link>
                </DropdownMenuItem>

                {mode === "user" && level >= ROLES.ADMIN && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="font-medium text-sm">Yönetim Paneli</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-3 bg-slate-200 dark:bg-slate-800" />

                <form action={signOut}>
                  <button className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop User Menu - Premium */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <Button
                variant="ghost"
                className="gap-3 pl-2 pr-4 h-11 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 hover:shadow-md hover:scale-105 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {userProfile?.first_name?.[0]}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    {userProfile?.first_name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    #{userProfile?.school_number}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              align="end" 
              className="w-72 mt-2 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl"
            >
              <div className="px-3 py-2 mb-2 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/30 dark:to-slate-800/20">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {userProfile?.first_name} {userProfile?.last_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  #{userProfile?.school_number}
                </p>
              </div>

              <DropdownMenuSeparator className="my-2 bg-slate-200 dark:bg-slate-800" />

              {mode === "admin" && (
                <>
                  <div className="space-y-1 mb-2">
                    {navItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all",
                            isActive(item.href)
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="my-2 bg-slate-200 dark:bg-slate-800" />
                </>
              )}

              <DropdownMenuItem asChild>
                <Link 
                  href={profileLink} 
                  className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium text-sm">Profilim</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link 
                  href={mode === "admin" ? "/admin/settings" : "/settings"} 
                  className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium text-sm">Ayarlar</span>
                </Link>
              </DropdownMenuItem>

              {mode === "admin" && (
                <DropdownMenuItem asChild>
                  <Link 
                    href="/home" 
                    className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                  >
                    <Home className="w-4 h-4" />
                    <span className="font-medium text-sm">Siteye Dön</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-2 bg-slate-200 dark:bg-slate-800" />

              <form action={signOut}>
                <button className="w-full text-left flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}