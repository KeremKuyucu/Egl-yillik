'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Shield,
    RefreshCw,
    Search,
    Clock,
    Eye,
    Ghost,
    MessageSquare,
    ChevronDown,
    Filter,
    Inbox,
    User,
    ArrowRight,
    FileText,
    Activity,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminProfile {
    first_name: string
    last_name: string
    class: string
    school_number: string
}

interface TargetInfo {
    author_name: string
    recipient_name: string
}

interface AccessLogEntry {
    id: string
    admin_id: string
    text_id: string | null
    anonymous_text_id: string | null
    text_type: 'text' | 'anonymous_text'
    accessed_at: string
    admin: AdminProfile
    target_info: TargetInfo | null
}

type FilterType = 'all' | 'text' | 'anonymous_text'
type SortType = 'newest' | 'oldest'

export default function TextAccessLogClient() {
    const [logs, setLogs] = useState<AccessLogEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<FilterType>('all')
    const [sort, setSort] = useState<SortType>('newest')
    const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_text_access_logs', { p_limit: 500 })
            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error('Access log fetch error:', error)
            toast.error('Erişim logları yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    // Benzersiz adminler
    const uniqueAdmins = useMemo(() => {
        const map = new Map<string, { id: string; name: string; count: number }>()
        logs.forEach(log => {
            const name = `${log.admin.first_name} ${log.admin.last_name}`
            if (map.has(log.admin_id)) {
                map.get(log.admin_id)!.count++
            } else {
                map.set(log.admin_id, { id: log.admin_id, name, count: 1 })
            }
        })
        return Array.from(map.values()).sort((a, b) => b.count - a.count)
    }, [logs])

    // Filtreleme
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const query = searchQuery.toLowerCase()
            let matchesSearch = !query

            if (query) {
                const adminName = `${log.admin.first_name} ${log.admin.last_name}`.toLowerCase()
                const authorName = (log.target_info?.author_name || '').toLowerCase()
                const recipientName = (log.target_info?.recipient_name || '').toLowerCase()
                matchesSearch = adminName.includes(query) ||
                    authorName.includes(query) ||
                    recipientName.includes(query)
            }

            let matchesFilter = true
            if (filter !== 'all') {
                matchesFilter = log.text_type === filter
            }

            let matchesAdmin = true
            if (selectedAdmin) {
                matchesAdmin = log.admin_id === selectedAdmin
            }

            return matchesSearch && matchesFilter && matchesAdmin
        })
    }, [logs, searchQuery, filter, selectedAdmin])

    // Sıralama
    const sortedLogs = useMemo(() => {
        return [...filteredLogs].sort((a, b) => {
            if (sort === 'newest') return new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime()
            return new Date(a.accessed_at).getTime() - new Date(b.accessed_at).getTime()
        })
    }, [filteredLogs, sort])

    // İstatistikler
    const stats = useMemo(() => ({
        total: logs.length,
        text: logs.filter(l => l.text_type === 'text').length,
        anonymous: logs.filter(l => l.text_type === 'anonymous_text').length,
        uniqueAdmins: new Set(logs.map(l => l.admin_id)).size,
    }), [logs])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-900 p-6 sm:p-8 text-white shadow-2xl shadow-slate-800/30">
                {/* Dekoratif arka plan */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
                            <Shield className="h-7 w-7 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Metin Erişim Logları</h1>
                            <p className="text-white/60 text-sm mt-1">
                                Adminlerin mesaj içeriklerine erişim kayıtları
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={fetchLogs}
                        disabled={isLoading}
                        className="gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-0 text-white rounded-xl"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Yenile</span>
                    </Button>
                </div>

                {/* Minik özet */}
                <div className="relative mt-5 flex items-center gap-3 text-sm text-white/50 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        <strong className="text-white/80">{stats.total}</strong> erişim
                    </span>
                    <span className="w-px h-4 bg-white/15" />
                    <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <strong className="text-white/80">{stats.text}</strong> normal
                    </span>
                    <span className="w-px h-4 bg-white/15" />
                    <span className="flex items-center gap-1.5">
                        <Ghost className="h-3.5 w-3.5" />
                        <strong className="text-white/80">{stats.anonymous}</strong> anonim
                    </span>
                    <span className="w-px h-4 bg-white/15" />
                    <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <strong className="text-white/80">{stats.uniqueAdmins}</strong> admin
                    </span>
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Toplam Erişim',
                        value: stats.total,
                        icon: Eye,
                        color: 'from-slate-500 to-zinc-600',
                        filterValue: 'all' as FilterType,
                    },
                    {
                        label: 'Normal Yazı',
                        value: stats.text,
                        icon: MessageSquare,
                        color: 'from-indigo-500 to-purple-600',
                        filterValue: 'text' as FilterType,
                    },
                    {
                        label: 'Anonim Yazı',
                        value: stats.anonymous,
                        icon: Ghost,
                        color: 'from-teal-500 to-cyan-600',
                        filterValue: 'anonymous_text' as FilterType,
                    },
                    {
                        label: 'Benzersiz Admin',
                        value: stats.uniqueAdmins,
                        icon: User,
                        color: 'from-amber-500 to-orange-600',
                        filterValue: 'all' as FilterType,
                    },
                ].map((stat) => (
                    <motion.button
                        key={stat.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFilter(stat.filterValue)}
                        className={cn(
                            "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200",
                            "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl border-0",
                            filter === stat.filterValue && stat.label !== 'Benzersiz Admin' && "ring-2 ring-slate-400/50 dark:ring-slate-500/50"
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

            {/* Arama + Filtreler */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Admin, yazar veya alıcı ismi ara..."
                        className="pl-10 h-11 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <span className="text-xs">✕</span>
                        </button>
                    )}
                </div>

                {/* Admin Filtresi */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80">
                            <User className="h-4 w-4" />
                            {selectedAdmin
                                ? uniqueAdmins.find(a => a.id === selectedAdmin)?.name || 'Seçili'
                                : 'Tüm Adminler'}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-xl max-h-64 overflow-y-auto">
                        <DropdownMenuItem onClick={() => setSelectedAdmin(null)}>
                            Tüm Adminler
                        </DropdownMenuItem>
                        {uniqueAdmins.map(admin => (
                            <DropdownMenuItem key={admin.id} onClick={() => setSelectedAdmin(admin.id)}>
                                <span className="flex-1">{admin.name}</span>
                                <Badge variant="secondary" className="ml-2 text-[10px] rounded-md">
                                    {admin.count}
                                </Badge>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sıralama */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80">
                            <Clock className="h-4 w-4" />
                            {sort === 'newest' ? 'En Yeni' : 'En Eski'}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => setSort('newest')}>En Yeni</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSort('oldest')}>En Eski</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Aktif Filtreler */}
            {(filter !== 'all' || searchQuery || selectedAdmin) && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Aktif filtreler:</span>
                    {filter !== 'all' && (
                        <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setFilter('all')}>
                            {filter === 'text' ? 'Normal Yazı' : 'Anonim Yazı'}
                            <span className="text-xs">✕</span>
                        </Badge>
                    )}
                    {selectedAdmin && (
                        <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSelectedAdmin(null)}>
                            Admin: {uniqueAdmins.find(a => a.id === selectedAdmin)?.name}
                            <span className="text-xs">✕</span>
                        </Badge>
                    )}
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSearchQuery('')}>
                            Arama: &quot;{searchQuery}&quot;
                            <span className="text-xs">✕</span>
                        </Badge>
                    )}
                    <button
                        onClick={() => { setFilter('all'); setSearchQuery(''); setSelectedAdmin(null) }}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:underline ml-1"
                    >
                        Tümünü temizle
                    </button>
                </div>
            )}

            {/* Log Listesi */}
            {isLoading ? (
                <div className="grid gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl animate-pulse bg-slate-100/80 dark:bg-slate-800/50" />
                    ))}
                </div>
            ) : sortedLogs.length === 0 ? (
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6">
                            <Inbox className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            {searchQuery || filter !== 'all' || selectedAdmin ? 'Sonuç bulunamadı' : 'Henüz erişim logu yok'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            {searchQuery || filter !== 'all' || selectedAdmin
                                ? 'Farklı filtreler deneyin'
                                : 'Bir admin mesaj içeriği görüntülediğinde burada görünecek'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-2">
                    <AnimatePresence mode="popLayout">
                        {sortedLogs.map((log, index) => {
                            const isAnonymous = log.text_type === 'anonymous_text'
                            const adminInitials = `${log.admin.first_name[0]}${log.admin.last_name[0]}`.toUpperCase()

                            return (
                                <motion.div
                                    key={log.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                >
                                    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden rounded-xl group">
                                        <div className={cn(
                                            "h-[2px] w-full",
                                            isAnonymous
                                                ? "bg-gradient-to-r from-teal-400 to-cyan-500"
                                                : "bg-gradient-to-r from-amber-400 to-orange-500"
                                        )} />

                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-center gap-3">
                                                {/* Admin avatar */}
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 flex-shrink-0">
                                                    {adminInitials}
                                                </div>

                                                {/* İçerik */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                                            {log.admin.first_name} {log.admin.last_name}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            bir mesaj içeriğini görüntüledi
                                                        </span>
                                                    </div>

                                                    {/* Hedef bilgisi */}
                                                    {log.target_info && (
                                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                                                            {isAnonymous ? (
                                                                <Ghost className="h-3 w-3 text-teal-400 flex-shrink-0" />
                                                            ) : (
                                                                <FileText className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                                                            )}
                                                            <span className={cn(
                                                                "font-medium truncate",
                                                                isAnonymous ? "text-teal-600 dark:text-teal-400" : "text-slate-600 dark:text-slate-400"
                                                            )}>
                                                                {log.target_info.author_name}
                                                            </span>
                                                            <ArrowRight className="h-3 w-3 flex-shrink-0 text-slate-300 dark:text-slate-600" />
                                                            <span className="font-medium truncate text-slate-600 dark:text-slate-400">
                                                                {log.target_info.recipient_name}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Sağ taraf: Tip + Zaman */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Badge className={cn(
                                                        "text-[10px] rounded-md",
                                                        isAnonymous
                                                            ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200/50 dark:border-teal-700/50"
                                                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-700/50"
                                                    )}>
                                                        {isAnonymous ? 'Anonim' : 'Normal'}
                                                    </Badge>
                                                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md whitespace-nowrap"
                                                        title={format(new Date(log.accessed_at), 'd MMMM yyyy, HH:mm:ss', { locale: tr })}
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(log.accessed_at), {
                                                            addSuffix: true,
                                                            locale: tr
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Sonuç sayısı */}
            {!isLoading && sortedLogs.length > 0 && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-slate-400 dark:text-slate-500 py-4"
                >
                    {filter === 'all' && !searchQuery && !selectedAdmin
                        ? `Toplam ${logs.length} erişim logu (${stats.text} normal, ${stats.anonymous} anonim)`
                        : `${sortedLogs.length} / ${logs.length} log gösteriliyor`
                    }
                </motion.p>
            )}
        </div>
    )
}
