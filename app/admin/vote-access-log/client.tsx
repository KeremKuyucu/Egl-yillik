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
    Activity,
    User,
    ChevronDown,
    Inbox,
    Vote,
    ListFilter,
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

interface CategoryInfo {
    title: string
    emoji: string
}

interface VoteAccessLogEntry {
    id: string
    admin_id: string
    category_id: string
    accessed_at: string
    admin: AdminProfile
    category_info: CategoryInfo
}

type SortType = 'newest' | 'oldest'

export default function VoteAccessLogClient() {
    const [logs, setLogs] = useState<VoteAccessLogEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sort, setSort] = useState<SortType>('newest')
    const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_vote_access_logs', { p_limit: 500 })
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

    // Benzersiz kategoriler
    const uniqueCategories = useMemo(() => {
        const map = new Map<string, { id: string; title: string; emoji: string; count: number }>()
        logs.forEach(log => {
            if (map.has(log.category_id)) {
                map.get(log.category_id)!.count++
            } else {
                map.set(log.category_id, {
                    id: log.category_id,
                    title: log.category_info?.title || 'Bilinmeyen',
                    emoji: log.category_info?.emoji || '❓',
                    count: 1
                })
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
                const categoryTitle = (log.category_info?.title || '').toLowerCase()
                matchesSearch = adminName.includes(query) || categoryTitle.includes(query)
            }

            let matchesAdmin = true
            if (selectedAdmin) {
                matchesAdmin = log.admin_id === selectedAdmin
            }

            let matchesCategory = true
            if (selectedCategory) {
                matchesCategory = log.category_id === selectedCategory
            }

            return matchesSearch && matchesAdmin && matchesCategory
        })
    }, [logs, searchQuery, selectedAdmin, selectedCategory])

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
        uniqueAdmins: new Set(logs.map(l => l.admin_id)).size,
        uniqueCategories: new Set(logs.map(l => l.category_id)).size,
    }), [logs])

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-800 via-red-900 to-rose-900 p-6 sm:p-8 text-white shadow-2xl shadow-orange-900/30">
                {/* Dekoratif arka plan */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
                            <Vote className="h-7 w-7 text-orange-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Oy Erişim Logları</h1>
                            <p className="text-white/60 text-sm mt-1">
                                Adminlerin oylama sonuçlarına erişim kayıtları
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
                <div className="relative mt-5 grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 flex-shrink-0" />
                        <strong className="text-white/80">{stats.total}</strong> erişim
                    </span>
                    <span className="hidden sm:block w-px h-4 bg-white/15" />
                    <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <strong className="text-white/80">{stats.uniqueAdmins}</strong> admin
                    </span>
                    <span className="hidden sm:block w-px h-4 bg-white/15" />
                    <span className="flex items-center gap-1.5">
                        <ListFilter className="h-3.5 w-3.5 flex-shrink-0" />
                        <strong className="text-white/80">{stats.uniqueCategories}</strong> kategori
                    </span>
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    {
                        label: 'Toplam Erişim',
                        value: stats.total,
                        icon: Vote,
                        color: 'from-orange-500 to-red-600',
                    },
                    {
                        label: 'Benzersiz Admin',
                        value: stats.uniqueAdmins,
                        icon: User,
                        color: 'from-blue-500 to-indigo-600',
                    },
                    {
                        label: 'Benzersiz Kategori',
                        value: stats.uniqueCategories,
                        icon: ListFilter,
                        color: 'from-emerald-500 to-teal-600',
                    },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                            "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200",
                            "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl border-0"
                        )}
                    >
                        <div className={cn("absolute inset-0 opacity-5 bg-gradient-to-br", stat.color)} />
                        <div className="relative">
                            <stat.icon className="h-5 w-5 text-slate-400 dark:text-slate-500 mb-2" />
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Arama + Filtreler */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Admin veya kategori ara..."
                        className="pl-10 h-11 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
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

                {/* Filtreler */}
                <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0">
                    {/* Kategori Filtresi */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 max-w-[180px] sm:max-w-none">
                                <ListFilter className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                    {selectedCategory
                                        ? uniqueCategories.find(c => c.id === selectedCategory)?.title || 'Seçili'
                                        : 'Tüm Kategoriler'}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-xl max-h-64 overflow-y-auto">
                            <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                                Tüm Kategoriler
                            </DropdownMenuItem>
                            {uniqueCategories.map(cat => (
                                <DropdownMenuItem key={cat.id} onClick={() => setSelectedCategory(cat.id)}>
                                    <span className="flex-1 truncate">{cat.emoji} {cat.title}</span>
                                    <Badge variant="secondary" className="ml-2 text-[10px] rounded-md flex-shrink-0">
                                        {cat.count}
                                    </Badge>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Admin Filtresi */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 max-w-[180px] sm:max-w-none">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                    {selectedAdmin
                                        ? uniqueAdmins.find(a => a.id === selectedAdmin)?.name || 'Seçili'
                                        : 'Tüm Adminler'}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-xl max-h-64 overflow-y-auto">
                            <DropdownMenuItem onClick={() => setSelectedAdmin(null)}>
                                Tüm Adminler
                            </DropdownMenuItem>
                            {uniqueAdmins.map(admin => (
                                <DropdownMenuItem key={admin.id} onClick={() => setSelectedAdmin(admin.id)}>
                                    <span className="flex-1 truncate">{admin.name}</span>
                                    <Badge variant="secondary" className="ml-2 text-[10px] rounded-md flex-shrink-0">
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
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{sort === 'newest' ? 'En Yeni' : 'En Eski'}</span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40 rounded-xl">
                            <DropdownMenuItem onClick={() => setSort('newest')}>En Yeni</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSort('oldest')}>En Eski</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Aktif Filtreler */}
            {(searchQuery || selectedAdmin || selectedCategory) && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Aktif filtreler:</span>
                    {selectedCategory && (
                        <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSelectedCategory(null)}>
                            Kategori: {uniqueCategories.find(c => c.id === selectedCategory)?.title}
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
                        onClick={() => { setSearchQuery(''); setSelectedAdmin(null); setSelectedCategory(null) }}
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
                            {searchQuery || selectedAdmin || selectedCategory ? 'Sonuç bulunamadı' : 'Henüz oy erişim logu yok'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            {searchQuery || selectedAdmin || selectedCategory
                                ? 'Farklı filtreler deneyin'
                                : 'Bir admin oylama sonuçlarını görüntülediğinde burada görünecek'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-2">
                    <AnimatePresence mode="popLayout">
                        {sortedLogs.map((log, index) => {
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
                                        <div className="h-[2px] w-full bg-gradient-to-r from-orange-400 to-red-500" />

                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-start sm:items-center gap-3">
                                                {/* Admin avatar */}
                                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 flex-shrink-0 mt-0.5 sm:mt-0">
                                                    {adminInitials}
                                                </div>

                                                {/* İçerik */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                                                            {log.admin.first_name} {log.admin.last_name}
                                                        </span>
                                                        <span className="text-xs text-slate-400">•</span>
                                                        <span className="text-xs text-slate-500">
                                                            {log.admin.school_number}
                                                        </span>
                                                    </div>

                                                    {/* Kategori bilgisi */}
                                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                                                        <div className="h-5 w-5 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 rounded text-base">
                                                            {log.category_info.emoji}
                                                        </div>
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {log.category_info.title}
                                                        </span>
                                                        <span className="text-slate-400 dark:text-slate-500">
                                                            kategorisinin oylarını inceledi
                                                        </span>
                                                    </div>

                                                    {/* Zaman - mobilde alt satırda */}
                                                    <span className="flex sm:hidden items-center gap-1 mt-1.5 text-[11px] text-slate-400"
                                                        title={format(new Date(log.accessed_at), 'd MMMM yyyy, HH:mm:ss', { locale: tr })}
                                                    >
                                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                                        {formatDistanceToNow(new Date(log.accessed_at), {
                                                            addSuffix: true,
                                                            locale: tr
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Sağ taraf: Zaman (sadece desktop) */}
                                                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                                    <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md whitespace-nowrap"
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
                    {searchQuery || selectedAdmin || selectedCategory
                        ? `${sortedLogs.length} / ${logs.length} log gösteriliyor`
                        : `Toplam ${logs.length} oy erişim kaydı`
                    }
                </motion.p>
            )}
        </div>
    )
}
