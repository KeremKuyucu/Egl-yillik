"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, Save, Loader2, AlertCircle, MessageSquare, Vote, UserPlus, GraduationCap, LockOpen, Construction, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { updateDeadline, getSettingsAction, updateToggleSetting, updateGraduationDate, updateTextSetting } from "@/app/admin/settings/actions"

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true)

    // Deadline States
    const [savingDeadline, setSavingDeadline] = useState(false)
    const [deadlineDate, setDeadlineDate] = useState("")
    const [deadlineTime, setDeadlineTime] = useState("23:59")
    const [currentDeadline, setCurrentDeadline] = useState<Date | null>(null)

    // Graduation States
    const [savingGraduation, setSavingGraduation] = useState(false)
    const [graduationDate, setGraduationDate] = useState("")
    const [currentGraduationDate, setCurrentGraduationDate] = useState<Date | null>(null)

    // Toggle states
    const [savingToggle, setSavingToggle] = useState<string | null>(null)
    const [messagingEnabled, setMessagingEnabled] = useState(true)
    const [votingEnabled, setVotingEnabled] = useState(true)
    const [registrationEnabled, setRegistrationEnabled] = useState(true)
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [announcementEnabled, setAnnouncementEnabled] = useState(false)

    // Announcement States
    const [savingAnnouncement, setSavingAnnouncement] = useState(false)
    const [announcementMessage, setAnnouncementMessage] = useState("")



    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const result = await getSettingsAction()
            if (result.success && result.data) {
                const settings = result.data

                // Deadline
                if (settings.deadline) {
                    const date = new Date(settings.deadline)
                    setCurrentDeadline(date)
                    setDeadlineDate(date.toISOString().split('T')[0])
                    setDeadlineTime(date.toTimeString().slice(0, 5))
                }

                // Graduation Date
                if (settings.graduation_date) {
                    const date = new Date(settings.graduation_date)
                    setCurrentGraduationDate(date)
                    setGraduationDate(date.toISOString().split('T')[0])
                }

                // Toggles
                setMessagingEnabled(settings.messaging_enabled !== 'false')
                setVotingEnabled(settings.voting_enabled !== 'false')
                setRegistrationEnabled(settings.registration_enabled !== 'false')
                setMaintenanceMode(settings.maintenance_mode === 'true')
                setAnnouncementEnabled(settings.announcement_enabled === 'true')

                // Text Settings
                setAnnouncementMessage(settings.announcement_message || "")
                setAnnouncementMessage(settings.announcement_message || "")
            }
        } catch (error) {
            toast.error("Ayarlar yüklenirken hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveDeadline = async () => {
        if (!deadlineDate) {
            toast.error("Lütfen bir tarih seçin")
            return
        }

        setSavingDeadline(true)
        try {
            const dateTimeString = `${deadlineDate}T${deadlineTime}:00`
            const result = await updateDeadline(dateTimeString)

            if (result.success) {
                toast.success("Son teslim tarihi güncellendi!", {
                    description: new Date(dateTimeString).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                })
                setCurrentDeadline(new Date(dateTimeString))
            } else {
                toast.error("Hata", { description: result.error })
            }
        } finally {
            setSavingDeadline(false)
        }
    }

    const handleSaveGraduationDate = async () => {
        if (!graduationDate) {
            toast.error("Lütfen bir mezuniyet tarihi seçin")
            return
        }

        setSavingGraduation(true)
        try {
            // Sadece tarih olarak kaydediyoruz, saat önemli değil veya 00:00 olabilir
            // UTC vs yerel saat farkını minimize etmek için o günün öğlen saatini seçebiliriz veya olduğu gibi
            const dateString = `${graduationDate}T12:00:00`
            const result = await updateGraduationDate(dateString)

            if (result.success) {
                toast.success("Mezuniyet tarihi güncellendi!", {
                    description: new Date(dateString).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })
                })
                setCurrentGraduationDate(new Date(dateString))
            } else {
                toast.error("Hata", { description: result.error })
            }
        } finally {
            setSavingGraduation(false)
        }
    }

    const handleToggleChange = async (key: string, value: boolean, setter: (v: boolean) => void) => {
        setSavingToggle(key)
        try {
            const result = await updateToggleSetting(key, value)
            if (result.success) {
                setter(value)
                const labels: Record<string, string> = {
                    messaging_enabled: 'Mesaj yazma',
                    voting_enabled: 'Oylama',
                    registration_enabled: 'Kayıt',
                    maintenance_mode: 'Bakım modu',
                    announcement_enabled: 'Duyuru bannerı'
                }
                toast.success(`${labels[key]} ${value ? 'açıldı' : 'kapatıldı'}`)
            } else {
                toast.error("Hata", { description: result.error })
            }
        } finally {
            setSavingToggle(null)
        }
    }

    const handleSaveAnnouncement = async () => {
        setSavingAnnouncement(true)
        try {
            const result = await updateTextSetting('announcement_message', announcementMessage)
            if (result.success) {
                toast.success("Duyuru metni güncellendi")
            } else {
                toast.error("Hata", { description: result.error })
            }
        } finally {
            setSavingAnnouncement(false)
        }
    }

    const previewDeadlineDate = deadlineDate && deadlineTime
        ? new Date(`${deadlineDate}T${deadlineTime}:00`)
        : null

    const daysUntilDeadline = previewDeadlineDate
        ? Math.ceil((previewDeadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null

    const previewGraduationDate = graduationDate
        ? new Date(`${graduationDate}T12:00:00`)
        : null

    // Mezuniyet tarihine kalan gün
    const daysUntilGraduation = previewGraduationDate
        ? Math.ceil((previewGraduationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Yükleniyor...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Sayfa Başlığı */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                    Site Ayarları
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Yıllık sistemi için genel ayarları yönetin
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deadline Card */}
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5" />

                    <CardHeader className="relative pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    Yazı Son Teslim
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Anı yazma işlemi bu tarihte kapanır
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="relative space-y-4 pt-2">
                        {currentDeadline && (
                            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Mevcut:</div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                    {currentDeadline.toLocaleDateString('tr-TR', {
                                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-1">
                                <Label htmlFor="deadline-date" className="text-xs mb-1.5 block">Tarih</Label>
                                <Input
                                    id="deadline-date"
                                    type="date"
                                    value={deadlineDate}
                                    onChange={(e) => setDeadlineDate(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="col-span-1">
                                <Label htmlFor="deadline-time" className="text-xs mb-1.5 block">Saat</Label>
                                <Input
                                    id="deadline-time"
                                    type="time"
                                    value={deadlineTime}
                                    onChange={(e) => setDeadlineTime(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        {daysUntilDeadline !== null && (
                            <div className={`text-sm font-medium flex items-center gap-2 ${daysUntilDeadline <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <AlertCircle className="h-4 w-4" />
                                {daysUntilDeadline <= 0 ? 'Süre dolmuş' : `${daysUntilDeadline} gün kaldı`}
                            </div>
                        )}

                        <Button
                            onClick={handleSaveDeadline}
                            disabled={savingDeadline || !deadlineDate}
                            size="sm"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {savingDeadline ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Güncelle
                        </Button>
                    </CardContent>
                </Card>

                {/* Graduation Date Card */}
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />

                    <CardHeader className="relative pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    Mezuniyet Tarihi
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Kilitli anılar bu tarihte erişime açılır
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="relative space-y-4 pt-2">
                        {currentGraduationDate && (
                            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Mevcut:</div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                    {currentGraduationDate.toLocaleDateString('tr-TR', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </div>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="graduation-date" className="text-xs mb-1.5 block">Tarih</Label>
                            <Input
                                id="graduation-date"
                                type="date"
                                value={graduationDate}
                                onChange={(e) => setGraduationDate(e.target.value)}
                                className="h-9"
                            />
                        </div>

                        {daysUntilGraduation !== null && (
                            <div className={`text-sm font-medium flex items-center gap-2 ${daysUntilGraduation <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                <LockOpen className="h-4 w-4" />
                                {daysUntilGraduation <= 0 ? 'Artık açık!' : `Açılmasına ${daysUntilGraduation} gün`}
                            </div>
                        )}

                        <Button
                            onClick={handleSaveGraduationDate}
                            disabled={savingGraduation || !graduationDate}
                            size="sm"
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {savingGraduation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Güncelle
                        </Button>
                    </CardContent>
                </Card>
            </div>



            {/* Announcement Settings Card */}
            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

                <CardHeader className="relative pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Duyuru ve Bildirimler
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Tüm kullanıcılara görünecek duyurular
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative space-y-4 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                Duyuru Bannerı
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {announcementEnabled ? 'Aktif: Site tepesinde görünür' : 'Pasif: Görünmez'}
                            </div>
                        </div>
                        <Switch
                            checked={announcementEnabled}
                            onCheckedChange={(checked) => handleToggleChange('announcement_enabled', checked, setAnnouncementEnabled)}
                            disabled={savingToggle === 'announcement_enabled'}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="announcement" className="text-xs">Duyuru Metni</Label>
                        <Input
                            id="announcement"
                            placeholder="Örn: Yıllık yazıları için son gün 9 Şubat!"
                            value={announcementMessage}
                            onChange={(e) => setAnnouncementMessage(e.target.value)}
                        />
                        <Button
                            onClick={handleSaveAnnouncement}
                            disabled={savingAnnouncement}
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {savingAnnouncement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Metni Kaydet
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* System Toggles Card */}
            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />

                <CardHeader className="relative">
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Sistem Kontrolleri
                    </CardTitle>
                    <CardDescription>
                        Yıllık sisteminin çeşitli özelliklerini açıp kapatın
                    </CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-4">
                    {/* Messaging Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${messagingEnabled
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/30'
                                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`}>
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                    Mesaj Yazma
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {messagingEnabled ? 'Kullanıcılar mesaj yazabilir' : 'Mesaj yazma kapalı'}
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={messagingEnabled}
                            onCheckedChange={(checked) => handleToggleChange('messaging_enabled', checked, setMessagingEnabled)}
                            disabled={savingToggle === 'messaging_enabled'}
                        />
                    </div>

                    {/* Voting Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${votingEnabled
                                ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-purple-500/30'
                                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`}>
                                <Vote className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                    Oylama / Anketler
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {votingEnabled ? 'Kullanıcılar oy verebilir' : 'Oylama kapalı'}
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={votingEnabled}
                            onCheckedChange={(checked) => handleToggleChange('voting_enabled', checked, setVotingEnabled)}
                            disabled={savingToggle === 'voting_enabled'}
                        />
                    </div>

                    {/* Registration Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${registrationEnabled
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`}>
                                <UserPlus className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                    Yeni Kayıt
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {registrationEnabled ? 'Yeni kullanıcılar kayıt olabilir' : 'Kayıt kapalı'}
                                </div>
                            </div>
                        </div>
                        <Switch
                            checked={registrationEnabled}
                            onCheckedChange={(checked) => handleToggleChange('registration_enabled', checked, setRegistrationEnabled)}
                            disabled={savingToggle === 'registration_enabled'}
                        />
                    </div>

                    {/* Maintenance Toggle - Danger Zone */}
                    <div className="relative overflow-hidden flex items-center justify-between p-4 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 group">
                        <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 pointer-events-none" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300 ${maintenanceMode
                                ? 'bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-red-500/30'
                                : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                }`}>
                                <Construction className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-red-900 dark:text-red-100">
                                        Bakım Modu
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                                        Dikkat
                                    </span>
                                </div>
                                <div className="text-sm text-red-700/80 dark:text-red-300/80 font-medium">
                                    {maintenanceMode ? '⚠️ SİTE KAPALI - Sadece Süper Adminler Erişebilir!' : 'Site şu an aktif ve herkese açık'}
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <Switch
                                className="data-[state=checked]:bg-red-600 dark:data-[state=checked]:bg-red-500"
                                checked={maintenanceMode}
                                onCheckedChange={(checked) => handleToggleChange('maintenance_mode', checked, setMaintenanceMode)}
                                disabled={savingToggle === 'maintenance_mode'}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Warning Card */}
            <Card className="border-0 bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur-xl shadow-lg ring-1 ring-amber-200 dark:ring-amber-800">
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-medium mb-1">Önemli Bilgi</p>
                            <p className="text-amber-700 dark:text-amber-300">
                                Bu ayarlar tüm kullanıcıları anında etkiler. Bir özelliği kapattığınızda kullanıcılar ilgili işlemi yapamayacaktır.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}
