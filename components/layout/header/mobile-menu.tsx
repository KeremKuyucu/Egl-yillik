"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/layout/mode-toggle"
import {
    Menu,
    Plus,
    User,
    Settings,
    Shield,
    LogOut,
    ChevronRight,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AdminNavGroups } from "./admin-nav-groups"
import type { HeaderSharedProps } from "./types"

type Props = Pick<
    HeaderSharedProps,
    | "mode"
    | "userProfile"
    | "navItems"
    | "adminNavItems"
    | "isActive"
    | "isAdminItemActive"
    | "profileLink"
    | "hasAdminAccess"
    | "computedShowNewButton"
    | "signOut"
>

export function MobileMenu({
    mode,
    userProfile,
    navItems,
    adminNavItems,
    isActive,
    isAdminItemActive,
    profileLink,
    hasAdminAccess,
    computedShowNewButton,
    signOut,
}: Props) {
    return (
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
                    {/* Kullanıcı Kartı */}
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
                        <div className="ml-auto">
                            <ModeToggle />
                        </div>
                    </div>

                    {/* Admin → Gruplu Menü / User → Düz Liste */}
                    {mode === "admin" ? (
                        <AdminNavGroups items={adminNavItems} checkActive={isAdminItemActive} />
                    ) : (
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
                    )}

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
                            href="/settings"
                            className="flex items-center gap-3 cursor-pointer p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="font-medium text-sm">Ayarlar</span>
                        </Link>
                    </DropdownMenuItem>

                    {mode === "user" && hasAdminAccess && (
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
    )
}
