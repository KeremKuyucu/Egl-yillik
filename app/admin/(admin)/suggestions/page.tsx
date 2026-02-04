import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Sparkles, Clock, CheckCircle2, XCircle, User } from "lucide-react"
import SuggestionActions from "./suggestion-actions"

// Interface Update
interface Suggestion {
    id: string
    title: string
    emoji: string
    description: string
    color: string
    status: string
    approved_category_id: string | null
    admin_note: string | null
    created_at: string
    reviewed_at: string | null
    suggested_by: string
    profiles: {
        first_name: string
        last_name: string
        class: string
    }
    reviewer?: {
        first_name: string
        last_name: string
    }
}

export default async function AdminSuggestionsPage() {
    const supabase = await createClient()

    // Tüm önerileri çek
    const { data: rawSuggestions } = await supabase
        .from("user_category_suggestions")
        .select(`
            *,
            profiles:suggested_by (first_name, last_name, class),
            reviewer:reviewed_by (first_name, last_name)
        `)
        .order("created_at", { ascending: false })

    // Özel Sıralama: Bekleyenler en üstte, diğerleri kendi içinde tarihe göre (SQL'den zaten tarihli geliyor)
    const suggestions = rawSuggestions?.sort((a, b) => {
        // Pending (Bekleyen) her zaman en üstte olsun
        if (a.status === "pending" && b.status !== "pending") return -1
        if (a.status !== "pending" && b.status === "pending") return 1

        // Eğer statüleri aynıysa (veya ikisi de pending değilse), sıralamayı bozma
        // (SQL'den gelen created_at DESC sıralaması korunur)
        return 0
    }) || []

    const pendingCount = suggestions?.filter(s => s.status === "pending").length || 0
    const approvedCount = suggestions?.filter(s => s.status === "approved").length || 0
    const rejectedCount = suggestions?.filter(s => s.status === "rejected").length || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg text-white shadow-lg shadow-amber-500/20">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kullanıcı Önerileri</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {pendingCount} bekleyen öneri
                    </p>
                </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Bekleyen</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{approvedCount}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Onaylanan</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                    <XCircle className="h-6 w-6 mx-auto text-red-600 dark:text-red-400 mb-1" />
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{rejectedCount}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Reddedilen</p>
                </div>
            </div>

            {/* Öneriler Listesi */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Tüm Öneriler ({suggestions?.length || 0})
                    </h2>
                </div>

                {suggestions && suggestions.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {suggestions.map((suggestion: Suggestion) => (
                            <div
                                key={suggestion.id}
                                className={`p-4 sm:p-5 ${suggestion.status === "pending"
                                    ? 'bg-amber-50/50 dark:bg-amber-950/10'
                                    : suggestion.status === "rejected"
                                        ? 'bg-red-50/30 dark:bg-red-950/10 opacity-60'
                                        : ''
                                    }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                    {/* Emoji ve Bilgiler */}
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className={`text-3xl p-2 rounded-xl bg-gradient-to-br ${suggestion.color} shadow-md`}>
                                            {suggestion.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white">
                                                    {suggestion.title}
                                                </h3>
                                                <Badge
                                                    variant={
                                                        suggestion.status === "pending" ? "outline" :
                                                            suggestion.status === "approved" ? "default" : "destructive"
                                                    }
                                                    className={
                                                        suggestion.status === "pending"
                                                            ? "border-amber-300 text-amber-600 bg-amber-50"
                                                            : suggestion.status === "approved"
                                                                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                                                : ""
                                                    }
                                                >
                                                    {suggestion.status === "pending" ? "Bekliyor" :
                                                        suggestion.status === "approved" ? "Onaylandı" : "Reddedildi"}
                                                </Badge>
                                                {suggestion.status === "approved" && !suggestion.approved_category_id && (
                                                    <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
                                                        Silindi
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                {suggestion.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <User className="h-3 w-3" />
                                                <span>
                                                    {suggestion.profiles?.first_name} {suggestion.profiles?.last_name}
                                                    <span className="text-slate-400 ml-1">({suggestion.profiles?.class})</span>
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                <span>{new Date(suggestion.created_at).toLocaleDateString('tr-TR')}</span>
                                            </div>

                                            {/* Reviewer Info */}
                                            {suggestion.status !== 'pending' && suggestion.reviewer && (
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500/80">
                                                    <span className={suggestion.status === 'approved' ? 'text-emerald-600/80' : 'text-red-600/80'}>
                                                        {suggestion.status === 'approved' ? <CheckCircle2 className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                                                        {suggestion.reviewer.first_name} {suggestion.reviewer.last_name} tarafından
                                                    </span>
                                                    <span>{suggestion.reviewed_at ? new Date(suggestion.reviewed_at).toLocaleString('tr-TR') : ''} tarihinde {suggestion.status === 'approved' ? 'onaylandı' : 'reddedildi'}</span>
                                                </div>
                                            )}

                                            {suggestion.admin_note && (
                                                <div className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                                                    <strong>Admin Notu:</strong> {suggestion.admin_note}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Aksiyonlar */}
                                    {suggestion.status === "pending" && (
                                        <SuggestionActions suggestion={suggestion} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-medium">Henüz öneri yok</p>
                        <p className="text-sm opacity-60 mt-1">Kullanıcılar kategori önerdiğinde burada görünecek</p>
                    </div>
                )}
            </div>
        </div>
    )
}
