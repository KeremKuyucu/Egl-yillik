"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar, Save, Loader2, AlertCircle, MessageSquare, Vote, UserPlus, GraduationCap, LockOpen, Construction, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { updateDeadline, getSettingsAction, updateToggleSetting, updateGraduationDate, updateTextSetting } from "./actions"

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true)

    // Deadline States
    const [savingDeadline, setSavingDeadline] = useState(false)
    const [deadlineDate, setDeadlineDate] = useState("")
    const [deadlineTime, setDeadlineTime] = useState("23:59")
    const [currentDeadline, setCurrentDeadline] = useState<Date | null>(null)

    // Graduation States
    const [savingGraduation, setSavingGraduation] = useState(false)
    const [graduationYear, setGraduationYear] = useState(new Date().getFullYear())
    const [graduationDate, setGraduationDate] = useState("")
    const [currentGraduationDate, setCurrentGraduationDate] = useState<Date | null>(null)
    const [allSettings, setAllSettings] = useState<Record<string, string>>({})

    // Toggle states
    const [savingToggle, setSavingToggle] = useState<string | null>(null)
    const [messagingEnabled, setMessagingEnabled] = useState(true)
    const [votingEnabled, setVotingEnabled] = useState(true)
    const [galleryEnabled, setGalleryEnabled] = useState(true)
    const [registrationEnabled, setRegistrationEnabled] = useState(true)
    const [announcementEnabled, setAnnouncementEnabled] = useState(false)

    // Announcement States
    const [savingAnnouncement, setSavingAnnouncement] = useState(false)
    const [announcementMessage, setAnnouncementMessage] = useState("")

    useEffect(() => {
        loadSettings()
    }, [])

    // Update graduation date when year changes or settings load
    useEffect(() => {
        if (!allSettings) return

        const key = `graduation_date_${graduationYear}`
        // Strict check for specific year key
        const dateStr = allSettings[key]

        if (dateStr) {
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
                setCurrentGraduationDate(date)
                setGraduationDate(date.toISOString().split('T')[0])
            } else {
                setCurrentGraduationDate(null)
                setGraduationDate("")
            }
        } else {
            setCurrentGraduationDate(null)
            setGraduationDate("")
        }
    }, [graduationYear, allSettings])

    const loadSettings = async () => {
        try {
            const result = await getSettingsAction()
            if (result.success && result.data) {
                const settings = result.data
                setAllSettings(settings)

                // Deadline
                if (settings.deadline) {
                    const date = new Date(settings.deadline)
                    setCurrentDeadline(date)
                    setDeadlineDate(date.toISOString().split('T')[0])
                    setDeadlineTime(date.toTimeString().slice(0, 5))
                }

                // Graduation date handled by useEffect

                // Toggles
                setMessagingEnabled(settings.messaging_enabled !== 'false')
                setVotingEnabled(settings.voting_enabled !== 'false')
                setGalleryEnabled(settings.gallery_enabled !== 'false')
                setRegistrationEnabled(settings.registration_enabled !== 'false')
                setAnnouncementEnabled(settings.announcement_enabled === 'true')

                // Text Settings
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
            const result = await updateGraduationDate(dateString, graduationYear)

            if (result.success) {
                toast.success(`${graduationYear} mezuniyet tarihi güncellendi!`, {
                    description: new Date(dateString).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })
                })
                setCurrentGraduationDate(new Date(dateString))
                // Update local settings to reflect change immediately without reload
                setAllSettings(prev => ({
                    ...prev,
                    [`graduation_date_${graduationYear}`]: dateString
                }))
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
                    gallery_enabled: 'Fotoğraf galerisi',
                    registration_enabled: 'Kayıt',
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
            <div className="flex items-center justify-center p-12" >
                <div className="flex items-center gap-3 text-slate-500" >
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Yükleniyor...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6" >
            {/* Sayfa Başlığı */}
            < div className="mb-6" >
                <h1 className="text-3xl font-black text-slate-900 dark:text-white" >
                    Site Ayarları
                </h1>
                < p className="text-slate-500 dark:text-slate-400 mt-1" >
                    Yıllık sistemi için genel ayarları yönetin
                </p>
            </div>

            < div className="grid grid-cols-1 lg:grid-cols-2 gap-6" >
                {/* Deadline Card */}
                < Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative" >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5" />

                    <CardHeader className="relative pb-2" >
                        <div className="flex items-center gap-3" >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20" >
                                <Calendar className="h-5 w-5" />
                            </div>
                            < div >
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100" >
                                    Yazı Son Teslim
                                </CardTitle>
                                < CardDescription className="text-xs" >
                                    Anı yazma işlemi bu tarihte kapanır
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    < CardContent className="relative space-y-4 pt-2" >
                        {currentDeadline && (
                            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" >
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5" > Mevcut: </div>
                                < div className="font-bold text-slate-900 dark:text-white" >
                                    {
                                        currentDeadline.toLocaleDateString('tr-TR', {
                                            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                        })
                                    }
                                </div>
                            </div>
                        )
                        }

                        <div className="grid grid-cols-2 gap-3" >
                            <div className="col-span-1" >
                                <Label htmlFor="deadline-date" className="text-xs mb-1.5 block" > Tarih </Label>
                                < Input
                                    id="deadline-date"
                                    type="date"
                                    value={deadlineDate}
                                    onChange={(e) => setDeadlineDate(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            < div className="col-span-1" >
                                <Label htmlFor="deadline-time" className="text-xs mb-1.5 block" > Saat </Label>
                                < Input
                                    id="deadline-time"
                                    type="time"
                                    value={deadlineTime}
                                    onChange={(e) => setDeadlineTime(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        {
                            daysUntilDeadline !== null && (
                                <div className={`text-sm font-medium flex items-center gap-2 ${daysUntilDeadline <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    <AlertCircle className="h-4 w-4" />
                                    {daysUntilDeadline <= 0 ? 'Süre dolmuş' : `${daysUntilDeadline} gün kaldı`
                                    }
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
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative" >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />

                    <CardHeader className="relative pb-2" >
                        <div className="flex items-center gap-3" >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20" >
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            < div >
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100" >
                                    Mezuniyet Tarihi
                                </CardTitle>
                                < CardDescription className="text-xs" >
                                    Kilitli anılar bu tarihte erişime açılır
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    < CardContent className="relative space-y-4 pt-2" >
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" >
                            <div className="flex justify-between items-center mb-1" >
                                <div className="text-xs text-slate-500 dark:text-slate-400" > Durum: </div>
                                {
                                    currentGraduationDate ? (
                                        <span className="text-[10px] uppercase font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded" >
                                            Tanımlı
                                        </span>
                                    ) : (
                                        <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded" >
                                            Tanımlanmamış
                                        </span>
                                    )
                                }
                            </div>
                            < div className="font-bold text-slate-900 dark:text-white" >
                                {
                                    currentGraduationDate ? (
                                        currentGraduationDate.toLocaleDateString('tr-TR', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })
                                    ) : (
                                        `${graduationYear} yılı için tarih ayarlanmamış`
                                    )}
                            </div>
                        </div>

                        < div className="grid grid-cols-3 gap-3" >
                            <div className="col-span-1" >
                                <Label htmlFor="graduation-year" className="text-xs mb-1.5 block" > Yıl Seçin </Label>
                                < Input
                                    id="graduation-year"
                                    type="number"
                                    value={graduationYear}
                                    onChange={(e) => setGraduationYear(parseInt(e.target.value))}
                                    className="h-9"
                                />
                            </div>
                            < div className="col-span-2" >
                                <Label htmlFor="graduation-date" className="text-xs mb-1.5 block" > Tarih Belirleyin </Label>
                                < Input
                                    id="graduation-date"
                                    type="date"
                                    value={graduationDate}
                                    onChange={(e) => setGraduationDate(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        {
                            daysUntilGraduation !== null && (
                                <div className={`text-sm font-medium flex items-center gap-2 ${daysUntilGraduation <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                    <LockOpen className="h-4 w-4" />
                                    <span className="truncate" >
                                        {daysUntilGraduation <= 0 ? 'Artık açık!' : `Açılmasına ${daysUntilGraduation} gün`
                                        }
                                    </span>
                                </div>
                            )}

                        <Button
                            onClick={handleSaveGraduationDate}
                            disabled={savingGraduation || !graduationDate}
                            size="sm"
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {
                                savingGraduation ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                            {currentGraduationDate ? `${graduationYear} Tarihini Güncelle` : `${graduationYear} İçin Tarih Oluştur`}
                        </Button>

                        < div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800" >
                            <Label className="text-xs mb-2 block text-slate-500" > Tanımlı Yıllar </Label>
                            < div className="flex flex-wrap gap-2" >
                                {
                                    Object.keys(allSettings)
                                        .filter(k => k.startsWith('graduation_date_'))
                                        .map(k => {
                                            const y = k.replace('graduation_date_', '');
                                            return { key: k, year: parseInt(y) };
                                        })
                                        .filter(item => !isNaN(item.year))
                                        .sort((a, b) => b.year - a.year)
                                        .map(({ year }) => (
                                            <button
                                                key={year}
                                                onClick={() => setGraduationYear(year)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${graduationYear === year
                                                    ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300 shadow-sm'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 hover:border-amber-200 dark:hover:border-amber-800'
                                                    }`}
                                            >
                                                {year}
                                            </button>
                                        ))
                                }
                                {
                                    Object.keys(allSettings).filter(k => k.startsWith('graduation_date_')).length === 0 && (
                                        <span className="text-xs text-slate-400 italic" > Henüz özel tarih tanımlanmamış </span>
                                    )
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Announcement Settings Card */}
            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative" >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

                <CardHeader className="relative pb-2" >
                    <div className="flex items-center gap-3" >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20" >
                            <Megaphone className="h-5 w-5" />
                        </div>
                        < div >
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100" >
                                Duyuru ve Bildirimler
                            </CardTitle>
                            < CardDescription className="text-xs" >
                                Tüm kullanıcılara görünecek duyurular
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                < CardContent className="relative space-y-4 pt-2" >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" >
                        <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white" >
                                Duyuru Bannerı
                            </div>
                            < div className="text-xs text-slate-500 dark:text-slate-400" >
                                {announcementEnabled ? 'Aktif: Site tepesinde görünür' : 'Pasif: Görünmez'}
                            </div>
                        </div>
                        < Switch
                            checked={announcementEnabled}
                            onCheckedChange={(checked) => handleToggleChange('announcement_enabled', checked, setAnnouncementEnabled)}
                            disabled={savingToggle === 'announcement_enabled'}
                        />
                    </div>

                    < div className="space-y-2" >
                        <Label htmlFor="announcement" className="text-xs" > Duyuru Metni </Label>
                        < Input
                            id="announcement"
                            placeholder="Örn: Yıllık yazıları için son gün 9 Şubat!"
                            value={announcementMessage}
                            onChange={(e) => setAnnouncementMessage(e.target.value)}
                        />
                        < Button
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
            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative" >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />

                <CardHeader className="relative" >
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100" >
                        Sistem Kontrolleri
                    </CardTitle>
                    <CardDescription>
                        Yıllık sisteminin çeşitli özelliklerini açıp kapatın
                    </CardDescription>
                </CardHeader>

                < CardContent className="relative space-y-4" >
                    {/* Messaging Toggle */}
                    < div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" >
                        <div className="flex items-center gap-4" >
                            <div className={
                                `w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${messagingEnabled
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/30'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`
                            }>
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            < div >
                                <div className="font-semibold text-slate-900 dark:text-white" >
                                    Mesaj Yazma
                                </div>
                                < div className="text-sm text-slate-500 dark:text-slate-400" >
                                    {messagingEnabled ? 'Kullanıcılar mesaj yazabilir' : 'Mesaj yazma kapalı'}
                                </div>
                            </div>
                        </div>
                        < Switch
                            checked={messagingEnabled}
                            onCheckedChange={(checked) => handleToggleChange('messaging_enabled', checked, setMessagingEnabled)}
                            disabled={savingToggle === 'messaging_enabled'}
                        />
                    </div>

                    {/* Voting Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" >
                        <div className="flex items-center gap-4" >
                            <div className={
                                `w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${votingEnabled
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-purple-500/30'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`
                            }>
                                <Vote className="h-6 w-6" />
                            </div>
                            < div >
                                <div className="font-semibold text-slate-900 dark:text-white" >
                                    Oylama / Anketler
                                </div>
                                < div className="text-sm text-slate-500 dark:text-slate-400" >
                                    {votingEnabled ? 'Kullanıcılar oy verebilir' : 'Oylama kapalı'}
                                </div>
                            </div>
                        </div>
                        < Switch
                            checked={votingEnabled}
                            onCheckedChange={(checked) => handleToggleChange('voting_enabled', checked, setVotingEnabled)}
                            disabled={savingToggle === 'voting_enabled'}
                        />
                    </div>

                    {/* Gallery Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" >
                        <div className="flex items-center gap-4" >
                            <div className={
                                `w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${galleryEnabled
                                    ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/30'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`
                            }>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            </div>
                            < div >
                                <div className="font-semibold text-slate-900 dark:text-white" >
                                    Fotoğraf Galerisi
                                </div>
                                < div className="text-sm text-slate-500 dark:text-slate-400" >
                                    {galleryEnabled ? 'Kullanıcılar galeriye fotoğraf yükleyebilir' : 'Galeri kapalı'}
                                </div>
                            </div>
                        </div>
                        < Switch
                            checked={galleryEnabled}
                            onCheckedChange={(checked) => handleToggleChange('gallery_enabled', checked, setGalleryEnabled)}
                            disabled={savingToggle === 'gallery_enabled'}
                        />
                    </div>

                    {/* Registration Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700" >
                        <div className="flex items-center gap-4" >
                            <div className={
                                `w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${registrationEnabled
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30'
                                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                                }`
                            }>
                                <UserPlus className="h-6 w-6" />
                            </div>
                            < div >
                                <div className="font-semibold text-slate-900 dark:text-white" >
                                    Yeni Kayıt
                                </div>
                                < div className="text-sm text-slate-500 dark:text-slate-400" >
                                    {registrationEnabled ? 'Yeni kullanıcılar kayıt olabilir' : 'Kayıt kapalı'}
                                </div>
                            </div>
                        </div>
                        < Switch
                            checked={registrationEnabled}
                            onCheckedChange={(checked) => handleToggleChange('registration_enabled', checked, setRegistrationEnabled)}
                            disabled={savingToggle === 'registration_enabled'}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Warning Card */}
            <Card className="border-0 bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur-xl shadow-lg ring-1 ring-amber-200 dark:ring-amber-800" >
                <CardContent className="p-4" >
                    <div className="flex gap-3" >
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 dark:text-amber-200" >
                            <p className="font-medium mb-1" > Önemli Bilgi </p>
                            < p className="text-amber-700 dark:text-amber-300" >
                                Bu ayarlar tüm kullanıcıları anında etkiler.Bir özelliği kapattığınızda kullanıcılar ilgili işlemi yapamayacaktır.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}
