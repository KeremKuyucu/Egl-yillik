"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Settings, Home, LogOut } from "lucide-react"
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
    "mode" | "userProfile" | "adminNavItems" | "isAdminItemActive" | "profileLink" | "signOut"
>

export function DesktopUserMenu({
    mode,
    userProfile,
    adminNavItems,
    isAdminItemActive,
    profileLink,
    signOut,
}: Props) {
    return (
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

                {/* Admin → Gruplu menü */}
                {mode === "admin" && (
                    <>
                        <AdminNavGroups items={adminNavItems} checkActive={isAdminItemActive} />
                        <DropdownMenuSeparator className="my-2 bg-slate-200 dark:bg-slate-800" />
                    </>
                )}

                <DropdownMenuItem asChild>
                    <Link
                        href={profileLink}
                        prefetch={true}
                        className="cursor-pointer gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                    >
                        <User className="w-4 h-4" />
                        <span className="font-medium text-sm">Profilim</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link
                        href="/settings"
                        prefetch={true}
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
                            prefetch={true}
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
    )
}
