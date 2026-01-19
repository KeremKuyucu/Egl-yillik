"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, MessageSquare, ArrowRight, Lock, Mail, Vote, Settings, Sparkles, Calendar } from "lucide-react"
import { toast } from "sonner"
import { ROLES } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface AdminOverviewCardsProps {
    pendingSuggestionsCount?: number
    currentUserLevel: number
}

export function AdminOverviewCards({ pendingSuggestionsCount = 0, currentUserLevel }: AdminOverviewCardsProps) {

    const canAccessTexts = currentUserLevel >= ROLES.ADMIN
    const canAccessMail = currentUserLevel >= ROLES.SUPER_ADMIN

    const handleTextsClick = (e: React.MouseEvent) => {
        if (!canAccessTexts) {
            e.preventDefault()
            toast.error("Bu alana erişim yetkiniz yok.", {
                description: "Mesaj yönetimi sadece Admin ve üzeri yetkililer içindir."
            })
        }
    }

    return (
        <div className="grid md:grid-cols-2 gap-6 w-full">
            {/* Kullanıcı Yönetimi Kartı */}
            <Link href="/admin/users" prefetch={false} className="group">
                <Card className="h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-pink-500/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Users className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                            Kullanıcı Yönetimi
                        </CardTitle>
                        <CardDescription>
                            Kullanıcıları, yetkileri ve profilleri düzenleyin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm font-medium text-pink-600 dark:text-pink-400 group-hover:translate-x-2 transition-transform">
                            Panele Git <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Mesaj Yönetimi Kartı */}
            <Link
                href={canAccessTexts ? "/admin/texts" : "#"}
                onClick={handleTextsClick}
                className={cn("group relative", !canAccessTexts && "cursor-not-allowed")}
            >
                <Card className={cn(
                    "h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-all duration-300 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800",
                    canAccessTexts
                        ? "hover:shadow-indigo-500/20 hover:-translate-y-1 hover:ring-indigo-500/50"
                        : "opacity-75 bg-slate-100/50 dark:bg-slate-900/50"
                )}>
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500",
                        canAccessTexts && "group-hover:opacity-100"
                    )} />

                    {!canAccessTexts && (
                        <div className="absolute top-4 right-4">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                    )}

                    <CardHeader>
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 transition-transform duration-300",
                            canAccessTexts
                                ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30 group-hover:scale-110"
                                : "bg-slate-400 shadow-slate-500/30 grayscale"
                        )}>
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <CardTitle className={cn(
                            "text-xl font-bold transition-colors",
                            canAccessTexts
                                ? "text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                : "text-slate-500"
                        )}>
                            Mesaj Yönetimi
                        </CardTitle>
                        <CardDescription>
                            {canAccessTexts
                                ? "Tüm yıllık yazılarını inceleyin, filtreleyin ve yönetin."
                                : "Bu alanı görüntülemek için Admin yetkisi gereklidir."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "flex items-center text-sm font-medium transition-transform",
                            canAccessTexts
                                ? "text-indigo-600 dark:text-indigo-400 group-hover:translate-x-2"
                                : "text-slate-400"
                        )}>
                            {canAccessTexts ? (
                                <>Panele Git <ArrowRight className="ml-2 h-4 w-4" /></>
                            ) : (
                                <><Lock className="mr-2 h-3 w-3" /> Erişim Kısıtlı</>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Anket Sonuçları Kartı */}
            <Link href="/admin/surveys" prefetch={false} className="group">
                <Card className="h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-purple-500/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Vote className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            Anket Sonuçları
                        </CardTitle>
                        <CardDescription>
                            Tüm anket kategorilerinin sonuçlarını ve lider tablolarını görüntüleyin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:translate-x-2 transition-transform">
                            Panele Git <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Kategori Yönetimi Kartı */}
            <Link href="/admin/categories" prefetch={false} className="group">
                <Card className="h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-amber-500/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Settings className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            Kategori Yönetimi
                        </CardTitle>
                        <CardDescription>
                            Anket kategorilerini ekleyin, düzenleyin veya pasife alın.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 group-hover:translate-x-2 transition-transform">
                            Panele Git <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Kullanıcı Önerileri Kartı */}
            <Link href="/admin/suggestions" prefetch={false} className="group">
                <Card className={cn(
                    "h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-cyan-500/50",
                    pendingSuggestionsCount > 0 && "ring-2 ring-red-500 shadow-red-500/20"
                )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {pendingSuggestionsCount > 0 && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 animate-bounce">
                            <span className="flex h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                                YENİ
                            </span>
                        </div>
                    )}

                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            Kullanıcı Önerileri
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            Öğrencilerden gelen kategori önerilerini inceleyin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-sm font-medium text-cyan-600 dark:text-cyan-400 group-hover:translate-x-2 transition-transform">
                            Panele Git <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Mail Hatırlatma Kartı - Sadece SUPER_ADMIN ve üzeri */}
            {currentUserLevel >= ROLES.SUPER_ADMIN && (
                <Link href="/admin/reminders" prefetch={false} className="group">
                    <Card className="h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-emerald-500/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Mail className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Mail Hatırlatma Sistemi
                            </CardTitle>
                            <CardDescription>
                                Tüm kullanıcılara yıllık yazı durumlarını hatırlatan toplu mail gönderin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:translate-x-2 transition-transform">
                                Panele Git <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {/* Site Ayarları Kartı - Sadece SUPER_ADMIN ve üzeri */}
            {currentUserLevel >= ROLES.SUPER_ADMIN && (
                <Link href="/admin/settings" prefetch={false} className="group">
                    <Card className="h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-violet-500/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <CardHeader>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                Site Ayarları
                            </CardTitle>
                            <CardDescription>
                                Son teslim tarihi ve diğer sistem ayarlarını düzenleyin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm font-medium text-violet-600 dark:text-violet-400 group-hover:translate-x-2 transition-transform">
                                Panele Git <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}
        </div>
    )
}
