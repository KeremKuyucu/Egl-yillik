import { redirect } from "next/navigation"
import { Suspense } from "react"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import SurveyCard, { SurveyCardSkeleton } from "@/components/home/survey-card"
import SuggestionCard from "@/components/home/suggestion-card"
import StatsBar from "@/components/home/stats-bar"
import ProfileCard from "@/components/home/profile-card"
import CountdownCard from "@/components/home/countdown-card"
import LockedCard from "@/components/home/locked-card"
import HomeMessage from "@/components/home/home-message"
import { getDetailedGreeting, getBadge } from "@/lib/profile-utils"


export default async function HomePage() {
  const supabase = await createClient()

  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Invariant violated: user is null in protected page")
  }

  const { data: homeData, error: homeError } =
    await supabase.rpc("get_dashboard_data_v4")

  if (homeError || !homeData?.profile) {
    console.error("Home veri hatası:", homeError)
    redirect("/complete-profile")
  }

  // Verileri çıkar
  const userProfile = homeData.profile
  const stats = homeData.stats
  const progress = homeData.progress
  const surveyStats = homeData.survey_stats || { total: 0, voted: 0 }
  const suggestion = homeData.suggestion
  const systemInfo = homeData.system_info || {}

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
        <HomeMessage />
      </Suspense>

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