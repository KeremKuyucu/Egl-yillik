"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { HeaderSharedProps } from "./types"

type Props = Pick<HeaderSharedProps, "mode" | "navItems" | "isActive" | "isAdminItemActive">

export function DesktopNav({ mode, navItems, isActive, isAdminItemActive }: Props) {
    const visibleItems = mode === "admin" ? navItems.slice(0, 4) : navItems
    const overflowItems = mode === "admin" ? navItems.slice(4) : []

    return (
        <nav className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-800/30 p-1.5 rounded-2xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            {visibleItems.map((item) => {
                const Icon = item.icon
                const active = mode === "admin" ? isAdminItemActive(item.href) : isActive(item.href)
                return (
                    <Button
                        key={item.href}
                        asChild
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "gap-2 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                            "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400",
                            "hover:bg-white/80 dark:hover:bg-slate-700/50 hover:shadow-md hover:scale-105",
                            active &&
                            "bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-700 dark:to-slate-700/50 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5 scale-105 border border-blue-100 dark:border-blue-900/30"
                        )}
                    >
                        <Link href={item.href} prefetch={true}>
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </Link>
                    </Button>
                )
            })}

            {/* Admin "Daha Fazla" dropdown */}
            {mode === "admin" && overflowItems.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "gap-2 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                                "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400",
                                "hover:bg-white/80 dark:hover:bg-slate-700/50 hover:shadow-md hover:scale-105",
                                overflowItems.some((item) => isAdminItemActive(item.href)) &&
                                "bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-700 dark:to-slate-700/50 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5 scale-105 border border-blue-100 dark:border-blue-900/30"
                            )}
                        >
                            <span>Daha Fazla</span>
                            <ChevronRight className="w-4 h-4 rotate-90" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-56 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl"
                    >
                        {overflowItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <DropdownMenuItem key={item.href} asChild>
                                    <Link
                                        href={item.href}
                                        prefetch={true}
                                        className={cn(
                                            "flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all",
                                            isAdminItemActive(item.href)
                                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400"
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </Link>
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </nav>
    )
}
