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

export default function DashboardGrid({ texts }: { texts: Text[] }) {
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
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="bg-card p-4 rounded-full shadow-sm mb-4 ring-1 ring-border">
                    <Sparkles className="h-8 w-8 text-amber-400 fill-amber-100 dark:fill-amber-900/20 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Henüz kimseye yazmadın</h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-[280px]">
                    Ertuğrulgazi Lisesi hatıralarını ölümsüzleştirmek için ilk adımı at.
                </p>
                <Link href="/new" prefetch={false}>
                    <Button variant="outline" className="border-border hover:bg-card hover:text-primary">
                        İlk Anını Paylaş
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Arama Çubuğu */}
            <div className="relative max-w-md mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Yazdığın kişilerde ara..."
                    className="pl-10 bg-background border-input focus:bg-background transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredTexts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    Aradığın kişi bulunamadı.
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredTexts.map((text, index) => {
                        const initials = `${text.recipient_profile.first_name[0]}${text.recipient_profile.last_name[0]}`.toUpperCase()
                        const fullName = `${text.recipient_profile.first_name} ${text.recipient_profile.last_name}`
                        const avatarColorClass = getAvatarColor(fullName)

                        return (
                            <Card
                                key={text.id}
                                className="group hover:-translate-y-1 transition-all duration-300 border-border/60 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 bg-card overflow-hidden flex flex-col"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center gap-3 space-y-0">
                                    <Link href={`/profile/${text.recipient_profile.school_number}`} prefetch={false} className="hover:opacity-80 transition-opacity">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shadow-inner ring-2 ring-background ${avatarColorClass}`}>
                                            {initials}
                                        </div>
                                    </Link>
                                    <div className="flex-1 overflow-hidden">
                                        <Link href={`/profile/${text.recipient_profile.school_number}`} prefetch={false} className="hover:text-primary transition-colors">
                                            <h4 className="font-bold text-card-foreground truncate text-sm">
                                                {fullName}
                                            </h4>
                                        </Link>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-secondary text-secondary-foreground font-normal">
                                                {text.recipient_profile.class}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">#{text.recipient_profile.school_number}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 pb-3 flex-1">
                                    {/* Tırnak İşareti: Artık 'absolute' değil, kendi yer kaplıyor */}
                                    <div className="mb-1">
                                        <Quote className="h-5 w-5 text-indigo-200 dark:text-indigo-900/50 transform -scale-x-100" />
                                    </div>

                                    {/* Metin */}
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                                        {text.content}
                                    </p>
                                </CardContent>

                                <CardFooter className="px-5 py-4 pt-0 flex items-center justify-between border-t border-border mt-3 bg-muted/30">
                                    <span className="text-[10px] text-muted-foreground font-medium flex items-center">
                                        {new Date(text.updated_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <Link href={`/edit/${text.id}`} prefetch={false}>
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:text-primary hover:bg-background group-hover:shadow-sm group-hover:pr-1 transition-all">
                                            Düzenle
                                            <ChevronRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}