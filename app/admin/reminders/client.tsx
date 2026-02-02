"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { sendBulkUsersReminders } from "./actions"
import { toast } from "sonner"
import {
    Loader2,
    Mail,
    CheckCircle,
    AlertCircle,
    Users,
    Search,
    BarChart3,
    Send,
    CheckCheck,
    AlertTriangle,
    Sparkles,
    X,
    Vote,
    PenLine,
    BellOff
} from "lucide-react"

import { getColorFromName } from "@/lib/survey-categories"
import { AutoReminderSettings } from "@/components/admin/auto-reminder-settings"

import { UserWithStats, FilterStatus, FilterClass, EmailStatus } from "@/types/reminder"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

interface ReminderClientPageProps {
    users: UserWithStats[]
}

export default function ReminderClientPage({ users }: ReminderClientPageProps) {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [isSending, setIsSending] = useState(false)
    const [results, setResults] = useState<Record<string, EmailStatus>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [filterClass, setFilterClass] = useState<FilterClass>('all')

    // Hesaplanan istatistikler
    const stats = useMemo(() => {
        const total = users.length
        const withEmail = users.filter(u => u.email).length

        // Yazı istatistikleri
        const textsCompleted = users.filter(u => u.stats?.remaining_classmates === 0).length
        const textsIncomplete = users.filter(u => u.stats?.remaining_classmates > 0).length

        // Anket istatistikleri
        const surveysCompleted = users.filter(u => u.surveyStats?.remaining === 0).length
        const surveysIncomplete = users.filter(u => u.surveyStats?.remaining > 0).length

        // İkisini de tamamlayanlar
        const fullyCompleted = users.filter(u =>
            u.stats?.remaining_classmates === 0 && u.surveyStats?.remaining === 0
        ).length

        // Herhangi biri eksik
        const anyIncomplete = users.filter(u =>
            (u.stats?.remaining_classmates > 0) || (u.surveyStats?.remaining > 0)
        ).length

        // Sınıf bazlı
        const byClass: Record<string, { total: number, textsComplete: number, surveysComplete: number }> = {}
        users.forEach(u => {
            if (!byClass[u.class]) {
                byClass[u.class] = { total: 0, textsComplete: 0, surveysComplete: 0 }
            }
            byClass[u.class].total++
            if (u.stats?.remaining_classmates === 0) {
                byClass[u.class].textsComplete++
            }
            if (u.surveyStats?.remaining === 0) {
                byClass[u.class].surveysComplete++
            }
        })

        return {
            total,
            withEmail,
            textsCompleted,
            textsIncomplete,
            surveysCompleted,
            surveysIncomplete,
            fullyCompleted,
            anyIncomplete,
            byClass
        }
    }, [users])

    // Filtrelenmiş kullanıcılar
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Arama
            const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
            if (searchQuery && !fullName.includes(searchQuery.toLowerCase()) && !user.email?.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }

            // Sınıf filtresi
            if (filterClass !== 'all' && user.class !== filterClass) {
                return false
            }

            // Durum filtresi
            switch (filterStatus) {
                case 'texts_complete':
                    if (user.stats?.remaining_classmates !== 0) return false
                    break
                case 'texts_incomplete':
                    if (user.stats?.remaining_classmates === 0) return false
                    break
                case 'survey_incomplete':
                    if (user.surveyStats?.remaining === 0) return false
                    break
                case 'any_incomplete':
                    if (user.stats?.remaining_classmates === 0 && user.surveyStats?.remaining === 0) return false
                    break
            }

            return true
        })
    }, [users, searchQuery, filterClass, filterStatus])

    const toggleSelectAll = () => {
        const filteredIds = filteredUsers
            .filter(u => !u.is_opted_out) // Opted-out olanları seçme
            .map(u => u.id)
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUsers.includes(id))

        if (allSelected) {
            setSelectedUsers(prev => prev.filter(id => !filteredIds.includes(id)))
        } else {
            setSelectedUsers(prev => [...new Set([...prev, ...filteredIds])])
        }
    }

    const toggleUser = (id: string) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(u => u !== id))
        } else {
            setSelectedUsers([...selectedUsers, id])
        }
    }

    const selectAnyIncomplete = () => {
        const incompleteIds = users
            .filter(u => ((u.stats?.remaining_classmates > 0) || (u.surveyStats?.remaining > 0)) && u.email && !u.is_opted_out)
            .map(u => u.id)
        setSelectedUsers(incompleteIds)
        toast.success(`${incompleteIds.length} eksik işi olan kullanıcı seçildi`)
    }

    const handleSendEmails = async () => {
        if (selectedUsers.length === 0) return

        if (!confirm(`${selectedUsers.length} kullanıcıya mail gönderilecek. Onaylıyor musunuz?`)) return

        setIsSending(true)
        const currentResults = { ...results }

        // Hepsini pending yap
        selectedUsers.forEach(id => currentResults[id] = 'pending')
        setResults(currentResults)

        try {
            // Bulk gönderim (Server-Side)
            const response = await sendBulkUsersReminders(selectedUsers)

            if (response.error) {
                toast.error(response.error)
                // Hepsini hata olarak işaretle
                selectedUsers.forEach(id => currentResults[id] = 'error')
                setResults({ ...currentResults })
            } else if (response.results) {
                let sent = 0
                let errors = 0

                Object.entries(response.results).forEach(([userId, res]) => {
                    currentResults[userId] = res.success ? 'success' : 'error'
                    if (res.success) sent++
                    else errors++
                })

                setResults({ ...currentResults })

                if (errors === 0) {
                    toast.success(`🎉 ${sent} mail başarıyla gönderildi!`)
                } else {
                    toast.warning(`İşlem tamamlandı. Başarılı: ${sent}, Hata: ${errors}`)
                }
            }
        } catch (error) {
            console.error(error)
            toast.error("Beklenmeyen bir hata oluştu")
        } finally {
            setIsSending(false)
        }
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase()
    }

    // Opted-out olmayan kullanıcıların tümü seçili mi kontrolü
    const selectableUsers = filteredUsers.filter(u => !u.is_opted_out)
    const allFilteredSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUsers.includes(u.id))

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="sticky top-20 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white shadow-lg shadow-emerald-500/20">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Mail Hatırlatma</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Kullanıcılara durum bildirimleri gönderin
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Users className="h-4 w-4" />
                        <span>{selectedUsers.length} kişi seçildi</span>
                    </div>
                    <Button
                        onClick={handleSendEmails}
                        disabled={isSending || selectedUsers.length === 0}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">Gönderiliyor...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                <span>Mail Gönder</span>
                                {selectedUsers.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                                        {selectedUsers.length}
                                    </Badge>
                                )}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Otomatik Hatırlatıcı Ayarları */}
            <AutoReminderSettings />

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Toplam</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <PenLine className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.textsCompleted}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Yazı Tamamladı</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                            <Vote className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.surveysCompleted}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Anket Tamamladı</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.anyIncomplete}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Eksik İşi Var</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                            <CheckCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.fullyCompleted}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Her Şey Tamam</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sınıf Bazlı İstatistikler */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        Sınıf Bazlı İstatistikler
                    </h3>
                    {filterClass !== 'all' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterClass('all')}
                            className="text-xs h-7 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Filtreyi Temizle ({filterClass})
                        </Button>
                    )}
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={Object.entries(stats.byClass)
                                .sort()
                                .map(([className, data]) => ({
                                    name: className,
                                    'Makale': data.textsComplete,
                                    'Anket': data.surveysComplete,
                                    'Toplam': data.total
                                }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            onClick={(data) => {
                                if (data && data.activeLabel) {
                                    setFilterClass(filterClass === data.activeLabel as FilterClass ? 'all' : data.activeLabel as FilterClass)
                                }
                            }}
                            className="cursor-pointer"
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6b7280' }}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6b7280' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar
                                dataKey="Makale"
                                name="Yazı Tamamlanan"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                dataKey="Anket"
                                name="Anket Tamamlanan"
                                fill="#8b5cf6"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                dataKey="Toplam"
                                name="Toplam Öğrenci"
                                fill="#cbd5e1"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                                opacity={0.3}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">
                    Detaylarını görmek veya filtrelemek için bir sınıfın sütununa tıklayın
                </p>
            </div>

            {/* Filtreler ve Arama */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Arama */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="İsim veya email ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>

                        {/* Hızlı Seçim */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAnyIncomplete}
                            className="gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-10"
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>Eksikleri Seç</span>
                        </Button>
                    </div>

                    {/* Durum Filtresi */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filterStatus === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('all')}
                            className={filterStatus === 'all' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : ''}
                        >
                            Tümü
                        </Button>
                        <Button
                            variant={filterStatus === 'any_incomplete' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('any_incomplete')}
                            className={filterStatus === 'any_incomplete' ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : 'text-amber-600 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'}
                        >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Herhangi Eksik
                        </Button>
                        <Button
                            variant={filterStatus === 'texts_incomplete' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('texts_incomplete')}
                            className={filterStatus === 'texts_incomplete' ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' : 'text-orange-600 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30'}
                        >
                            <PenLine className="h-3 w-3 mr-1" />
                            Yazı Eksik
                        </Button>
                        <Button
                            variant={filterStatus === 'survey_incomplete' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('survey_incomplete')}
                            className={filterStatus === 'survey_incomplete' ? 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500' : 'text-purple-600 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30'}
                        >
                            <Vote className="h-3 w-3 mr-1" />
                            Anket Eksik
                        </Button>
                        <Button
                            variant={filterStatus === 'texts_complete' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus('texts_complete')}
                            className={filterStatus === 'texts_complete' ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' : 'text-emerald-600 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Yazı Tamam
                        </Button>
                    </div>
                </div>

                {/* Aktif Filtreler */}
                {(filterClass !== 'all' || searchQuery) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {filterClass !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                                {filterClass}
                                <button onClick={() => setFilterClass('all')}>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {searchQuery && (
                            <Badge variant="secondary" className="gap-1">
                                "{searchQuery}"
                                <button onClick={() => setSearchQuery('')}>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Kullanıcı Listesi */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={allFilteredSelected && filteredUsers.length > 0}
                            onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {filteredUsers.length} kullanıcı gösteriliyor
                        </span>
                    </div>
                    {selectedUsers.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUsers([])}
                            className="text-slate-500"
                        >
                            Veriyi Temizle
                        </Button>
                    )}
                </div>
                {/* Yapımcı GitHub:KeremKuyucu */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                    {filteredUsers.map((user) => {
                        const isSelected = selectedUsers.includes(user.id)
                        const status = results[user.id]
                        const textStats = user.stats
                        const surveyStats = user.surveyStats
                        const isTextComplete = textStats?.remaining_classmates === 0
                        const isSurveyComplete = surveyStats?.remaining === 0

                        return (
                            <div
                                key={user.id}
                                className={`p-4 flex items-center gap-4 transition-colors ${isSelected
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleUser(user.id)}
                                    disabled={user.is_opted_out}
                                />

                                {/* Avatar */}
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${getColorFromName(user.first_name)}`}>
                                    {getInitials(user.first_name, user.last_name)}
                                </div>

                                {/* İsim ve Email */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        {user.is_opted_out && (
                                            <Badge variant="secondary" className="bg-red-100 text-red-600 border-red-200 text-[10px] h-4 px-1">
                                                <BellOff className="h-2 w-2 mr-1" /> İstemiyor
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">
                                            {user.class}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">
                                        {user.email || <span className="text-red-400">Email yok</span>}
                                    </p>
                                </div>

                                {/* Yazı İstatistiği */}
                                <div className="flex flex-col items-center gap-1 min-w-[70px] sm:min-w-[80px]">
                                    <div className="flex items-center gap-1.5">
                                        <PenLine className={`h-3.5 w-3.5 ${isTextComplete ? 'text-emerald-500' : 'text-amber-500'}`} />
                                        <span className={`text-sm font-bold ${isTextComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {textStats ? `${textStats.messages_sent_to_classmates}/${textStats.total_classmates}` : '-'}
                                        </span>
                                    </div>
                                    {textStats && (
                                        <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isTextComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                style={{ width: `${textStats.completion_percentage}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Anket İstatistiği */}
                                <div className="flex flex-col items-center gap-1 min-w-[70px] sm:min-w-[80px]">
                                    <div className="flex items-center gap-1.5">
                                        <Vote className={`h-3.5 w-3.5 ${isSurveyComplete ? 'text-purple-500' : 'text-purple-400'}`} />
                                        <span className={`text-sm font-bold ${isSurveyComplete ? 'text-purple-600' : 'text-purple-400'}`}>
                                            {surveyStats ? `${surveyStats.completed}/${surveyStats.total}` : '-'}
                                        </span>
                                    </div>
                                    {surveyStats && (
                                        <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isSurveyComplete ? 'bg-purple-500' : 'bg-purple-300'}`}
                                                style={{ width: `${surveyStats.percentage}%` }}
                                            />
                                        </div>
                                    )}
                                </div>



                                {/* Gönderim Durumu */}
                                <div className="w-8 flex justify-center">
                                    {status === 'success' && <CheckCircle className="text-emerald-500 h-5 w-5" />}
                                    {status === 'error' && <AlertCircle className="text-red-500 h-5 w-5" />}
                                    {status === 'pending' && <Loader2 className="text-blue-500 h-5 w-5 animate-spin" />}
                                </div>
                            </div>
                        )
                    })}

                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">Kullanıcı bulunamadı</p>
                            <p className="text-sm mt-1">Filtrelerinizi değiştirin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
