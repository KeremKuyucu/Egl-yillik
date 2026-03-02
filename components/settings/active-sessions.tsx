"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { MonitorSmartphone, Trash2, Clock, MapPin, Loader2, Smartphone, Monitor, Globe } from "lucide-react"
import { toast } from "sonner"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Session = {
    id: string
    created_at: string
    updated_at: string
    user_agent: string
    ip: string
}

export default function ActiveSessions({ initialSessions, currentSessionId }: { initialSessions: Session[], currentSessionId?: string }) {
    const [sessions, setSessions] = useState<Session[]>(initialSessions)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const supabase = createClient()

    const handleDelete = async (sessionId: string) => {
        setIsDeleting(sessionId)
        try {
            const { data, error } = await supabase.rpc('delete_user_session', {
                p_session_id: sessionId
            })

            if (error) throw error

            if (data) {
                setSessions(prev => prev.filter(s => s.id !== sessionId))
                toast.success("Oturum başarıyla sonlandırıldı.")
            } else {
                toast.error("Oturum silinemedi. Lütfen tekrar deneyin.")
            }
        } catch (error: any) {
            console.error("Session delete error:", error)
            toast.error(error.message || "Oturum sonlandırılırken bir hata oluştu.")
        } finally {
            setIsDeleting(null)
        }
    }

    const getDeviceIcon = (ua: string) => {
        const lowerUA = ua.toLowerCase()
        // Google / API İşlemleri (Node.js) için özel ikon rengi
        if (lowerUA === "node") return <Globe className="h-5 w-5 text-amber-500" />

        if (lowerUA.includes("mobi") || lowerUA.includes("android") || lowerUA.includes("iphone") || lowerUA.includes("ipad")) {
            return <Smartphone className="h-5 w-5 text-indigo-500" />
        }
        if (lowerUA.includes("windows") || lowerUA.includes("macintosh") || lowerUA.includes("linux")) {
            return <Monitor className="h-5 w-5 text-indigo-500" />
        }
        return <Globe className="h-5 w-5 text-indigo-500" />
    }

    const parseUserAgent = (ua: string) => {
        let os = "Bilinmeyen Sistem"
        let browser = "Bilinmeyen Tarayıcı"

        if (!ua) return { os, browser }

        // Özel durum: node (Google login veya server-side işlemler)
        if (ua.toLowerCase() === "node") {
            return { os: "Sistem / API", browser: "Google Auth Flow" }
        }

        // OS Tespiti
        if (ua.includes("Windows")) os = "Windows"
        else if (ua.includes("Mac OS") || ua.includes("Macintosh")) os = "macOS"
        else if (ua.includes("Linux")) os = "Linux"
        else if (ua.includes("Android")) os = "Android"
        else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"

        // Tarayıcı Tespiti
        if (ua.includes("Chrome") || ua.includes("CriOS")) browser = "Chrome"
        else if (ua.includes("Firefox") || ua.includes("FxiOS")) browser = "Firefox"
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
        else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge"
        else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera"

        return { os, browser }
    }

    return (
        <div className="bg-white dark:bg-transparent">
            <CardHeader className="bg-indigo-50/30 dark:bg-indigo-500/5 border-b border-indigo-100 dark:border-indigo-500/20 px-6 py-5">
                <div className="flex items-center gap-3">
                    <MonitorSmartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-xl font-serif font-bold text-slate-800 dark:text-white">
                        Aktif Oturumlar
                    </CardTitle>
                </div>
                <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
                    Hesabınıza erişimi olan cihazları inceleyin ve kontrol altında tutun.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {sessions.length === 0 ? (
                    <div className="p-12 text-center">
                        <MonitorSmartphone className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium font-serif">Şaşırtıcı ama aktif bir oturum bulunamadı.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-indigo-500/10">
                        {sessions.map((session) => {
                            const isCurrent = currentSessionId === session.id
                            const { os, browser } = parseUserAgent(session.user_agent)

                            return (
                                <div key={session.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white dark:bg-indigo-500/10 border border-slate-100 dark:border-indigo-500/20 rounded-2xl shadow-sm">
                                            {getDeviceIcon(session.user_agent)}
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-slate-900 dark:text-white" title={session.user_agent}>
                                                    {os} · {browser}
                                                </p>
                                                {isCurrent && (
                                                    <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 px-2 py-0 text-[10px] uppercase tracking-wider font-bold">
                                                        Bu Cihaz
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                                                    {session.ip || "Bilinmeyen IP"}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                                    Son aktivite: {new Date(session.updated_at).toLocaleString('tr-TR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCurrent && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full sm:w-auto h-10 px-4 rounded-xl text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-500 border-red-100 dark:border-red-900/30 transition-all duration-300 font-medium"
                                            onClick={() => handleDelete(session.id)}
                                            disabled={isDeleting === session.id}
                                        >
                                            {isDeleting === session.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Oturumu Sonlandır
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </div>
    )
}

