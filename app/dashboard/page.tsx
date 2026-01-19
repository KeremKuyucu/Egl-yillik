import { redirect } from "next/navigation"
import { Suspense } from "react"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import DashboardGrid from "@/components/dashboard-grid"
import Footer from "@/components/footer"
import SurveyCard, { SurveyCardSkeleton } from "@/components/dashboard/survey-card"
import SuggestionCard from "@/components/dashboard/suggestion-card"
import StatsBar from "@/components/dashboard/stats-bar"
import DashboardHeader from "@/components/dashboard/header"
import ProfileCard from "@/components/dashboard/profile-card"
import CountdownCard from "@/components/dashboard/countdown-card"
import { getDeadline } from "@/lib/settings"
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

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300 font-sans" suppressHydrationWarning>

      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-6000"></div>
      </div>

      <DashboardHeader
        userProfile={userProfile}
        greeting={greetingData.short}
        signOut={handleSignOut}
      />

      <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

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

            <LockedCard receivedCount={receivedCount} />

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

      </main>
      <Footer />
    </div>
  )
}