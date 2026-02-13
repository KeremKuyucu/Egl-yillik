'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Trash2,
    Loader2,
    Inbox,
    Clock,
    ChevronDown,
    Filter,
    Search,
    User,
    ArrowRight,
    Quote,
    ExternalLink,
    MessageSquare,
    TrendingUp,
    Ghost,
    Eye,
    X,
    ShieldAlert,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { PERMS } from '@/lib/auth/permission-constants'

interface Profile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    user_year: number
}

interface Text {
    id: string
    content_length: number
    created_at: string
    author: Profile
    recipient: Profile
}

interface AnonymousText {
    id: string
    content_length: number
    display_name: string
    created_at: string
    recipient: Profile
}

// Birleşik liste öğesi
interface ListItem {
    id: string
    content_length: number
    created_at: string
    isAnonymous: boolean
    text?: Text
    anonymousText?: AnonymousText
}

// Modal data
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

interface ListViewProps {
    texts: Text[]
    setTexts: React.Dispatch<React.SetStateAction<Text[]>>
    anonymousTexts: AnonymousText[]
    setAnonymousTexts: React.Dispatch<React.SetStateAction<AnonymousText[]>>
    isLoading: boolean
}

export default function ListView({ texts, setTexts, anonymousTexts, setAnonymousTexts, isLoading }: ListViewProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterType>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sort, setSort] = useState<SortType>('newest')
    const [selectedClass, setSelectedClass] = useState<string | null>(null)
    const [loadingContentId, setLoadingContentId] = useState<string | null>(null)
    const [contentModal, setContentModal] = useState<ContentModal | null>(null)
    const [hasReadPermission, setHasReadPermission] = useState<boolean | null>(null)

    // Client-side yetki kontrolü: admin.texts.read
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const supabase = createClient()
                const { data } = await supabase.rpc('get_my_permissions')
                const perms = (data ?? []) as string[]
                setHasReadPermission(perms.includes(PERMS.ADMIN_TEXTS_READ))
            } catch {
                setHasReadPermission(false)
            }
        }
        checkPermission()
    }, [])

    const fetchContent = async (textId: string, isAnonymous: boolean, senderLabel: string, recipientLabel: string, date: string) => {
        setLoadingContentId(textId)
        try {
            const supabase = createClient()
            const rpc = isAnonymous ? 'view_anonymous_text_content' : 'view_text_content'
            const { data, error } = await supabase.rpc(rpc, { target_text_id: textId })
            if (error) throw error
            if (data?.success) {
                setContentModal({
                    textId,
                    isAnonymous,
                    content: data.content,
                    senderLabel,
                    recipientLabel,
                    date,
                })
            } else {
                toast.error(data?.error || 'İçerik yüklenemedi')
            }
        } catch {
            toast.error('İçerik yüklenemedi')
        } finally {
            setLoadingContentId(null)
        }
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .rpc('soft_delete_text', { target_text_id: id })

            if (error) throw error
            if (data && !data.success) throw new Error(data.error || 'Silme başarısız')

            setTexts(prev => prev.filter(t => t.id !== id))
            toast.success('Yazı silindi')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Silinemedi')
        } finally {
            setDeletingId(null)
        }
    }

    const handleDeleteAnonymous = async (id: string) => {
        setDeletingId(id)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .rpc('soft_delete_anonymous_text', { target_text_id: id })

            if (error) throw error
            if (data && !data.success) throw new Error(data.error || 'Silme başarısız')

            setAnonymousTexts(prev => prev.filter(t => t.id !== id))
            toast.success('Anonim yazı silindi')
        } catch (error) {
            console.error('Delete anonymous error:', error)
            toast.error('Silinemedi')
        } finally {
            setDeletingId(null)
        }
    }

    // Tüm sınıfları bul
    const allClasses = Array.from(new Set([
        ...texts.flatMap(t => [t.author.class, t.recipient.class]),
        ...anonymousTexts.map(t => t.recipient.class),
    ])).sort()

    // Birleşik liste oluştur
    const allItems: ListItem[] = [
        ...texts.map(t => ({
            id: t.id,
            content_length: t.content_length,
            created_at: t.created_at,
            isAnonymous: false,
            text: t,
        })),
        ...anonymousTexts.map(at => ({
            id: `anon_${at.id}`,
            content_length: at.content_length,
            created_at: at.created_at,
            isAnonymous: true,
            anonymousText: at,
        })),
    ]

    // Filtreleme
    const filteredItems = allItems.filter(item => {
        const query = searchQuery.toLowerCase()
        let matchesSearch = searchQuery === ''

        if (!matchesSearch) {
            if (item.isAnonymous && item.anonymousText) {
                const at = item.anonymousText
                const recipientName = `${at.recipient.first_name} ${at.recipient.last_name}`.toLowerCase()
                matchesSearch = recipientName.includes(query) ||
                    at.display_name.toLowerCase().includes(query) ||
                    at.recipient.school_number.includes(query)
            } else if (item.text) {
                const authorName = `${item.text.author.first_name} ${item.text.author.last_name}`.toLowerCase()
                const recipientName = `${item.text.recipient.first_name} ${item.text.recipient.last_name}`.toLowerCase()
                matchesSearch = authorName.includes(query) ||
                    recipientName.includes(query) ||
                    item.text.author.school_number.includes(query) ||
                    item.text.recipient.school_number.includes(query)
            }
        }

        let matchesFilter = true
        if (filter === 'anonymous') {
            matchesFilter = item.isAnonymous
        } else if (filter === 'self') {
            matchesFilter = !item.isAnonymous && item.text?.author.id === item.text?.recipient.id
        } else if (filter === 'others') {
            matchesFilter = !item.isAnonymous && item.text?.author.id !== item.text?.recipient.id
        }

        let matchesClass = !selectedClass
        if (selectedClass) {
            if (item.isAnonymous && item.anonymousText) {
                matchesClass = item.anonymousText.recipient.class === selectedClass
            } else if (item.text) {
                matchesClass = item.text.author.class === selectedClass ||
                    item.text.recipient.class === selectedClass
            }
        }

        return matchesSearch && matchesFilter && matchesClass
    })

    // Sıralama
    const sortedItems = [...filteredItems].sort((a, b) => {
        if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const stats = {
        total: texts.length + anonymousTexts.length,
        self: texts.filter(t => t.author.id === t.recipient.id).length,
        others: texts.filter(t => t.author.id !== t.recipient.id).length,
        anonymous: anonymousTexts.length,
    }

    return (
        <div className="space-y-5">
            {/* Ana İstatistikler */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Toplam Yazı',
                        value: stats.total,
                        icon: MessageSquare,
                        color: 'from-indigo-500 to-purple-600',
                        filter: 'all' as FilterType,
                    },
                    {
                        label: 'Kendine Yazılan',
                        value: stats.self,
                        icon: User,
                        color: 'from-amber-500 to-orange-600',
                        filter: 'self' as FilterType,
                    },
                    {
                        label: 'Başkasına Yazılan',
                        value: stats.others,
                        icon: ArrowRight,
                        color: 'from-emerald-500 to-teal-600',
                        filter: 'others' as FilterType,
                    },
                    {
                        label: 'Anonim Yazı',
                        value: stats.anonymous,
                        icon: Ghost,
                        color: 'from-teal-500 to-cyan-600',
                        filter: 'anonymous' as FilterType,
                    },
                ].map((stat) => (
                    <motion.button
                        key={stat.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFilter(stat.filter)}
                        className={cn(
                            "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200",
                            "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl border-0",
                            filter === stat.filter && "ring-2 ring-indigo-500/50 dark:ring-indigo-400/50"
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

            {/* Arama + Filtre Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="İsim veya numara ara..."
                        className="pl-10 h-11 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
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

                {/* Sınıf Filtresi */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80">
                            <Filter className="h-4 w-4" />
                            {selectedClass || 'Tüm Sınıflar'}
                            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 rounded-xl">
                        <DropdownMenuItem onClick={() => setSelectedClass(null)}>
                            Tüm Sınıflar
                        </DropdownMenuItem>
                        {allClasses.map(cls => (
                            <DropdownMenuItem key={cls} onClick={() => setSelectedClass(cls)}>
                                {cls}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sıralama */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl h-11 bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80">
                            <TrendingUp className="h-4 w-4" />
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
            {(filter !== 'all' || searchQuery || selectedClass) && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Aktif filtreler:</span>
                    {filter !== 'all' && (
                        <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setFilter('all')}>
                            {filter === 'self' ? 'Kendine Yazılan' : filter === 'others' ? 'Başkasına Yazılan' : 'Anonim'}
                            <span className="text-xs">✕</span>
                        </Badge>
                    )}
                    {selectedClass && (
                        <Badge variant="secondary" className="gap-1 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => setSelectedClass(null)}>
                            Sınıf: {selectedClass}
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
                        onClick={() => { setFilter('all'); setSearchQuery(''); setSelectedClass(null) }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
                    >
                        Tümünü temizle
                    </button>
                </div>
            )}

            {/* İçerik */}
            {isLoading ? (
                <div className="grid gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl animate-pulse bg-slate-100/80 dark:bg-slate-800/50" />
                    ))}
                </div>
            ) : sortedItems.length === 0 ? (
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6">
                            <Inbox className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            {searchQuery ? 'Arama sonucu bulunamadı' : 'Gösterilecek yazı yok'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            {searchQuery
                                ? 'Farklı bir arama terimi deneyin'
                                : 'Filtreleri değiştirmeyi deneyin'
                            }
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4 rounded-xl"
                            onClick={() => { setFilter('all'); setSearchQuery(''); setSelectedClass(null) }}
                        >
                            Tümünü Göster
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    <AnimatePresence mode="popLayout">
                        {sortedItems.map((item, index) => {
                            if (item.isAnonymous && item.anonymousText) {
                                // Anonim yazı kartı
                                const at = item.anonymousText
                                const recipientInitials = `${at.recipient.first_name[0]}${at.recipient.last_name[0]}`.toUpperCase()

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                    >
                                        <Card className={cn(
                                            "border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl group",
                                        )}>
                                            {/* Üst renk şeridi - teal for anonymous */}
                                            <div className="h-[3px] w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500" />

                                            <CardContent className="p-4 sm:p-5">
                                                {/* Header */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        {/* Ghost author */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md ring-2 ring-white dark:ring-slate-800">
                                                                <Ghost className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-sm text-teal-700 dark:text-teal-300">
                                                                    {at.display_name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                    Anonim gönderici
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 px-2">
                                                            <div className="h-px w-4 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-600" />
                                                            <ArrowRight className="h-4 w-4 text-teal-400 dark:text-teal-500" />
                                                            <div className="h-px w-4 bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent" />
                                                        </div>

                                                        <Link
                                                            href={`/profile/${at.recipient.user_year}/${at.recipient.school_number}`}
                                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity group/recipient"
                                                        >
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 group-hover/recipient:ring-emerald-300 transition-all">
                                                                {recipientInitials}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover/recipient:text-emerald-600 dark:group-hover/recipient:text-emerald-400 transition-colors">
                                                                    {at.recipient.first_name} {at.recipient.last_name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                    {at.recipient.class} • #{at.recipient.school_number}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </div>

                                                    {/* Aksiyonlar */}
                                                    <div className="flex items-center gap-2.5">
                                                        <Badge className="gap-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200/50 dark:border-teal-700/50 rounded-lg text-[10px]">
                                                            <Ghost className="h-3 w-3" />
                                                            Anonim
                                                        </Badge>
                                                        <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(at.created_at), {
                                                                addSuffix: true,
                                                                locale: tr
                                                            })}
                                                        </span>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/30 rounded-lg"
                                                                    disabled={deletingId === at.id}
                                                                >
                                                                    {deletingId === at.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="rounded-2xl">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Anonim yazıyı sil?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Bu anonim yazı kalıcı olarak silinecek.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteAnonymous(at.id)}
                                                                        className="bg-red-600 hover:bg-red-700 rounded-xl"
                                                                    >
                                                                        Sil
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>

                                                {/* Mesaj Bilgisi */}
                                                <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/10 rounded-xl p-4">
                                                    <Quote className="absolute top-2 left-2 h-5 w-5 text-teal-200/60 dark:text-teal-800/40 transform rotate-180" />
                                                    <div className="flex items-center justify-between pl-5">
                                                        <p className="text-xs text-slate-500">{at.content_length} karakter</p>
                                                        {hasReadPermission ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => fetchContent(
                                                                    at.id,
                                                                    true,
                                                                    at.display_name,
                                                                    `${at.recipient.first_name} ${at.recipient.last_name}`,
                                                                    at.created_at,
                                                                )}
                                                                disabled={loadingContentId === at.id}
                                                                className="gap-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-500 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 h-8 text-xs rounded-lg"
                                                            >
                                                                {loadingContentId === at.id ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                )}
                                                                İçeriği Görüntüle
                                                            </Button>
                                                        ) : hasReadPermission === false ? (
                                                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                <ShieldAlert className="h-3 w-3" />
                                                                Okuma yetkisi yok
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )
                            }

                            // Normal yazı kartı
                            const text = item.text!
                            const isSelfMessage = text.author.id === text.recipient.id
                            const authorInitials = `${text.author.first_name[0]}${text.author.last_name[0]}`.toUpperCase()
                            const recipientInitials = `${text.recipient.first_name[0]}${text.recipient.last_name[0]}`.toUpperCase()

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                >
                                    <Card className={cn(
                                        "border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl group",
                                    )}>
                                        {/* Üst renk şeridi */}
                                        <div className={cn(
                                            "h-[3px] w-full",
                                            isSelfMessage
                                                ? "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500"
                                                : "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
                                        )} />

                                        <CardContent className="p-4 sm:p-5">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    {/* Yazar */}
                                                    <Link
                                                        href={`/profile/${text.author.user_year}/${text.author.school_number}`}
                                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity group/author"
                                                    >
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 group-hover/author:ring-indigo-300 transition-all">
                                                            {authorInitials}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover/author:text-indigo-600 dark:group-hover/author:text-indigo-400 transition-colors">
                                                                {text.author.first_name} {text.author.last_name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                {text.author.class} • #{text.author.school_number}
                                                            </span>
                                                        </div>
                                                    </Link>

                                                    {!isSelfMessage ? (
                                                        <>
                                                            <div className="flex items-center gap-1 px-2">
                                                                <div className="h-px w-4 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-600" />
                                                                <ArrowRight className="h-4 w-4 text-indigo-400 dark:text-indigo-500" />
                                                                <div className="h-px w-4 bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent" />
                                                            </div>

                                                            <Link
                                                                href={`/profile/${text.recipient.user_year}/${text.recipient.school_number}`}
                                                                className="flex items-center gap-2 hover:opacity-80 transition-opacity group/recipient"
                                                            >
                                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 group-hover/recipient:ring-emerald-300 transition-all">
                                                                    {recipientInitials}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover/recipient:text-emerald-600 dark:group-hover/recipient:text-emerald-400 transition-colors">
                                                                        {text.recipient.first_name} {text.recipient.last_name}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                        {text.recipient.class} • #{text.recipient.school_number}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/50 dark:border-amber-700/50 rounded-lg">
                                                            <User className="h-3 w-3 mr-1" />
                                                            Kendine Yazdı
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Aksiyonlar */}
                                                <div className="flex items-center gap-2.5">
                                                    <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(text.created_at), {
                                                            addSuffix: true,
                                                            locale: tr
                                                        })}
                                                    </span>

                                                    <Link
                                                        href={`/profile/${text.recipient.user_year}/${text.recipient.school_number}`}
                                                        className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/30 rounded-lg"
                                                                disabled={deletingId === text.id}
                                                            >
                                                                {deletingId === text.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-2xl">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Yazıyı sil?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Bu işlem geri alınamaz. Yazı kalıcı olarak silinecek.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(text.id)}
                                                                    className="bg-red-600 hover:bg-red-700 rounded-xl"
                                                                >
                                                                    Sil
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>

                                            {/* Mesaj Bilgisi */}
                                            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/30 rounded-xl p-4">
                                                <Quote className="absolute top-2 left-2 h-5 w-5 text-indigo-200/60 dark:text-indigo-800/40 transform rotate-180" />
                                                <div className="flex items-center justify-between pl-5">
                                                    <p className="text-xs text-slate-500">{text.content_length} karakter</p>
                                                    {hasReadPermission ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => fetchContent(
                                                                text.id,
                                                                false,
                                                                `${text.author.first_name} ${text.author.last_name}`,
                                                                `${text.recipient.first_name} ${text.recipient.last_name}`,
                                                                text.created_at,
                                                            )}
                                                            disabled={loadingContentId === text.id}
                                                            className="gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 h-8 text-xs rounded-lg"
                                                        >
                                                            {loadingContentId === text.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Eye className="h-3.5 w-3.5" />
                                                            )}
                                                            İçeriği Görüntüle
                                                        </Button>
                                                    ) : hasReadPermission === false ? (
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <ShieldAlert className="h-3 w-3" />
                                                            Okuma yetkisi yok
                                                        </span>
                                                    ) : null}
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
            {!isLoading && sortedItems.length > 0 && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-slate-400 dark:text-slate-500 py-4"
                >
                    {filter === 'all' && !searchQuery && !selectedClass
                        ? `Toplam ${allItems.length} yazı (${texts.length} normal, ${anonymousTexts.length} anonim)`
                        : `${sortedItems.length} / ${allItems.length} yazı gösteriliyor`
                    }
                </motion.p>
            )}

            {/* ──────────── İçerik Popup Modal ──────────── */}
            <AnimatePresence>
                {contentModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        onClick={() => setContentModal(null)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-slate-700/50"
                        >
                            {/* Header bar */}
                            <div className={cn(
                                "h-1 w-full",
                                contentModal.isAnonymous
                                    ? "bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500"
                                    : "bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500"
                            )} />

                            <div className="p-6">
                                {/* Close button */}
                                <button
                                    onClick={() => setContentModal(null)}
                                    className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                {/* Sender → Recipient */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md",
                                        contentModal.isAnonymous
                                            ? "bg-gradient-to-br from-teal-500 to-cyan-600"
                                            : "bg-gradient-to-br from-indigo-500 to-purple-600"
                                    )}>
                                        {contentModal.isAnonymous ? (
                                            <Ghost className="h-4 w-4" />
                                        ) : (
                                            contentModal.senderLabel.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {contentModal.senderLabel}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            → {contentModal.recipientLabel}
                                        </span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(contentModal.date), 'd MMMM yyyy, HH:mm', { locale: tr })}
                                    </div>
                                </div>

                                {/* Message content */}
                                <div className="overflow-y-auto max-h-[55vh] rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/30 p-5">
                                    <Quote className="h-6 w-6 text-slate-200 dark:text-slate-700 mb-2 transform rotate-180" />
                                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {contentModal.content}
                                    </p>
                                </div>

                                {/* Footer */}
                                <p className="text-[10px] text-slate-400 mt-3 text-center">
                                    Bu içeriğe eriştiğiniz kayıt ediliyor.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
