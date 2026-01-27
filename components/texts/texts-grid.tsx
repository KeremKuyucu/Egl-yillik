"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Quote, ChevronRight, Search, Sparkles, Plus } from "lucide-react"

// Tipler
interface Text {
    id: string
    recipient_id: string
    content: string
    created_at: string
    updated_at: string
    recipient_profile: {
        first_name: string
        last_name: string
        class: string
        school_number: string
    }
}

// Avatar Renkleri (Hem Aydınlık hem Karanlık mod uyumlu)
const getAvatarColor = (name: string) => {
    const colors = [
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
        "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
        "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

export default function TextsGrid({ texts }: { texts: Text[] }) {
    const [searchQuery, setSearchQuery] = useState("")
    const [mounted, setMounted] = useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Filtreleme
    const filteredTexts = texts.filter((text) => {
        const fullName = `${text.recipient_profile.first_name} ${text.recipient_profile.last_name}`.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    if (!mounted) return <div className="min-h-[400px]" />

    if (texts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg mb-6 ring-1 ring-slate-100 dark:ring-slate-700">
                    <Sparkles className="h-10 w-10 text-amber-500 fill-amber-100 dark:fill-amber-900/20 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Henüz kimseye yazmadın</h3>
                <p className="text-muted-foreground mb-8 max-w-[300px] leading-relaxed">
                    Arkadaşlarına hatıralar bırakarak yıllığın sihrini başlat.
                </p>
                <Link href="/new" prefetch={false}>
                    <Button className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 border-0">
                        İlk Anını Paylaş
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Arama Çubuğu */}
            <div className="relative max-w-md mx-auto sm:mx-0 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                    placeholder="Yazdığın kişilerde ara..."
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-indigo-500/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredTexts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Aradığın kişi bulunamadı 😔</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredTexts.map((text, index) => {
                        const initials = `${text.recipient_profile.first_name[0]}${text.recipient_profile.last_name[0]}`.toUpperCase()
                        const fullName = `${text.recipient_profile.first_name} ${text.recipient_profile.last_name}`
                        const avatarColorClass = getAvatarColor(fullName)

                        return (
                            <div
                                key={text.id}
                                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 hover:-translate-y-1"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="relative flex flex-col h-full bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-xl p-5">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <Link href={`/profile/${text.recipient_profile.school_number}`} prefetch={false} className="shrink-0">
                                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-105 transition-transform ${avatarColorClass}`}>
                                                {initials}
                                            </div>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/profile/${text.recipient_profile.school_number}`} prefetch={false} className="block truncate">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {fullName}
                                                </h4>
                                            </Link>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0 font-medium">
                                                    {text.recipient_profile.class}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 font-mono">#{text.recipient_profile.school_number}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 relative mb-4">
                                        <Quote className="absolute -top-1 -left-1 h-4 w-4 text-indigo-200 dark:text-indigo-800 transform rotate-180" />
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed px-2 pt-2 line-clamp-4 italic">
                                            {text.content}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                            {new Date(text.updated_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                        <Link href={`/edit/${text.id}`} prefetch={false}>
                                            <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-full transition-all group/btn">
                                                Düzenle
                                                <ChevronRight className="ml-1 h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-all -mr-1 group-hover/btn:mr-0" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}