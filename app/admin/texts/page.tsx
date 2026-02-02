'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    FileText,
    Trash2,
    RefreshCw,
    Loader2,
    Inbox,
    Clock,
    ChevronDown,
    Filter,
    Search,
    User,
    ArrowRight,
    Quote,
    ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
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
import { useRequireSuperAdmin } from '@/lib/auth-client'

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
    content: string
    created_at: string
    author: Profile
    recipient: Profile
}

type FilterType = 'all' | 'self' | 'others'

export default function AdminTextsPage() {
    const [texts, setTexts] = useState<Text[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterType>('all')
    const [searchQuery, setSearchQuery] = useState('')

    useRequireSuperAdmin()

    const fetchTexts = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_texts')

            if (error) throw error
            setTexts(data || [])
        } catch (error) {
            console.error('Texts fetch error:', error)
            toast.error('Yazılar yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTexts()
    }, [])

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const supabase = createClient()

            // RPC ile soft delete
            const { data, error } = await supabase
                .rpc('soft_delete_text', { target_text_id: id })

            if (error) throw error

            if (data && !data.success) {
                throw new Error(data.error || 'Silme başarısız')
            }

            setTexts(prev => prev.filter(t => t.id !== id))
            toast.success('Yazı silindi')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Silinemedi')
        } finally {
            setDeletingId(null)
        }
    }

    // Filtreleme
    const filteredTexts = texts.filter(text => {
        // Arama filtresi
        const authorName = `${text.author.first_name} ${text.author.last_name}`.toLowerCase()
        const recipientName = `${text.recipient.first_name} ${text.recipient.last_name}`.toLowerCase()
        const content = text.content.toLowerCase()
        const query = searchQuery.toLowerCase()

        const matchesSearch = searchQuery === '' ||
            authorName.includes(query) ||
            recipientName.includes(query) ||
            content.includes(query) ||
            text.author.school_number.includes(query) ||
            text.recipient.school_number.includes(query)

        // Tip filtresi
        const isSelfMessage = text.author.id === text.recipient.id
        const matchesFilter =
            filter === 'all' ||
            (filter === 'self' && isSelfMessage) ||
            (filter === 'others' && !isSelfMessage)

        return matchesSearch && matchesFilter
    })

    const stats = {
        total: texts.length,
        self: texts.filter(t => t.author.id === t.recipient.id).length,
        others: texts.filter(t => t.author.id !== t.recipient.id).length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/25">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Yazılar</h1>
                            <p className="text-white/80 text-sm mt-1">
                                Kullanıcıların birbirlerine yazdığı tüm mesajlar
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={fetchTexts}
                        disabled={isLoading}
                        className="gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Yenile</span>
                    </Button>
                </div>

                {/* Stats in Header */}
                <div className="relative grid grid-cols-3 gap-2 sm:gap-4 mt-6">
                    {[
                        { key: 'all', label: 'Toplam', value: stats.total, color: 'bg-white/20' },
                        { key: 'self', label: 'Kendine Yazılan', value: stats.self, color: 'bg-amber-500/30' },
                        { key: 'others', label: 'Başkasına Yazılan', value: stats.others, color: 'bg-emerald-500/30' },
                    ].map((stat) => (
                        <button
                            key={stat.key}
                            onClick={() => setFilter(stat.key as FilterType)}
                            className={cn(
                                "p-2 sm:p-3 rounded-xl backdrop-blur-sm transition-all duration-200 text-center",
                                stat.color,
                                filter === stat.key
                                    ? "ring-2 ring-white shadow-lg scale-105"
                                    : "hover:ring-1 hover:ring-white/50"
                            )}
                        >
                            <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                            <p className="text-[10px] sm:text-xs text-white/80 truncate">{stat.label}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Yazar, alıcı veya içerik ara..."
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filter Bar - Mobile */}
            <div className="flex sm:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                {filter === 'all' ? 'Tümü' : filter === 'self' ? 'Kendine Yazılan' : 'Başkasına Yazılan'}
                            </div>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuItem onClick={() => setFilter('all')}>
                            Tümü ({stats.total})
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter('self')}>
                            Kendine Yazılan ({stats.self})
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter('others')}>
                            Başkasına Yazılan ({stats.others})
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Texts List */}
            {isLoading ? (
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="h-40 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
                    ))}
                </div>
            ) : filteredTexts.length === 0 ? (
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <Inbox className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            {searchQuery ? 'Arama sonucu bulunamadı' : filter === 'all' ? 'Henüz yazı yok' : 'Bu kategoride yazı yok'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            {searchQuery
                                ? 'Farklı bir arama terimi deneyin'
                                : filter === 'all'
                                    ? 'Kullanıcılar yazı yazdığında burada görünecek'
                                    : 'Farklı bir kategori deneyin veya tümünü görüntüleyin'
                            }
                        </p>
                        {(filter !== 'all' || searchQuery) && (
                            <Button variant="outline" className="mt-4" onClick={() => { setFilter('all'); setSearchQuery(''); }}>
                                Tümünü Göster
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredTexts.map((text) => {
                        const isSelfMessage = text.author.id === text.recipient.id
                        const authorInitials = `${text.author.first_name[0]}${text.author.last_name[0]}`.toUpperCase()
                        const recipientInitials = `${text.recipient.first_name[0]}${text.recipient.last_name[0]}`.toUpperCase()

                        return (
                            <Card
                                key={text.id}
                                className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                            >
                                {/* Type indicator bar */}
                                <div className={cn(
                                    "h-1 w-full bg-gradient-to-r",
                                    isSelfMessage ? "from-amber-500 to-orange-600" : "from-emerald-500 to-teal-600"
                                )} />

                                <CardContent className="p-4 sm:p-6">
                                    {/* Header Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        {/* Author -> Recipient */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Author */}
                                            <Link
                                                href={`/profile/${text.author.user_year}/${text.author.school_number}`}
                                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                            >
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                    {authorInitials}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                                        {text.author.first_name} {text.author.last_name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {text.author.class} • #{text.author.school_number}
                                                    </span>
                                                </div>
                                            </Link>

                                            {!isSelfMessage && (
                                                <>
                                                    {/* Arrow */}
                                                    <ArrowRight className="h-4 w-4 text-slate-400 mx-1" />

                                                    {/* Recipient */}
                                                    <Link
                                                        href={`/profile/${text.recipient.user_year}/${text.recipient.school_number}`}
                                                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                    >
                                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                            {recipientInitials}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                                                {text.recipient.first_name} {text.recipient.last_name}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {text.recipient.class} • #{text.recipient.school_number}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </>
                                            )}

                                            {isSelfMessage && (
                                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                                    <User className="h-3 w-3 mr-1" />
                                                    Kendine Yazdı
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatDistanceToNow(new Date(text.created_at), {
                                                    addSuffix: true,
                                                    locale: tr
                                                })}
                                            </span>

                                            <Link
                                                href={`/profile/${text.recipient.user_year}/${text.recipient.school_number}`}
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        disabled={deletingId === text.id}
                                                    >
                                                        {deletingId === text.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Yazıyı sil?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bu işlem geri alınamaz. Yazı kalıcı olarak silinecek.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(text.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Sil
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                        <Quote className="absolute -top-2 -left-2 h-6 w-6 text-indigo-200 dark:text-indigo-800 transform rotate-180" />
                                        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-4 italic">
                                            {text.content}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Results count */}
            {!isLoading && filteredTexts.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                    {filter === 'all' && !searchQuery
                        ? `Toplam ${texts.length} yazı`
                        : `${filteredTexts.length} / ${texts.length} yazı gösteriliyor`
                    }
                </p>
            )}
        </div>
    )
}
