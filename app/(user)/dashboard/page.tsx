import { redirect } from "next/navigation"
import { Suspense } from "react"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import SurveyCard, { SurveyCardSkeleton } from "@/components/dashboard/survey-card"
import SuggestionCard from "@/components/dashboard/suggestion-card"
import StatsBar from "@/components/dashboard/stats-bar"
import ProfileCard from "@/components/dashboard/profile-card"
import CountdownCard from "@/components/dashboard/countdown-card"
import { isMaintenanceMode } from "@/lib/settings"
import LockedCard from "@/components/dashboard/locked-card"
import { Heart, Star, Zap, Sparkles, AlertTriangle, Pen, Feather, Crown, Trophy, BookOpen } from "lucide-react"
import DashboardMessage from "@/components/dashboard/dashboard-message"

const getDetailedGreeting = (userName: string) => {
  const timeString = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false })
  const hour = parseInt(timeString, 10)

  const timeMap = [
    { start: 0, end: 3, text: "Yıllığı mı Düzenliyorsun, Test mi Çözüyorsun?", icon: "🦉" },
    { start: 3, end: 6, text: "Bu Saatte Sadece Orijinal Sorular ve Biz Ayaktayız", icon: "🕯️" },
    { start: 6, end: 8, text: "İlk Dersin Yoklamasını Kaçırma!", icon: "🏃" },
    { start: 8, end: 12, text: "Hayırlı Sabahlar, Kantinde Simit Sırası Var mı?", icon: "🥯" },
    { start: 12, end: 13, text: "Öğle Arası: Yemek mi, Voleybol Maçı mı?", icon: "🏐" },
    { start: 13, end: 16, text: "Son Derslerin Çekilmeyen Ağırlığı Üzerinde mi?", icon: "😴" },
    { start: 16, end: 19, text: "Okul Bitti, Dershane/Etüt Mesaisi Başlar", icon: "📚" },
    { start: 19, end: 22, text: "İyi Akşamlar, Deneme Netleri Ne Alemde?", icon: "✍️" },
    { start: 22, end: 24, text: "İyi Geceler, Yarın Okulda Görüşürüz", icon: "🏫" }
  ];

  const match = timeMap.find(t => hour >= t.start && hour < t.end)
  const greeting = match ? match.text : "Merhaba"
  const icon = match ? match.icon : "👋"

  return {
    full: `${greeting}, ${userName}`,
    short: greeting,
    icon: icon
  }
}

const getBadge = (count: number) => {
  if (count >= 50) return {
    label: "Mezuniyet İkonu",
    color: "bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-lg shadow-rose-500/40 ring-1 ring-white/20",
    icon: <Crown className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
  }
  if (count >= 30) return {
    label: "Yıllık Efsanesi",
    color: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-lg shadow-violet-500/40 ring-1 ring-white/20",
    icon: <Trophy className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
  }
  if (count >= 15) return {
    label: "Sınıfın Hafızası",
    color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40 ring-1 ring-white/20",
    icon: <BookOpen className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
  }
  if (count >= 5) return {
    label: "Anı Koleksiyoncusu",
    color: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/40 ring-1 ring-white/20",
    icon: <Feather className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
  }
  return {
    label: "Çaylak Yazar",
    color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md ring-1 ring-white/20",
    icon: <Pen className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // RPC çağrısına 5 saniye timeout ekle
  const rpcPromise = supabase.rpc('get_dashboard_data_v4')
  const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
    setTimeout(() => {
      resolve({ data: null, error: { message: 'Request timed out' } })
    }, 5000)
  })

  // Veritabanı ve RPC çağrılarını paralel başlat
  const [
    dashboardResult,
    maintenanceMode
  ] = await Promise.all([
    Promise.race([rpcPromise, timeoutPromise]),
    isMaintenanceMode()
  ])

  const { data: dashboardData, error: dashboardError } = dashboardResult

  if (dashboardError || !dashboardData?.profile) {
    console.error("Dashboard veri hatası:", dashboardError)
    redirect("/complete-profile")
  }

  // Verileri çıkar
  const userProfile = dashboardData.profile
  const stats = dashboardData.stats
  const progress = dashboardData.progress
  const surveyStats = dashboardData.survey_stats || { total: 0, voted: 0 }
  const suggestion = dashboardData.suggestion
  const systemInfo = dashboardData.system_info || {}

  // Tarihleri al
  const deadlineDate = new Date(systemInfo.deadline)
  const graduationDateRaw = new Date(systemInfo.graduation_date)

  const deadline = {
    date: deadlineDate,
    display: deadlineDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const graduationDate = {
    date: graduationDateRaw,
    display: graduationDateRaw.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Anket İstatistikleri
  const totalCategories = surveyStats.total
  const votedCount = surveyStats.voted
  const surveyPercentage = totalCategories > 0 ? Math.round((votedCount / totalCategories) * 100) : 0
  const isSurveyComplete = votedCount === totalCategories

  // Rozet Hesapla (Local visual logic only)
  const userBadge = getBadge(stats.written_count)

  const greetingData = getDetailedGreeting(userProfile?.first_name || "")


  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <Suspense fallback={null}>
        <DashboardMessage />
      </Suspense>

      {/* Bakım Modu Uyarı Banner */}
      {maintenanceMode && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-500/90 p-4 shadow-lg shadow-amber-500/20 backdrop-blur-sm animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <AlertTriangle className="h-6 w-6 text-white" />
            <div className="text-center">
              <p className="font-bold text-white text-lg">
                ⚠️ Bakım Modu Aktif
              </p>
              <p className="text-white/90 text-sm">
                Sistem şu an bakım modunda. Sadece yöneticiler erişebilir.
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
        </div>
      )}

      <StatsBar
        textsCount={stats.written_count}
        totalWords={stats.total_words}
        votedCount={votedCount}
        totalCategories={totalCategories}
        progressPercentage={progress.percentage}
      />

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 flex flex-col gap-6">

          <ProfileCard
            userProfile={userProfile}
            greeting={greetingData.short}
            greetingIcon={greetingData.icon}
            userBadge={userBadge}
            totalWords={stats.total_words}
            requiredWritten={progress.required_written}
            requiredTotal={progress.required_total}
            progressPercentage={progress.percentage}
            isRequiredComplete={progress.is_complete}
            votedCount={votedCount}
            totalCategories={totalCategories}
            surveyPercentage={surveyPercentage}
            isSurveyComplete={isSurveyComplete}
          />

          <CountdownCard deadlineDate={deadline.date} />
        </div>

        {/* Right Column - Enhanced Cards */}
        <div className="flex flex-col gap-5">

          <LockedCard
            receivedCount={stats.received_count}
            deadline={graduationDate.date}
            schoolNumber={userProfile.school_number}
            userYear={userProfile.user_year}
          />

          {/* Enhanced Featured Survey Card - Suspense ile lazy load */}
          <Suspense fallback={<SurveyCardSkeleton />}>
            <SurveyCard userId={user.id} />
          </Suspense>

          {/* Enhanced Suggestion Card */}
          <SuggestionCard suggestion={suggestion} />

        </div>
      </div>
    </div>
  )
}