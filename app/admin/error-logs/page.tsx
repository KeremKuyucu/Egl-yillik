'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Activity,
    Bug,
    AlertTriangle,
    ShieldAlert,
    Trash2,
    RefreshCw,
    Loader2,
    Clock,
    Globe,
    Monitor,
    ChevronDown,
    Filter,
    CheckCircle2,
    Terminal
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

interface ErrorLog {
    id: string
    user_id: string | null
    error_message: string
    stack_trace: string | null
    page_url: string | null
    user_agent: string | null
    severity: 'error' | 'warning' | 'critical'
    is_resolved: boolean
    created_at: string
    profiles: {
        first_name: string
        last_name: string
        school_number: number
    } | null
}

const severityConfig = {
    error: {
        label: 'Hata',
        icon: Bug,
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
        gradient: 'from-red-500 to-rose-600'
    },
    warning: {
        label: 'Uyarı',
        icon: AlertTriangle,
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        gradient: 'from-amber-500 to-orange-600'
    },
    critical: {
        label: 'Kritik',
        icon: ShieldAlert,
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        gradient: 'from-purple-600 to-indigo-700'
    }
}

export default function AdminErrorLogsPage() {
    const [logs, setLogs] = useState<ErrorLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [resolvingId, setResolvingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            let query = supabase
                .from('error_logs')
                .select(`
                    *,
                    profiles:user_id (
                        first_name,
                        last_name,
                        school_number
                    )
                `)
                .order('created_at', { ascending: false })

            if (filter === 'unresolved') query = query.eq('is_resolved', false)
            if (filter === 'resolved') query = query.eq('is_resolved', true)

            const { data, error } = await query

            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error('Logs fetch error:', error)
            toast.error('Hata logları yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [filter])

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('error_logs')
                .delete()
                .eq('id', id)

            if (error) throw error
            setLogs(prev => prev.filter(l => l.id !== id))
            toast.success('Log silindi')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Silinemedi')
        } finally {
            setDeletingId(null)
        }
    }

    const handleToggleResolve = async (id: string, currentStatus: boolean) => {
        setResolvingId(id)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('error_logs')
                .update({ is_resolved: !currentStatus })
                .eq('id', id)

            if (error) throw error

            if (filter !== 'all') {
                setLogs(prev => prev.filter(l => l.id !== id))
            } else {
                setLogs(prev => prev.map(l => l.id === id ? { ...l, is_resolved: !currentStatus } : l))
            }

            toast.success(!currentStatus ? 'Çözüldü olarak işaretlendi' : 'Çözülmedi olarak işaretlendi')
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Güncellenemedi')
        } finally {
            setResolvingId(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 sm:p-8 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
                            <Activity className="h-7 w-7 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Sistem Hata Logları</h1>
                            <p className="text-white/60 text-sm mt-1">
                                Uygulama genelinde otomatik yakalanan hatalar
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/10 text-white gap-2">
                                    <Filter className="h-4 w-4" />
                                    {filter === 'all' && 'Tüm Kayıtlar'}
                                    {filter === 'unresolved' && 'Çözülmemişler'}
                                    {filter === 'resolved' && 'Çözülmüşler'}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setFilter('unresolved')}>Çözülmemişler</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter('resolved')}>Çözülmüşler</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter('all')}>Tüm Kayıtlar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="secondary"
                            onClick={fetchLogs}
                            disabled={isLoading}
                            className="bg-indigo-500 hover:bg-indigo-600 border-0 text-white"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse bg-slate-100 dark:bg-slate-800/50" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            Harika! Kayıt bulunamadı.
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Şu anda sistemde çözülmemiş herhangi bir hata kaydı bulunmuyor.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {logs.map((log) => {
                        const config = severityConfig[log.severity]
                        const Icon = config.icon
                        const userName = log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'Misafir'

                        return (
                            <Card key={log.id} className={cn(
                                "border-0 shadow-xl overflow-hidden group transition-all duration-300",
                                log.is_resolved ? "opacity-60 grayscale-[0.5]" : "hover:ring-2 ring-indigo-500/20"
                            )}>
                                <div className={cn("h-1.5 w-full bg-gradient-to-r", config.gradient)} />
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Badge className={cn("gap-1.5 font-bold", config.badge)}>
                                                <Icon className="h-3.5 w-3.5" />
                                                {config.label}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: tr })}
                                            </span>
                                            {log.is_resolved && (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Çözüldü
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5"
                                                onClick={() => handleToggleResolve(log.id, log.is_resolved)}
                                                disabled={resolvingId === log.id}
                                            >
                                                {resolvingId === log.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {log.is_resolved ? 'Geri Al' : 'Çözüldü İşaretle'}
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Log kaydını sil?</AlertDialogTitle>
                                                        <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(log.id)} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                            {log.error_message}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 mt-3">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                <Globe className="h-3 w-3" />
                                                <span className="truncate max-w-[200px]">{log.page_url || '/'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                <Monitor className="h-3 w-3" />
                                                <span>{userName} {log.profiles?.school_number ? `(#${log.profiles.school_number})` : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    {log.stack_trace && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                <Terminal className="h-3.5 w-3.5" /> Stack Trace
                                            </div>
                                            <div className="relative group/stack">
                                                <pre className="text-[11px] font-mono bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto max-h-[300px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                                                    {log.stack_trace}
                                                </pre>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover/stack:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-7 text-[10px] bg-slate-800 text-white"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(log.stack_trace || '')
                                                            toast.success('Kopyalandı')
                                                        }}
                                                    >
                                                        Kopyala
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {log.user_agent && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                                                UA: {log.user_agent}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
