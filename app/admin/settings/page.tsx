"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Save, Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { updateDeadline, getDeadlineAction } from "./actions"

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deadlineDate, setDeadlineDate] = useState("")
    const [deadlineTime, setDeadlineTime] = useState("23:59")
    const [currentDeadline, setCurrentDeadline] = useState<Date | null>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const result = await getDeadlineAction()
            if (result.success && result.data) {
                const date = new Date(result.data)
                setCurrentDeadline(date)
                // Format for date input: YYYY-MM-DD
                setDeadlineDate(date.toISOString().split('T')[0])
                // Format for time input: HH:MM
                setDeadlineTime(date.toTimeString().slice(0, 5))
            }
        } catch (error) {
            toast.error("Ayarlar yüklenirken hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!deadlineDate) {
            toast.error("Lütfen bir tarih seçin")
            return
        }

        setSaving(true)
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
            setSaving(false)
        }
    }

    const previewDate = deadlineDate && deadlineTime
        ? new Date(`${deadlineDate}T${deadlineTime}:00`)
        : null

    const daysUntilDeadline = previewDate
        ? Math.ceil((previewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Yükleniyor...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 font-sans">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                            Site Ayarları
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Yıllık sistemi için genel ayarları yönetin
                        </p>
                    </div>
                </div>

                {/* Deadline Card */}
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5" />

                    <CardHeader className="relative">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                                <Calendar className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    Son Teslim Tarihi
                                </CardTitle>
                                <CardDescription>
                                    Tüm yıllık yazılarının teslim edilmesi gereken son tarih
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="relative space-y-6">
                        {/* Current Deadline Display */}
                        {currentDeadline && (
                            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Mevcut Son Teslim Tarihi
                                </div>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">
                                    {currentDeadline.toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Date & Time Inputs */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="deadline-date" className="text-slate-700 dark:text-slate-300 font-medium">
                                    Tarih
                                </Label>
                                <Input
                                    id="deadline-date"
                                    type="date"
                                    value={deadlineDate}
                                    onChange={(e) => setDeadlineDate(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-violet-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline-time" className="text-slate-700 dark:text-slate-300 font-medium">
                                    Saat
                                </Label>
                                <Input
                                    id="deadline-time"
                                    type="time"
                                    value={deadlineTime}
                                    onChange={(e) => setDeadlineTime(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-violet-500"
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        {previewDate && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border border-violet-200 dark:border-violet-800">
                                <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 mb-1">
                                    <AlertCircle className="h-4 w-4" />
                                    Önizleme
                                </div>
                                <div className="text-lg font-semibold text-violet-900 dark:text-violet-100">
                                    {previewDate.toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                {daysUntilDeadline !== null && (
                                    <div className={`text-sm mt-1 font-medium ${daysUntilDeadline <= 0
                                            ? 'text-red-600 dark:text-red-400'
                                            : daysUntilDeadline <= 7
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-green-600 dark:text-green-400'
                                        }`}>
                                        {daysUntilDeadline <= 0
                                            ? 'Süre dolmuş'
                                            : `${daysUntilDeadline} gün kaldı`}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save Button */}
                        <Button
                            onClick={handleSave}
                            disabled={saving || !deadlineDate}
                            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/30 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Değişiklikleri Kaydet
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="mt-6 border-0 bg-amber-50/80 dark:bg-amber-950/30 backdrop-blur-xl shadow-lg ring-1 ring-amber-200 dark:ring-amber-800">
                    <CardContent className="p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-medium mb-1">Önemli Bilgi</p>
                                <p className="text-amber-700 dark:text-amber-300">
                                    Son teslim tarihini değiştirdiğinizde, tüm kullanıcıların dashboard'unda görülen geri sayım ve e-posta hatırlatmalarındaki tarih otomatik olarak güncellenecektir.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
