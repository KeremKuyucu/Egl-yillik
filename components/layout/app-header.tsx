"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { Shield, Settings, LogOut, Menu, Home, FileText, Vote, Users, Plus, User, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ROLES } from "@/lib/constants"

interface AppHeaderProps {
  userProfile: any
  signOut: () => Promise<void>
  level: number
}

export function AppHeader({ userProfile, signOut, level }: AppHeaderProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/home", label: "Ana Sayfa", icon: Home },
    { href: "/my-texts", label: "Yazılarım", icon: FileText },
    { href: "/surveys", label: "Anketler", icon: Vote },
    { href: `/school?year=${userProfile.user_year}`, label: "Okul", icon: Users },
    { href: "/future-me", label: "Geleceğe Not", icon: Sparkles },
  ]

  const isActive = (path: string) => {
    const cleanPath = path.split("?")[0]
    return pathname === cleanPath || pathname.startsWith(`${cleanPath}/`)
  }

  const profileLink = `/profile/${userProfile.user_year}/${userProfile.school_number}`
  const initials = `${userProfile?.first_name?.[0] || ""}`.toUpperCase()

  return (
    <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 shadow-lg transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-indigo-500 rounded-lg rotate-6 opacity-20"></div>
              <img src="/image.png" className="w-8 h-8 relative z-10" alt="Logo" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-serif">
              EGL
            </span>
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* New button */}
          <Link href="/new" className="hidden sm:flex">
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Yazı Yaz</span>
            </Button>
          </Link>

          <div className="hidden sm:block">
            <ModeToggle />
          </div>

          {/* Single menu: name/avatar is the trigger (desktop+mobile) */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-10 gap-2 pl-2 pr-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all",
                  "md:flex" // both mobile+desktop
                )}
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {initials}
                </div>

                {/* Name (hidden on very small screens) */}
                <div className="hidden sm:flex flex-col items-start text-xs">
                  <span className="font-semibold leading-none">
                    {userProfile?.first_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    #{userProfile?.school_number}
                  </span>
                </div>

                <Menu className="w-4 h-4 opacity-70 sm:ml-1" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-2">
              {/* NAV */}
              <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Menü
              </DropdownMenuLabel>

              <DropdownMenuGroup className="space-y-0.5 px-1">
                {navItems.map((item) => (
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
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-2" />

              {/* ACTIONS */}
              <DropdownMenuGroup className="space-y-0.5 px-1">
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href={profileLink} className="flex items-center gap-3 w-full py-2.5 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Profilim</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/settings" className="flex items-center gap-3 w-full py-2.5 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Ayarlar</span>
                  </Link>
                </DropdownMenuItem>

                {level >= ROLES.ADMIN && (
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/admin" className="flex items-center gap-3 w-full py-2.5 px-2 text-rose-600 dark:text-rose-400">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30">
                        <Shield className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Yönetim</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-2" />

              <form action={signOut}>
                <button className="w-full flex items-center gap-3 px-2 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                    <LogOut className="h-4 w-4" />
                  </div>
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