"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ActivityStatsData {
    bucket_start: string
    events: number
    unique_profiles: number
}

interface ActivityStatsChartProps {
    data: ActivityStatsData[]
}

export function ActivityStatsChart({ data }: ActivityStatsChartProps) {
    // Veriyi işle
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return []

        return data.map(item => ({
            date: new Date(item.bucket_start),
            events: Number(item.events),
            uniqueProfiles: Number(item.unique_profiles),
            label: new Date(item.bucket_start).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short'
            })
        }))
    }, [data])

    // İstatistikleri hesapla
    const stats = useMemo(() => {
        if (chartData.length === 0) return { totalEvents: 0, avgDaily: 0, peakDay: null, trend: 0 }

        const totalEvents = chartData.reduce((acc, d) => acc + d.events, 0)
        const avgDaily = Math.round(totalEvents / chartData.length)
        const peakDay = chartData.reduce((max, d) => d.events > max.events ? d : max, chartData[0])

        // Son 7 gün vs önceki 7 gün karşılaştırması
        const recentDays = chartData.slice(-7)
        const previousDays = chartData.slice(-14, -7)

        const recentAvg = recentDays.length > 0
            ? recentDays.reduce((acc, d) => acc + d.events, 0) / recentDays.length
            : 0
        const previousAvg = previousDays.length > 0
            ? previousDays.reduce((acc, d) => acc + d.events, 0) / previousDays.length
            : 0

        const trend = previousAvg > 0
            ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100)
            : 0

        return { totalEvents, avgDaily, peakDay, trend }
    }, [chartData])

    // Maksimum ve minimum değerleri bul (her iki metrik için)
    const { maxValue, minValue } = useMemo(() => {
        if (chartData.length === 0) return { maxValue: 1, minValue: 0 }
        const allValues = chartData.flatMap(d => [d.events, d.uniqueProfiles])
        const max = Math.max(...allValues, 1)
        const min = Math.min(...allValues, 0)
        return { maxValue: max, minValue: min }
    }, [chartData])

    // Events (Mavi) çizgi path'i
    const eventsLinePath = useMemo(() => {
        if (chartData.length === 0) return ""

        const width = 100 // percentage
        const height = 140 // pixels
        const padding = 10

        const points = chartData.map((item, idx) => {
            const x = (idx / (chartData.length - 1)) * width
            const y = height - padding - ((item.events - minValue) / (maxValue - minValue)) * (height - 2 * padding)
            return `${x},${y}`
        })

        return `M ${points.join(" L ")}`
    }, [chartData, maxValue, minValue])

    // Unique Profiles (Kırmızı) çizgi path'i
    const profilesLinePath = useMemo(() => {
        if (chartData.length === 0) return ""

        const width = 100
        const height = 140
        const padding = 10

        const points = chartData.map((item, idx) => {
            const x = (idx / (chartData.length - 1)) * width
            const y = height - padding - ((item.uniqueProfiles - minValue) / (maxValue - minValue)) * (height - 2 * padding)
            return `${x},${y}`
        })

        return `M ${points.join(" L ")}`
    }, [chartData, maxValue, minValue])

    if (!data || data.length === 0) {
        return (
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm text-muted-foreground">Aktivite verisi bulunamadı</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Kullanıcı Aktivitesi</CardTitle>
                            <CardDescription>Son 30 günlük site kullanım grafiği</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {stats.trend !== 0 && (
                            <Badge
                                variant="outline"
                                className={`gap-1 ${stats.trend > 0
                                    ? 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20'
                                    }`}
                            >
                                <TrendingUp className={`h-3 w-3 ${stats.trend < 0 ? 'rotate-180' : ''}`} />
                                {stats.trend > 0 ? '+' : ''}{stats.trend}%
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalEvents.toLocaleString('tr-TR')}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Toplam Olay</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgDaily}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Günlük Ort.</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {stats.peakDay?.events || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">En Yüksek</p>
                    </div>
                </div>

                {/* Line Chart */}
                <div className="relative" style={{ height: '180px' }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] text-muted-foreground">
                        <span>{maxValue}</span>
                        <span>{Math.round(maxValue / 2)}</span>
                        <span>0</span>
                    </div>

                    {/* Chart Container */}
                    <div className="absolute left-12 right-0 top-0 bottom-6" style={{ height: '156px' }}>
                        <svg
                            viewBox="0 0 100 140"
                            preserveAspectRatio="none"
                            className="w-full h-full"
                        >
                            {/* Grid lines */}
                            <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="0.1" className="text-slate-200 dark:text-slate-700" />
                            <line x1="0" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="0.1" className="text-slate-200 dark:text-slate-700" />
                            <line x1="0" y1="130" x2="100" y2="130" stroke="currentColor" strokeWidth="0.1" className="text-slate-200 dark:text-slate-700" />

                            {/* Kırmızı çizgi - Unique Profiles (altta çizilsin ki mavi üstte görünsün) */}
                            <path
                                d={profilesLinePath}
                                fill="none"
                                stroke="rgb(239, 68, 68)"
                                strokeWidth="0.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-lg"
                            />

                            {/* Mavi çizgi - Events */}
                            <path
                                d={eventsLinePath}
                                fill="none"
                                stroke="rgb(59, 130, 246)"
                                strokeWidth="0.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-lg"
                            />

                            {/* Data points - Events (Mavi) */}
                            {chartData.map((item, idx) => {
                                const x = (idx / (chartData.length - 1)) * 100
                                const y = 140 - 10 - ((item.events - minValue) / (maxValue - minValue)) * 120
                                const isToday = idx === chartData.length - 1
                                const isPeak = stats.peakDay && item.events === stats.peakDay.events

                                return (
                                    <g key={`events-${idx}`}>
                                        {/* Outer circle for hover effect */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="2"
                                            className="fill-white dark:fill-slate-900 opacity-0 hover:opacity-100 transition-opacity"
                                            strokeWidth="0.5"
                                            stroke="rgb(59, 130, 246)"
                                        />
                                        {/* Main point */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={isToday || isPeak ? "1.2" : "0.8"}
                                            className="fill-blue-500"
                                        />
                                    </g>
                                )
                            })}

                            {/* Data points - Unique Profiles (Kırmızı) */}
                            {chartData.map((item, idx) => {
                                const x = (idx / (chartData.length - 1)) * 100
                                const y = 140 - 10 - ((item.uniqueProfiles - minValue) / (maxValue - minValue)) * 120
                                const isToday = idx === chartData.length - 1

                                return (
                                    <g key={`profiles-${idx}`}>
                                        {/* Outer circle for hover effect */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="2"
                                            className="fill-white dark:fill-slate-900 opacity-0 hover:opacity-100 transition-opacity"
                                            strokeWidth="0.5"
                                            stroke="rgb(239, 68, 68)"
                                        />
                                        {/* Main point */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={isToday ? "1.2" : "0.8"}
                                            className="fill-red-500"
                                        />
                                    </g>
                                )
                            })}
                        </svg>

                        {/* Tooltips (HTML overlay) */}
                        {chartData.map((item, idx) => {
                            const xPercent = (idx / (chartData.length - 1)) * 100

                            return (
                                <div
                                    key={`tooltip-${idx}`}
                                    className="absolute hidden pointer-events-none z-10"
                                    style={{
                                        left: `${xPercent}%`,
                                        top: '50%',
                                        transform: 'translate(-50%, -120%)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.classList.remove('hidden')}
                                >
                                    <div className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                                        <p className="font-bold">{item.label}</p>
                                        <p className="text-blue-400">{item.events} olay</p>
                                        <p className="text-red-400">{item.uniqueProfiles} kullanıcı</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-12 right-0 bottom-0 flex justify-between text-[9px] text-muted-foreground">
                        {chartData.filter((_, idx) => idx % 5 === 0 || idx === chartData.length - 1).map((item, idx) => (
                            <span key={idx}>{item.label}</span>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 rounded bg-blue-500" />
                        <span className="text-[11px] text-muted-foreground">Olaylar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 rounded bg-red-500" />
                        <span className="text-[11px] text-muted-foreground">Farklı Kullanıcılar</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}