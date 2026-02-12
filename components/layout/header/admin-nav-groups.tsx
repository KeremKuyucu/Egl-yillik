"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { NavItem, AdminGroup } from "./types"

const ADMIN_GROUP_META: Record<AdminGroup, { label: string; accent: boolean }> = {
    general: { label: "Genel Yönetim", accent: false },
    content: { label: "İçerik Yönetimi", accent: false },
    users: { label: "Kullanıcı Yönetimi", accent: false },
    advanced: { label: "Gelişmiş Yönetim", accent: true },
    system: { label: "Sistem Yönetimi", accent: true },
}

const ADMIN_GROUP_ORDER: AdminGroup[] = ["general", "content", "users", "advanced", "system"]

export function AdminNavGroups({
    items,
    checkActive,
}: {
    items: NavItem[]
    checkActive: (href: string) => boolean
}) {
    const grouped = new Map<AdminGroup, NavItem[]>()
    for (const item of items) {
        const g = item.group ?? "general"
        if (!grouped.has(g)) grouped.set(g, [])
        grouped.get(g)!.push(item)
    }

    return (
        <>
            {ADMIN_GROUP_ORDER.map((groupKey) => {
                const groupItems = grouped.get(groupKey)
                if (!groupItems || groupItems.length === 0) return null
                const meta = ADMIN_GROUP_META[groupKey]

                return (
                    <div key={groupKey}>
                        <div className="px-3 py-1.5 mb-1">
                            <h3
                                className={cn(
                                    "text-xs font-bold uppercase tracking-wider",
                                    meta.accent
                                        ? "text-rose-500 dark:text-rose-400"
                                        : "text-slate-500 dark:text-slate-400"
                                )}
                            >
                                {meta.label}
                            </h3>
                        </div>
                        <div className="space-y-1 mb-2">
                            {groupItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <DropdownMenuItem key={item.href} asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all",
                                                checkActive(item.href)
                                                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </>
    )
}
