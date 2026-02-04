"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { cn } from "@/lib/utils"
import { ROLES } from "@/lib/constants"
import {
  Shield,
  ChartNoAxesCombined,
  LayoutDashboard,
  FileText,
  Vote,
  Users,
  MessageSquare,
  MessageSquarePlus,
  Bell,
  Settings,
  ShieldAlert,
  Home,
  LogOut,
  User,
  ChevronDown,
  Activity,
  Zap
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"

type NavItem = {
  href: string
  label: string
  icon: any
  roles: number[]
}

interface AdminHeaderProps {
  currentProfile: any
  currentLevel: number
}

export function AdminHeader({ currentProfile, currentLevel }: AdminHeaderProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    const cleanPath = path.split("?")[0]
    return pathname === cleanPath || pathname.startsWith(`${cleanPath}/`)
  }

  const initials = currentProfile
    ? `${currentProfile.first_name?.[0] || ""}${currentProfile.last_name?.[0] || ""}`.toUpperCase()
    : "AD"

  const profileLink = `/profile/${currentProfile?.user_year}/${currentProfile?.school_number}`

  const navCategories: Array<{ label: string; icon: any; items: NavItem[] }> = [
    {
      label: "Genel",
      icon: Activity,
      items: [
        { href: "/admin", label: "Genel Bakış", icon: ChartNoAxesCombined, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/home", label: "Siteye Dön", icon: Home, roles: [ROLES.USER] },
      ],
    },
    {
      label: "Admin",
      icon: LayoutDashboard,
      items: [
        { href: "/admin/categories", label: "Kategoriler", icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/suggestions", label: "Kategori Önerileri", icon: MessageSquare, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/users", label: "Öğrenciler", icon: Users, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/feedback", label: "Geri Bildirimler", icon: MessageSquarePlus, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OWNER] },
      ],
    },
    {
      label: "Super Admin",
      icon: Settings,
      items: [
        { href: "/admin/texts", label: "Yazılar", icon: FileText, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/votes", label: "Anket Sonuçları", icon: Vote, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/reminders", label: "Hatırlatıcılar", icon: Bell, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/settings", label: "Site Ayarları", icon: Settings, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER] },
        { href: "/admin/logs", label: "Aktivite Logları", icon: ShieldAlert, roles: [ROLES.SUPER_ADMIN, ROLES.OWNER] },
      ],
    },
  ]

  const availableCategories = navCategories
    .map((c) => ({
      ...c,
      items: c.items.filter((i) => i.roles.some((r) => currentLevel >= r)),
    }))
    .filter((c) => c.items.length > 0)

  return (
    <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 shadow-lg transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-indigo-500 rounded-lg rotate-6 opacity-20"></div>
              <div className="w-8 h-8 relative z-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-serif">
              Admin
            </span>
          </Link>

          {/* İstersen burada user header’daki gibi “pill nav” da koyarsın; ben sade bıraktım */}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ModeToggle />
          </div>

          {/* Tek menü: isim/avatar trigger */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 pl-2 pr-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>

                <div className="hidden sm:flex flex-col items-start text-xs">
                  <span className="font-semibold leading-none">{currentProfile?.first_name}</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Admin Panel
                  </span>
                </div>

                <ChevronDown className="w-4 h-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-2 max-h-[75vh] overflow-y-auto">
              {/* NAV */}
              {availableCategories.map((category, idx) => (
                <DropdownMenuGroup key={category.label}>
                  <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 first:mt-0 flex items-center gap-2">
                    <category.icon className="w-3.5 h-3.5" />
                    {category.label}
                  </DropdownMenuLabel>

                  <div className="space-y-0.5 px-1">
                    {category.items.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        asChild
                        className={cn(
                          "rounded-lg cursor-pointer transition-colors focus:bg-slate-100 dark:focus:bg-slate-800",
                          isActive(item.href) && "bg-indigo-50 dark:bg-indigo-900/20"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full py-2.5 px-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>

                  {idx < availableCategories.length - 1 && <DropdownMenuSeparator className="my-2" />}
                </DropdownMenuGroup>
              ))}

              <DropdownMenuSeparator className="my-2" />

              {/* ACTIONS */}
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href={profileLink} className="flex items-center gap-3 w-full py-2.5 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Profilim</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link href="/admin/settings" className="flex items-center gap-3 w-full py-2.5 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Admin Ayarları</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                <Link href="/auth/signout" className="flex items-center gap-3 w-full py-2.5 px-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Çıkış Yap</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}