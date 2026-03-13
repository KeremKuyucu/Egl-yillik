'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    FileText, RefreshCw, Sparkles, Trash2, Loader2, Inbox, Clock,
    ChevronDown, Filter, Search, User, ArrowRight, Quote, ExternalLink,
    MessageSquare, TrendingUp, Ghost, Eye, X, ShieldAlert, Download, FileJson, Table
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const PAGE_SIZE = 50

// ─── Types ───────────────────────────────────────────
interface Profile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    user_year: number
}

interface UnifiedItem {
    id: string
    created_at: string
    content_length: number
    isAnonymous: boolean
    display_name: string | null
    author: Profile | null
    recipient: Profile
}

interface Stats {
    all: number
    self: number
    others: number
    anonymous: number
}

interface ContentModal {
    textId: string
    isAnonymous: boolean
    content: string
    senderLabel: string
    recipientLabel: string
    date: string
}

type FilterType = 'all' | 'self' | 'others' | 'anonymous'
type SortType = 'newest' | 'oldest'

interface AdminTextsClientProps {
    initialItems: UnifiedItem[]
    initialTotal: number
    initialStats: Stats
    initialClasses: string[]
    initialYears: number[]
    canReadContent: boolean
}

// ─── Component ───────────────────────────────────────
export default function AdminTextsClient({
    initialItems,
    initialTotal,
    initialStats,
    initialClasses,
    initialYears,
    canReadContent,
}: AdminTextsClientProps) {
    // Data state
    const [items, setItems] = useState<UnifiedItem[]>(initialItems)
    const [total, setTotal] = useState(initialTotal)
    const [stats, setStats] = useState<Stats>(initialStats)
    const [allClasses, setAllClasses] = useState<string[]>(initialClasses)
    const [allYears, setAllYears] = useState<number[]>(initialYears || [])

    // Filter state
    const [filter, setFilter] = useState<FilterType>('all')
    const [authorSearchQuery, setAuthorSearchQuery] = useState('')
    const [recipientSearchQuery, setRecipientSearchQuery] = useState('')
    const [debouncedAuthorSearch, setDebouncedAuthorSearch] = useState('')
    const [debouncedRecipientSearch, setDebouncedRecipientSearch] = useState('')
    const [sort, setSort] = useState<SortType>('newest')
    const [authorClass, setAuthorClass] = useState<string | null>(null)
    const [recipientClass, setRecipientClass] = useState<string | null>(null)
    const [selectedYear, setSelectedYear] = useState<number | null>(null)

    // UI state
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [loadingContentId, setLoadingContentId] = useState<string | null>(null)
    const [contentModal, setContentModal] = useState<ContentModal | null>(null)
    const [exporting, setExporting] = useState(false)

    // Refs
    const isFirstRender = useRef(true)
    const fetchIdRef = useRef(0)

    // ─── Debounce search ───
    useEffect(() => {
        const t1 = setTimeout(() => setDebouncedAuthorSearch(authorSearchQuery), 400)
        const t2 = setTimeout(() => setDebouncedRecipientSearch(recipientSearchQuery), 400)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [authorSearchQuery, recipientSearchQuery])

    // ─── Fetch on filter/search/sort change ───
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        const id = ++fetchIdRef.current
        setLoading(true)

        const supabase = createClient()
        supabase.rpc('get_admin_texts_page', {
            p_limit: PAGE_SIZE,
            p_offset: 0,
            p_author_search: debouncedAuthorSearch || null,
            p_recipient_search: debouncedRecipientSearch || null,
            p_filter: filter,
            p_author_class: authorClass,
            p_recipient_class: recipientClass,
            p_year: selectedYear,
            p_sort: sort,
        }).then(({ data, error }) => {
            if (id !== fetchIdRef.current) return
            if (error) { toast.error('Veriler yüklenemedi'); setLoading(false); return }
            const d = data as { total: number; stats: Stats; classes: string[]; years: number[]; items: UnifiedItem[] }
            setItems(d?.items || [])
            setTotal(d?.total || 0)
            setStats(d?.stats || stats)
            setAllClasses(d?.classes || allClasses)
            setAllYears(d?.years || allYears)
            setLoading(false)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, debouncedAuthorSearch, debouncedRecipientSearch, authorClass, recipientClass, selectedYear, sort])

    // ─── Load More ───
    const handleLoadMore = async () => {
        setLoadingMore(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_texts_page', {
                p_limit: PAGE_SIZE,
                p_offset: items.length,
                p_author_search: debouncedAuthorSearch || null,
                p_recipient_search: debouncedRecipientSearch || null,
                p_filter: filter,
                p_author_class: authorClass,
                p_recipient_class: recipientClass,
                p_year: selectedYear,
                p_sort: sort,
            })
            if (error) throw error
            const d = data as { total: number; items: UnifiedItem[] }
            setItems(prev => [...prev, ...(d?.items || [])])
            setTotal(d?.total || 0)
        } catch {
            toast.error('Daha fazla yüklenemedi')
        } finally {
            setLoadingMore(false)
        }
    }

    // ─── Refresh ───
    const handleRefresh = async () => {
        isFirstRender.current = true
        setFilter('all')
        setAuthorSearchQuery('')
        setRecipientSearchQuery('')
        setDebouncedAuthorSearch('')
        setDebouncedRecipientSearch('')
        setAuthorClass(null)
        setRecipientClass(null)
        setSelectedYear(null)
        setSort('newest')
        setRefreshing(true)

        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_texts_page', {
                p_limit: PAGE_SIZE, p_offset: 0, p_sort: 'newest',
            })
            if (error) throw error
            const d = data as { total: number; stats: Stats; classes: string[]; years: number[]; items: UnifiedItem[] }
            setItems(d?.items || [])
            setTotal(d?.total || 0)
            setStats(d?.stats || stats)
            setAllClasses(d?.classes || allClasses)
            setAllYears(d?.years || allYears)
            toast.success('Veriler güncellendi')
        } catch {
            toast.error('Güncelleme başarısız')
        } finally {
            setRefreshing(false)
        }
    }

    // ─── Content viewer ───
    const fetchContent = async (itemId: string, isAnonymous: boolean, senderLabel: string, recipientLabel: string, date: string) => {
        const realId = isAnonymous ? itemId.replace('anon_', '') : itemId
        setLoadingContentId(itemId)
        try {
            const supabase = createClient()
            const rpc = isAnonymous ? 'view_anonymous_text_content' : 'view_text_content'
            const { data, error } = await supabase.rpc(rpc, { target_text_id: realId })
            if (error) throw error
            if (data?.success) {
                setContentModal({ textId: itemId, isAnonymous, content: data.content, senderLabel, recipientLabel, date })
            } else {
                toast.error(data?.error || 'İçerik yüklenemedi')
            }
        } catch {
            toast.error('İçerik yüklenemedi')
        } finally {
            setLoadingContentId(null)
        }
    }

    // ─── Delete ───
    const handleDelete = async (item: UnifiedItem) => {
        const realId = item.isAnonymous ? item.id.replace('anon_', '') : item.id
        setDeletingId(item.id)
        try {
            const supabase = createClient()
            const rpc = item.isAnonymous ? 'soft_delete_anonymous_text' : 'soft_delete_text'
            const { data, error } = await supabase.rpc(rpc, { target_text_id: realId })
            if (error) throw error
            if (data && !data.success) throw new Error(data.error || 'Silme başarısız')

            setItems(prev => prev.filter(i => i.id !== item.id))
            setTotal(prev => prev - 1)
            // Update stats
            setStats(prev => {
                const next = { ...prev, all: prev.all - 1 }
                if (item.isAnonymous) next.anonymous = prev.anonymous - 1
                else if (item.author?.id === item.recipient.id) next.self = prev.self - 1
                else next.others = prev.others - 1
                return next
            })
            toast.success(item.isAnonymous ? 'Anonim yazı silindi' : 'Yazı silindi')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Silinemedi')
        } finally {
            setDeletingId(null)
        }
    }

    // ─── Export ───
    const handleExport = async (exportFormat: 'md' | 'csv' | 'json') => {
        setExporting(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_texts_export')
            if (error) throw error
            
            let exportData = (data as any[]) || []
            
            // Mevcut filtreleri dışa aktarılacak veriye uygula
            if (filter !== 'all') {
                exportData = exportData.filter(d => {
                    if (filter === 'anonymous') return d.is_anonymous
                    if (filter === 'self') return !d.is_anonymous && d.author_name === d.recipient_name
                    if (filter === 'others') return !d.is_anonymous && d.author_name !== d.recipient_name
                    return true
                })
            }
            if (recipientClass) {
                exportData = exportData.filter(d => d.recipient_class === recipientClass)
            }
            if (authorClass) {
                exportData = exportData.filter(d => d.author_class === authorClass)
            }
            if (selectedYear) {
                exportData = exportData.filter(d => 
                    d.recipient_year === selectedYear || (!d.is_anonymous && d.author_year === selectedYear)
                )
            }
            if (authorSearchQuery) {
                const lowerq = authorSearchQuery.toLowerCase()
                exportData = exportData.filter(d => 
                    (d.author_name && d.author_name.toLowerCase().includes(lowerq)) ||
                    (!d.is_anonymous && d.author_school_number && d.author_school_number.includes(authorSearchQuery))
                )
            }
            if (recipientSearchQuery) {
                const lowerq = recipientSearchQuery.toLowerCase()
                exportData = exportData.filter(d => 
                    (d.recipient_name && d.recipient_name.toLowerCase().includes(lowerq)) ||
                    (d.recipient_school_number && d.recipient_school_number.includes(recipientSearchQuery))
                )
            }

            if (!exportData.length) {
                toast.error('Dışa aktarılacak veri bulunamadı')
                setExporting(false)
                return
            }

            const downloadBlob = (blob: Blob, filename: string) => {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }

            const timestamp = format(new Date(), 'yyyyMMdd_HHmm')

            if (exportFormat === 'json') {
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                downloadBlob(blob, `yillik_mesajlar_${timestamp}.json`)
            } else if (exportFormat === 'csv') {
                const headers = ['Alıcı Sınıf', 'Alıcı No', 'Alıcı Adı', 'Yazan Sınıf', 'Gönderen Adı', 'Mesaj', 'Anonim mi', 'Tarih']
                const rows = exportData.map(d => [
                    d.recipient_class,
                    d.recipient_school_number,
                    `"${(d.recipient_name || '').replace(/"/g, '""')}"`,
                    d.author_class || 'Bilinmiyor',
                    `"${(d.author_name || '').replace(/"/g, '""')}"`,
                    `"${(d.content || '').replace(/"/g, '""')}"`,
                    d.is_anonymous ? 'Evet' : 'Hayır',
                    format(new Date(d.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })
                ])
                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
                downloadBlob(blob, `yillik_mesajlar_${timestamp}.csv`)
            } else if (exportFormat === 'md') {
                let mdContent = `# Yıllık Mesajları (${timestamp})\n\n`
                
                const grouped = exportData.reduce((acc, curr) => {
                    const key = `${curr.recipient_class} - ${curr.recipient_school_number} - ${curr.recipient_name}`
                    if (!acc[key]) acc[key] = []
                    acc[key].push(curr)
                    return acc
                }, {} as Record<string, any[]>)

                Object.keys(grouped).sort().forEach(recipient => {
                    mdContent += `## ${recipient}\n\n`
                    grouped[recipient].forEach((msg: any) => {
                        mdContent += `**Gönderen:** ${msg.author_name} ${msg.is_anonymous ? '*(Anonim)*' : ''}\n`
                        mdContent += `**Tarih:** ${format(new Date(msg.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}\n\n`
                        mdContent += `> ${msg.content.split('\n').join('\n> ')}\n\n`
                    })
                    mdContent += `---\n\n`
                })
                const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' })
                downloadBlob(blob, `yillik_mesajlar_${timestamp}.md`)
            }
            toast.success('Dışa aktarma tamamlandı')
        } catch(err) {
            console.error('Export error:', err)
            toast.error('Dışa aktarma başarısız!')
        } finally {
            setExporting(false)
        }
    }

    // ─── Derived ───
    const normalCount = stats.all - stats.anonymous
    const hasMore = items.length < total

    // ─── Render ─────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/20">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Yazılar</h1>
                            <p className="text-white/70 text-sm mt-1">Kullanıcıların birbirlerine yazdığı mesajlar</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {canReadContent && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        disabled={exporting}
                                        className="gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 backdrop-blur-sm border border-indigo-200/20 text-white rounded-xl"
                                    >
                                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        <span className="hidden sm:inline">Dışa Aktar</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                    <DropdownMenuItem onClick={() => handleExport('md')} className="gap-2 cursor-pointer">
                                        <FileText className="h-4 w-4" /> Markdown (.md)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                                        <Table className="h-4 w-4" /> Excel / CSV (.csv)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2 cursor-pointer">
                                        <FileJson className="h-4 w-4" /> JSON (.json)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <Button
                            variant="secondary"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border-white/10 text-white rounded-xl"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Yenile</span>
                        </Button>
                    </div>
                </div>

                <div className="relative mt-5 flex items-center gap-3 text-sm text-white/60 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <strong className="text-white/90">{normalCount}</strong> yazı
                    </span>
                    <span className="w-px h-4 bg-white/20" />
                    <span className="flex items-center gap-1.5">
                        <Ghost className="h-3.5 w-3.5" />
                        <strong className="text-white/90">{stats.anonymous}</strong> anonim
                    </span>
                    <span className="w-px h-4 bg-white/20" />
                    <span>
                        <strong className="text-white/90">{allClasses.length}</strong> sınıf
                    </span>
                </div>
            </div>

            <div className="space-y-5">
                {/* ─── Stat Cards ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                        { label: 'Toplam Yazı', value: stats.all, icon: MessageSquare, color: 'from-indigo-500 to-purple-600', f: 'all' as FilterType },
                        { label: 'Kendine Yazılan', value: stats.self, icon: User, color: 'from-amber-500 to-orange-600', f: 'self' as FilterType },
                        { label: 'Başkasına Yazılan', value: stats.others, icon: ArrowRight, color: 'from-emerald-500 to-teal-600', f: 'others' as FilterType },
                        { label: 'Anonim Yazı', value: stats.anonymous, icon: Ghost, color: 'from-teal-500 to-cyan-600', f: 'anonymous' as FilterType },
                    ]).map((stat) => (
                        <motion.button
                            key={stat.label}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFilter(stat.f)}
                            className={cn(
                                "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200",
                                "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl border-0",
                                filter === stat.f && "ring-2 ring-indigo-500/50 dark:ring-indigo-400/50"
                            )}
                        >
                            <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", stat.color)} />
                            <div className="relative">
                                <stat.icon className="h-5 w-5 text-slate-400 dark:text-slate-500 mb-2" />
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* ─── Search + Filters ─── */}
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Yazana göre ara..."
                            className="pl-10 h-11 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
                            value={authorSearchQuery}
                            onChange={(e) => setAuthorSearchQuery(e.target.value)}
                        />
                        {authorSearchQuery && (
                            <button onClick={() => setAuthorSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <span className="text-xs">✕</span>
                            </button>
                        )}
                    </div>
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Alıcıya göre ara..."
                            className="pl-10 h-11 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                            value={recipientSearchQuery}
                            onChange={(e) => setRecipientSearchQuery(e.target.value)}
                        />
                        {recipientSearchQuery && (
                            <button onClick={() => setRecipientSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <span className="text-xs">✕</span>
                            </button>
                        )}
                    </div>

                    <Select value={filter} onValueChange={(v: FilterType) => setFilter(v)}>
                        <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
                            <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">Tüm Yazılar</SelectItem>
                            <SelectItem value="self">Kendine Yazılan</SelectItem>
                            <SelectItem value="others">Başkasına Yazılan</SelectItem>
                            <SelectItem value="anonymous">Anonim Yazılar</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={authorClass || 'all'} onValueChange={(v) => setAuthorClass(v === 'all' ? null : v)}>
                        <SelectTrigger className="w-full sm:w-[140px] rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
                            <SelectValue placeholder="Yazan Sınıf" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-64">
                            <SelectItem value="all">Sınıfı (Yazan): Tümü</SelectItem>
                            {allClasses.map(cls => (
                                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={recipientClass || 'all'} onValueChange={(v) => setRecipientClass(v === 'all' ? null : v)}>
                        <SelectTrigger className="w-full sm:w-[140px] rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
                            <SelectValue placeholder="Alıcı Sınıf" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-64">
                            <SelectItem value="all">Sınıfı (Alıcı): Tümü</SelectItem>
                            {allClasses.map(cls => (
                                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear ? selectedYear.toString() : 'all'} onValueChange={(v) => setSelectedYear(v === 'all' ? null : parseInt(v))}>
                        <SelectTrigger className="w-full sm:w-[130px] rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
                            <SelectValue placeholder="Yıl" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-64">
                            <SelectItem value="all">Tüm Yıllar</SelectItem>
                            {allYears.map(yr => (
                                <SelectItem key={yr.toString()} value={yr.toString()}>{yr}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={(v: SortType) => setSort(v)}>
                        <SelectTrigger className="w-full sm:w-[130px] rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap">
                            <SelectValue placeholder="Sıralama" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="newest">En Yeni</SelectItem>
                            <SelectItem value="oldest">En Eski</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* ─── Active Filters ─── */}
                {(filter !== 'all' || authorSearchQuery || recipientSearchQuery || authorClass || recipientClass || selectedYear) && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">Aktif filtreler:</span>
                        {filter !== 'all' && (
                            <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setFilter('all')}>
                                {filter === 'self' ? 'Kendine Yazılan' : filter === 'others' ? 'Başkasına Yazılan' : 'Anonim'}
                                <span className="text-xs">✕</span>
                            </Badge>
                        )}
                        {authorClass && (
                            <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setAuthorClass(null)}>
                                Yazan Sınıf: {authorClass}
                                <span className="text-xs">✕</span>
                            </Badge>
                        )}
                        {recipientClass && (
                            <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setRecipientClass(null)}>
                                Alınan Sınıf: {recipientClass}
                                <span className="text-xs">✕</span>
                            </Badge>
                        )}
                        {selectedYear && (
                            <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSelectedYear(null)}>
                                Yıl: {selectedYear}
                                <span className="text-xs">✕</span>
                            </Badge>
                        )}
                        {authorSearchQuery && (
                            <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setAuthorSearchQuery('')}>
                                Yazan Arama: &quot;{authorSearchQuery}&quot;
                                <span className="text-xs">✕</span>
                            </Badge>
                        )}
                        {recipientSearchQuery && (
                            <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setRecipientSearchQuery('')}>
                                Alıcı Arama: &quot;{recipientSearchQuery}&quot;
                                <span className="text-xs">✕</span>
                            </Badge>
                        )}
                        <button
                            onClick={() => { setFilter('all'); setAuthorSearchQuery(''); setRecipientSearchQuery(''); setAuthorClass(null); setRecipientClass(null); setSelectedYear(null); }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
                        >
                            Tümünü temizle
                        </button>
                    </div>
                )}

                {/* ─── Content ─── */}
                {!loading && items.length === 0 ? (
                    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl rounded-2xl">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6">
                                <Inbox className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                                {(authorSearchQuery || recipientSearchQuery) ? 'Arama sonucu bulunamadı' : 'Gösterilecek yazı yok'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                {(authorSearchQuery || recipientSearchQuery) ? 'Farklı bir arama terimi deneyin' : 'Filtreleri değiştirmeyi deneyin'}
                            </p>
                            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setFilter('all'); setAuthorSearchQuery(''); setRecipientSearchQuery(''); setAuthorClass(null); setRecipientClass(null); setSelectedYear(null); setSort('newest') }}>
                                Tümünü Göster
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {loading && items.length === 0 && (
                            <div className="grid gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-32 rounded-2xl animate-pulse bg-slate-100/80 dark:bg-slate-800/50" />
                                ))}
                            </div>
                        )}
                        <div className="grid gap-3 relative">
                            {loading && items.length > 0 && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center">
                                    <div className="bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full p-3 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    </div>
                                </div>
                            )}
                            <div className={cn("grid gap-3 transition-opacity duration-300", loading && items.length > 0 ? "opacity-50 pointer-events-none" : "opacity-100")}>
                                <AnimatePresence mode="popLayout" initial={false}>
                                {items.map((item, index) => {
                                    if (item.isAnonymous) {
                                        // ─── Anonymous Card ───
                                        const recipientInitials = `${item.recipient.first_name[0]}${item.recipient.last_name[0]}`.toUpperCase()
                                        return (
                                            <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
                                                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl group">
                                                    <div className="h-[3px] w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500" />
                                                    <CardContent className="p-4 sm:p-5">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md ring-2 ring-white dark:ring-slate-800">
                                                                        <Ghost className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-sm text-teal-700 dark:text-teal-300">{item.display_name}</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Anonim gönderici</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 px-2">
                                                                    <div className="h-px w-4 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-600" />
                                                                    <ArrowRight className="h-4 w-4 text-teal-400 dark:text-teal-500" />
                                                                    <div className="h-px w-4 bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent" />
                                                                </div>
                                                                <Link href={`/profile/${item.recipient.user_year}/${item.recipient.school_number}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity group/recipient">
                                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 group-hover/recipient:ring-emerald-300 transition-all">{recipientInitials}</div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover/recipient:text-emerald-600 dark:group-hover/recipient:text-emerald-400 transition-colors">{item.recipient.first_name} {item.recipient.last_name}</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.recipient.class} • #{item.recipient.school_number}</span>
                                                                    </div>
                                                                </Link>
                                                            </div>
                                                            <div className="flex items-center gap-2.5">
                                                                <Badge className="gap-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200/50 dark:border-teal-700/50 rounded-lg text-[10px]">
                                                                    <Ghost className="h-3 w-3" />Anonim
                                                                </Badge>
                                                                <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                                                                    <Clock className="h-3 w-3" />
                                                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: tr })}
                                                                </span>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/30 rounded-lg" disabled={deletingId === item.id}>
                                                                            {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="rounded-2xl">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Anonim yazıyı sil?</AlertDialogTitle>
                                                                            <AlertDialogDescription>Bu anonim yazı kalıcı olarak silinecek.</AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleDelete(item)} className="bg-red-600 hover:bg-red-700 rounded-xl">Sil</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </div>
                                                        <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/10 rounded-xl p-4">
                                                            <Quote className="absolute top-2 left-2 h-5 w-5 text-teal-200/60 dark:text-teal-800/40 transform rotate-180" />
                                                            <div className="flex items-center justify-between pl-5">
                                                                <p className="text-xs text-slate-500">{item.content_length} karakter</p>
                                                                {canReadContent ? (
                                                                    <Button variant="ghost" size="sm" onClick={() => fetchContent(item.id, true, item.display_name || 'Anonim', `${item.recipient.first_name} ${item.recipient.last_name}`, item.created_at)} disabled={loadingContentId === item.id} className="gap-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-500 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 h-8 text-xs rounded-lg">
                                                                        {loadingContentId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                                                                        İçeriği Görüntüle
                                                                    </Button>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-[10px] text-slate-400"><ShieldAlert className="h-3 w-3" />Okuma yetkisi yok</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )
                                    }

                                    // ─── Normal Card ───
                                    const author = item.author!
                                    const isSelfMessage = author.id === item.recipient.id
                                    const authorInitials = `${author.first_name[0]}${author.last_name[0]}`.toUpperCase()
                                    const recipientInitials = `${item.recipient.first_name[0]}${item.recipient.last_name[0]}`.toUpperCase()

                                    return (
                                        <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
                                            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl group">
                                                <div className={cn("h-[3px] w-full", isSelfMessage ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500")} />
                                                <CardContent className="p-4 sm:p-5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            <Link href={`/profile/${author.user_year}/${author.school_number}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity group/author">
                                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 group-hover/author:ring-indigo-300 transition-all">{authorInitials}</div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover/author:text-indigo-600 dark:group-hover/author:text-indigo-400 transition-colors">{author.first_name} {author.last_name}</span>
                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{author.class} • #{author.school_number}</span>
                                                                </div>
                                                            </Link>
                                                            {!isSelfMessage ? (
                                                                <>
                                                                    <div className="flex items-center gap-1 px-2">
                                                                        <div className="h-px w-4 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-600" />
                                                                        <ArrowRight className="h-4 w-4 text-indigo-400 dark:text-indigo-500" />
                                                                        <div className="h-px w-4 bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent" />
                                                                    </div>
                                                                    <Link href={`/profile/${item.recipient.user_year}/${item.recipient.school_number}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity group/recipient">
                                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 group-hover/recipient:ring-emerald-300 transition-all">{recipientInitials}</div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover/recipient:text-emerald-600 dark:group-hover/recipient:text-emerald-400 transition-colors">{item.recipient.first_name} {item.recipient.last_name}</span>
                                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.recipient.class} • #{item.recipient.school_number}</span>
                                                                        </div>
                                                                    </Link>
                                                                </>
                                                            ) : (
                                                                <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/50 dark:border-amber-700/50 rounded-lg">
                                                                    <User className="h-3 w-3 mr-1" />Kendine Yazdı
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: tr })}
                                                            </span>
                                                            <Link href={`/profile/${item.recipient.user_year}/${item.recipient.school_number}`} className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Link>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/30 rounded-lg" disabled={deletingId === item.id}>
                                                                        {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="rounded-2xl">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Yazıyı sil?</AlertDialogTitle>
                                                                        <AlertDialogDescription>Bu işlem geri alınamaz. Yazı kalıcı olarak silinecek.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(item)} className="bg-red-600 hover:bg-red-700 rounded-xl">Sil</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                    <div className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-4">
                                                        <Quote className="absolute top-2 left-2 h-5 w-5 text-slate-200 dark:text-slate-700 transform rotate-180" />
                                                        <div className="flex items-center justify-between pl-5">
                                                            <p className="text-xs text-slate-500">{item.content_length} karakter</p>
                                                            {canReadContent ? (
                                                                <Button variant="ghost" size="sm" onClick={() => fetchContent(item.id, false, `${author.first_name} ${author.last_name}`, `${item.recipient.first_name} ${item.recipient.last_name}`, item.created_at)} disabled={loadingContentId === item.id} className="gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 h-8 text-xs rounded-lg">
                                                                    {loadingContentId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                                                                    İçeriği Görüntüle
                                                                </Button>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[10px] text-slate-400"><ShieldAlert className="h-3 w-3" />Okuma yetkisi yok</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                            </div>
                        </div>

                        {/* ─── Load More ─── */}
                        {hasMore && (
                            <div className="flex justify-center pt-4 pb-8">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800 transition-all rounded-xl gap-2 w-full sm:w-auto"
                                >
                                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                                    Daha Fazla Göster ({total - items.length} kaldı)
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Result Count ─── */}
                {!loading && items.length > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                        {filter === 'all' && !authorSearchQuery && !recipientSearchQuery && !authorClass && !recipientClass && !selectedYear
                            ? `Toplam ${stats.all} yazı (${normalCount} normal, ${stats.anonymous} anonim)`
                            : `${items.length} / ${total} yazı gösteriliyor`
                        }
                    </motion.p>
                )}

                {/* ─── Content Modal ─── */}
                <AnimatePresence>
                    {contentModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setContentModal(null)}>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-slate-700/50"
                            >
                                <div className={cn("h-1 w-full", contentModal.isAnonymous ? "bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500" : "bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500")} />
                                <div className="p-6">
                                    <button onClick={() => setContentModal(null)} className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md", contentModal.isAnonymous ? "bg-gradient-to-br from-teal-500 to-cyan-600" : "bg-gradient-to-br from-indigo-500 to-purple-600")}>
                                            {contentModal.isAnonymous ? <Ghost className="h-4 w-4" /> : contentModal.senderLabel.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{contentModal.senderLabel}</span>
                                            <span className="text-[10px] text-slate-400">→ {contentModal.recipientLabel}</span>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(contentModal.date), 'd MMMM yyyy, HH:mm', { locale: tr })}
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-[55vh] rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/30 p-5">
                                        <Quote className="h-6 w-6 text-slate-200 dark:text-slate-700 mb-2 transform rotate-180" />
                                        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{contentModal.content}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 text-center">Bu içeriğe eriştiğiniz kayıt ediliyor.</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
