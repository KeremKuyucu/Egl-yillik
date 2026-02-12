"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/layout/mode-toggle"
import {
  Shield,
  Home,
  FileText,
  Vote,
  Users,
  Plus,
  Sparkles,
} from "lucide-react"
import { getPermittedAdminNavItems } from "@/lib/admin-nav"
import type { NavItem } from "./header/types"
import { DesktopNav } from "./header/desktop-nav"
import { MobileMenu } from "./header/mobile-menu"
import { DesktopUserMenu } from "./header/desktop-user-menu"

// ─── Tipler ─────────────────────────────────────────────────
interface PrettyAppHeaderProps {
  mode: "user" | "admin"
  userProfile: any
  roles: string[]
  permissions: string[]
  signOut: () => Promise<void>
  brandHref?: string
  brandLabel?: string
  showNewButton?: boolean
}

// ─── Ana Component ──────────────────────────────────────────
export function AppHeader({
  mode,
  userProfile,
  roles,
  permissions,
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

  const isAdminItemActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return isActive(href)
  }

  const profileLink = `/profile/${userProfile.user_year}/${userProfile.school_number}`
  const computedBrandHref = brandHref ?? (mode === "admin" ? "/admin" : "/home")
  const computedShowNewButton = showNewButton ?? mode === "user"

  const hasRole = (role: string) => roles.includes(role)
  const hasAdminAccess = hasRole("admin")

  // ── Navigasyon Öğeleri ──
  const userNavItems: NavItem[] = [
    { href: "/home", label: "Ana Sayfa", icon: Home },
    { href: "/my-texts", label: "Yazılarım", icon: FileText },
    { href: "/surveys", label: "Anketler", icon: Vote },
    { href: `/school?year=${userProfile.user_year}`, label: "Okul", icon: Users },
    { href: "/future-me", label: "Geleceğe Not", icon: Sparkles },
  ]

  const adminNavItems = getPermittedAdminNavItems(permissions)

  const navItems = mode === "admin" ? adminNavItems : userNavItems

  return (
    <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-800/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Sol: Logo + Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link
            href={computedBrandHref}
            className="flex items-center gap-3 group transition-all duration-300"
          >
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl rotate-6 opacity-20 group-hover:rotate-12 group-hover:opacity-30 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
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

          <DesktopNav
            mode={mode}
            navItems={navItems}
            isActive={isActive}
            isAdminItemActive={isAdminItemActive}
          />
        </div>

        {/* Sağ: Aksiyonlar + Menüler */}
        <div className="flex items-center gap-3">
          {/* Admin Kısayolu */}
          {mode === "user" && hasAdminAccess && (
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

          {/* Yeni Yazı */}
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

          <MobileMenu
            mode={mode}
            userProfile={userProfile}
            navItems={navItems}
            adminNavItems={adminNavItems}
            isActive={isActive}
            isAdminItemActive={isAdminItemActive}
            profileLink={profileLink}
            hasAdminAccess={hasAdminAccess}
            computedShowNewButton={computedShowNewButton}
            signOut={signOut}
          />

          <DesktopUserMenu
            mode={mode}
            userProfile={userProfile}
            adminNavItems={adminNavItems}
            isAdminItemActive={isAdminItemActive}
            profileLink={profileLink}
            signOut={signOut}
          />
        </div>
      </div>
    </header>
  )
}