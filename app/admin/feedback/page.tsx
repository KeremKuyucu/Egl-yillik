'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    MessageSquarePlus,
    Bug,
    Lightbulb,
    AlertCircle,
    HelpCircle,
    Trash2,
    ExternalLink,
    RefreshCw,
    Loader2,
    Inbox,
    Clock,
    Globe,
    ChevronDown,
    Filter
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

interface Feedback {
    id: string
    user_id: string
    type: 'bug' | 'suggestion' | 'complaint' | 'other'
    message: string
    page_url: string | null
    user_agent: string | null
    created_at: string
    profiles: {
        first_name: string
        last_name: string
        school_number: number
    } | null
}

type FilterType = 'all' | 'bug' | 'suggestion' | 'complaint' | 'other'

const typeConfig = {
    bug: {
        label: 'Hata Bildirimi',
        shortLabel: 'Hata',
        icon: Bug,
        color: 'bg-red-500',
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
        gradient: 'from-red-500 to-rose-600'
    },
    suggestion: {
        label: 'Öneri',
        shortLabel: 'Öneri',
        icon: Lightbulb,
        color: 'bg-amber-500',
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        gradient: 'from-amber-500 to-orange-600'
    },
    complaint: {
        label: 'Şikayet',
        shortLabel: 'Şikayet',
        icon: AlertCircle,
        color: 'bg-orange-500',
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        gradient: 'from-orange-500 to-red-600'
    },
    other: {
        label: 'Diğer',
        shortLabel: 'Diğer',
        icon: HelpCircle,
        color: 'bg-blue-500',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        gradient: 'from-blue-500 to-indigo-600'
    },
}

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterType>('all')

    const fetchFeedbacks = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('feedback')
                .select(`
                    *,
                    profiles:user_id (
                        first_name,
                        last_name,
                        school_number
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setFeedbacks(data || [])
        } catch (error) {
            console.error('Feedback fetch error:', error)
            toast.error('Geri bildirimler yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFeedbacks()
    }, [])

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const supabase = createClient()

            // RPC ile soft delete
            const { data, error } = await supabase
                .rpc('soft_delete_feedback', { feedback_id: id })

            if (error) throw error

            setFeedbacks(prev => prev.filter(f => f.id !== id))
            toast.success('Geri bildirim silindi')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Silinemedi')
        } finally {
            setDeletingId(null)
        }
    }

    const filteredFeedbacks = filter === 'all'
        ? feedbacks
        : feedbacks.filter(f => f.type === filter)

    const stats = {
        total: feedbacks.length,
        bug: feedbacks.filter(f => f.type === 'bug').length,
        suggestion: feedbacks.filter(f => f.type === 'suggestion').length,
        complaint: feedbacks.filter(f => f.type === 'complaint').length,
        other: feedbacks.filter(f => f.type === 'other').length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-6 sm:p-8 text-white shadow-2xl shadow-rose-500/25">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <MessageSquarePlus className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Geri Bildirimler</h1>
                            <p className="text-white/80 text-sm mt-1">
                                Kullanıcılardan gelen tüm geri bildirimler
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={fetchFeedbacks}
                        disabled={isLoading}
                        className="gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Yenile</span>
                    </Button>
                </div>

                {/* Stats in Header */}
                <div className="relative grid grid-cols-5 gap-2 sm:gap-4 mt-6">
                    {[
                        { key: 'total', label: 'Toplam', value: stats.total, color: 'bg-white/20' },
                        { key: 'bug', label: 'Hata', value: stats.bug, color: 'bg-red-500/30' },
                        { key: 'suggestion', label: 'Öneri', value: stats.suggestion, color: 'bg-amber-500/30' },
                        { key: 'complaint', label: 'Şikayet', value: stats.complaint, color: 'bg-orange-500/30' },
                        { key: 'other', label: 'Diğer', value: stats.other, color: 'bg-blue-500/30' },
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

            {/* Filter Bar - Mobile */}
            <div className="flex sm:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                {filter === 'all' ? 'Tümü' : typeConfig[filter as keyof typeof typeConfig].label}
                            </div>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuItem onClick={() => setFilter('all')}>
                            Tümü ({stats.total})
                        </DropdownMenuItem>
                        {Object.entries(typeConfig).map(([key, config]) => (
                            <DropdownMenuItem key={key} onClick={() => setFilter(key as FilterType)}>
                                <config.icon className="h-4 w-4 mr-2" />
                                {config.label} ({stats[key as keyof typeof stats]})
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Feedback List */}
            {isLoading ? (
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="h-40 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
                    ))}
                </div>
            ) : filteredFeedbacks.length === 0 ? (
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <Inbox className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            {filter === 'all' ? 'Henüz geri bildirim yok' : 'Bu kategoride geri bildirim yok'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            {filter === 'all'
                                ? 'Kullanıcılar geri bildirim gönderdiğinde burada görünecek'
                                : 'Farklı bir kategori deneyin veya tümünü görüntüleyin'
                            }
                        </p>
                        {filter !== 'all' && (
                            <Button variant="outline" className="mt-4" onClick={() => setFilter('all')}>
                                Tümünü Göster
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredFeedbacks.map((feedback) => {
                        const config = typeConfig[feedback.type]
                        const Icon = config.icon
                        const userName = feedback.profiles
                            ? `${feedback.profiles.first_name} ${feedback.profiles.last_name}`
                            : 'Anonim'
                        const schoolNumber = feedback.profiles?.school_number || '-'

                        return (
                            <Card
                                key={feedback.id}
                                className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                            >
                                {/* Type indicator bar */}
                                <div className={cn("h-1 w-full bg-gradient-to-r", config.gradient)} />

                                <CardContent className="p-4 sm:p-6">
                                    {/* Header Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {/* Type Badge */}
                                            <Badge className={cn("gap-1.5 border", config.badgeColor)}>
                                                <Icon className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">{config.label}</span>
                                                <span className="sm:hidden">{config.shortLabel}</span>
                                            </Badge>

                                            {/* User Info */}
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                    {userName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{userName}</span>
                                                <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                                    #{schoolNumber}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatDistanceToNow(new Date(feedback.created_at), {
                                                    addSuffix: true,
                                                    locale: tr
                                                })}
                                            </span>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        disabled={deletingId === feedback.id}
                                                    >
                                                        {deletingId === feedback.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Geri bildirimi sil?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bu işlem geri alınamaz. Geri bildirim kalıcı olarak silinecek.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(feedback.id)}
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
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                                        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {feedback.message}
                                        </p>
                                    </div>

                                    {/* Footer - Page URL */}
                                    {feedback.page_url && (
                                        <a
                                            href={feedback.page_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg"
                                        >
                                            <Globe className="h-3.5 w-3.5" />
                                            <span className="truncate max-w-[250px] sm:max-w-none">
                                                {feedback.page_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                            </span>
                                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Results count */}
            {!isLoading && filteredFeedbacks.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                    {filter === 'all'
                        ? `Toplam ${feedbacks.length} geri bildirim`
                        : `${filteredFeedbacks.length} / ${feedbacks.length} geri bildirim gösteriliyor`
                    }
                </p>
            )}
        </div>
    )
}
