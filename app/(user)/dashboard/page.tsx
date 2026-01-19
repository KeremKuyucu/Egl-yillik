import { redirect } from "next/navigation"
import { Suspense } from "react"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import DashboardGrid from "@/components/dashboard-grid"
import SurveyCard, { SurveyCardSkeleton } from "@/components/dashboard/survey-card"
import SuggestionCard from "@/components/dashboard/suggestion-card"
import StatsBar from "@/components/dashboard/stats-bar"
import ProfileCard from "@/components/dashboard/profile-card"
import CountdownCard from "@/components/dashboard/countdown-card"
import { getDeadline, getGraduationDate } from "@/lib/settings"
import LockedCard from "@/components/dashboard/locked-card"
import QuickActions from "@/components/dashboard/quick-actions"
import { Heart, Star, Zap, Sparkles } from "lucide-react"

const getDetailedGreeting = (userName: string) => {
  const timeString = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false })
  const hour = parseInt(timeString, 10)

  const timeMap = [
    { start: 0, end: 5, text: "İyi Geceler (Hala ayakta mısın?)", icon: "🌙" },
    { start: 5, end: 12, text: "Günaydın", icon: "☀️" },
    { start: 12, end: 17, text: "Tünaydın", icon: "🌤️" },
    { start: 17, end: 21, text: "İyi Akşamlar", icon: "🌇" },
    { start: 21, end: 24, text: "İyi Geceler", icon: "🌃" }
  ]

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
  if (count >= 30) return {
    label: "Yıllık Efsanesi",
    color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg shadow-purple-500/40",
    icon: <Star className="h-3 w-3 mr-1" suppressHydrationWarning />
  }
  if (count >= 15) return {
    label: "Hatıra Mimarı",
    color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40",
    icon: <Zap className="h-3 w-3 mr-1" suppressHydrationWarning />
  }
  if (count >= 5) return {
    label: "Anı Yazarı",
    color: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/40",
    icon: <Heart className="h-3 w-3 mr-1" suppressHydrationWarning />
  }
  return {
    label: "Yeni Üye",
    color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md",
    icon: <Sparkles className="h-3 w-3 mr-1" suppressHydrationWarning />
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // RPC çağrısına 5 saniye timeout ekle
  const rpcPromise = supabase.rpc('get_dashboard_data_v3')
  const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
    setTimeout(() => {
      resolve({ data: null, error: { message: 'Request timed out' } })
    }, 5000)
  })

  // @ts-ignore
  const { data: dashboardData, error: dashboardError } = await Promise.race([rpcPromise, timeoutPromise])

  if (dashboardError || !dashboardData?.profile) {
    console.error("Dashboard veri hatası:", dashboardError)
    redirect("/complete-profile")
  }

  // Verileri çıkar
  const userProfile = dashboardData.profile
  const texts = dashboardData.written_texts || []
  const receivedCount = dashboardData.received_count || 0
  const classmates = dashboardData.classmates || []
  const surveyStats = dashboardData.survey_stats || { total: 0, voted: 0 }

  const totalCategories = surveyStats.total
  const votedCount = surveyStats.voted
  const surveyPercentage = totalCategories > 0 ? Math.round((votedCount / totalCategories) * 100) : 0
  const isSurveyComplete = votedCount === totalCategories

  // Yazılan alıcı ID'leri
  const writtenRecipientIds = texts?.map((t: any) => t.recipient_id) || []
  const classmateIds = classmates?.map((c: any) => c.id) || []

  const requiredWritten = classmateIds.filter((id: string) => writtenRecipientIds.includes(id)).length
  const requiredTotal = classmateIds.length
  const progressPercentage = requiredTotal > 0 ? Math.round((requiredWritten / requiredTotal) * 100) : 0
  const isRequiredComplete = requiredWritten === requiredTotal
  const totalWords = texts?.reduce((acc: number, curr: any) => acc + (curr.content?.split(" ").length || 0), 0) || 0
  const userBadge = getBadge(texts?.length || 0)

  const lastText = texts && texts.length > 0 ? texts[0] : null
  const lastTextDate = lastText ? new Date(lastText.updated_at) : null

  const greetingData = getDetailedGreeting(userProfile?.first_name || "")

  // Son teslim tarihini veritabanından çek
  const deadline = await getDeadline()
  const graduationDate = await getGraduationDate()


  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">

      <StatsBar
        textsCount={texts?.length || 0}
        totalWords={totalWords}
        votedCount={votedCount}
        totalCategories={totalCategories}
        progressPercentage={progressPercentage}
      />

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        <div className="lg:col-span-2 flex flex-col gap-6">

          <ProfileCard
            userProfile={userProfile}
            greeting={greetingData.short}
            greetingIcon={greetingData.icon}
            userBadge={userBadge}
            totalWords={totalWords}
            requiredWritten={requiredWritten}
            requiredTotal={requiredTotal}
            progressPercentage={progressPercentage}
            isRequiredComplete={isRequiredComplete}
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
            receivedCount={receivedCount}
            deadline={graduationDate.date}
            schoolNumber={userProfile.school_number}
          />

          {/* Enhanced Featured Survey Card - Suspense ile lazy load */}
          <Suspense fallback={<SurveyCardSkeleton />}>
            <SurveyCard userId={user.id} />
          </Suspense>

          {/* Enhanced Suggestion Card */}
          <SuggestionCard classmates={classmates} writtenRecipientIds={writtenRecipientIds} />

        </div>
      </div>

      <QuickActions schoolNumber={userProfile.school_number} lastTextDate={lastTextDate} />

      {/* @ts-ignore */}
      <DashboardGrid texts={texts || []} />

    </div>
  )
}