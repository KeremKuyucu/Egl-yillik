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
    DropdownMenuSeparator
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
        { href: "/dashboard", label: "Ana Sayfa", icon: Home },
        { href: "/my-texts", label: "Yazılarım", icon: FileText },
        { href: "/surveys", label: "Anketler", icon: Vote },
        { href: `/school?year=${userProfile.user_year}`, label: "Okul", icon: Users },
    ]

    const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)
    const profileLink = `/profile/${userProfile.user_year}/${userProfile.school_number}`

    return (
        <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 shadow-lg transition-all duration-300">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo & Desktop Nav */}
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="relative w-8 h-8">
                            <div className="absolute inset-0 bg-indigo-500 rounded-lg rotate-6 opacity-20"></div>
                            <img src="/image.png" className="w-8 h-8 relative z-10" alt="Logo" />
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-serif">
                            EGL
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
                        {navItems.map(item => (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all",
                                        isActive(item.href) && "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Admin Button */}
                    {level >= ROLES.ADMIN && (
                        <Link href="/admin" className="hidden lg:flex">
                            <Button variant="outline" size="sm" className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30">
                                <Shield className="w-4 h-4" />
                                <span className="hidden xl:inline">Yönetim</span>
                            </Button>
                        </Link>
                    )}

                    <Link href="/new" className="hidden sm:flex">
                        <Button size="sm" className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl">
                            <Plus className="w-4 h-4" />
                            <span className="hidden lg:inline">Yazı Yaz</span>
                        </Button>
                    </Link>

                    <div className="hidden sm:block">
                        <ModeToggle />
                    </div>

                    {/* Mobile Menu & User Actions */}
                    <div className="md:hidden flex items-center gap-2">
                        <Link href="/new">
                            <Button size="icon" className="h-9 w-9 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md">
                                <Plus className="w-5 h-5" />
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2">
                                <div className="flex items-center gap-3 p-2 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                        {userProfile?.first_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{userProfile?.first_name} {userProfile?.last_name}</p>
                                        <p className="text-xs text-slate-500 truncate">#{userProfile?.school_number}</p>
                                    </div>
                                </div>

                                {navItems.map(item => (
                                    <DropdownMenuItem key={item.href} asChild>
                                        <Link href={item.href} className={cn(
                                            "flex items-center gap-3 cursor-pointer p-2.5 rounded-lg mb-1",
                                            isActive(item.href) ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"
                                        )}>
                                            <item.icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator className="my-2" />

                                <DropdownMenuItem asChild>
                                    <Link href={profileLink} className="flex items-center gap-3 cursor-pointer text-slate-600 dark:text-slate-400">
                                        <User className="w-4 h-4" />
                                        Profilim
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="flex items-center gap-3 cursor-pointer text-slate-600 dark:text-slate-400">
                                        <Settings className="w-4 h-4" />
                                        Ayarlar
                                    </Link>
                                </DropdownMenuItem>

                                {level >= ROLES.ADMIN && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin" className="flex items-center gap-3 cursor-pointer text-rose-600 dark:text-rose-400">
                                            <Shield className="w-4 h-4" />
                                            Yönetim Paneli
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator className="my-2" />

                                <form action={signOut}>
                                    <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                                        <LogOut className="w-4 h-4" />
                                        Çıkış Yap
                                    </button>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="hidden md:flex">
                            <Button variant="ghost" className="gap-3 pl-2 pr-4 h-10 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                    {userProfile?.first_name?.[0]}
                                </div>
                                <div className="flex flex-col items-start text-xs">
                                    <span className="font-semibold">{userProfile?.first_name}</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <div className="px-2 py-1.5 text-xs text-slate-500 font-medium">
                                {userProfile?.first_name} {userProfile?.last_name}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={profileLink} className="cursor-pointer gap-2">
                                    <User className="w-4 h-4" />
                                    Profilim
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="cursor-pointer gap-2">
                                    <Settings className="w-4 h-4" />
                                    Ayarlar
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <form action={signOut}>
                                <button className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm">
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
