import { redirect } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/data"
import { getDetailedGreeting, getBadge } from "@/lib/profile-utils"
import SurveyCard, { SurveyCardSkeleton } from "@/components/home/survey-card"
import SuggestionCard from "@/components/home/suggestion-card"
import StatsBar from "@/components/home/stats-bar"
import ProfileCard from "@/components/home/profile-card"
import CountdownCard from "@/components/home/countdown-card"
import LockedCard from "@/components/home/locked-card"
import HomeMessage from "@/components/home/home-message"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  // getCurrentUser cache() ile sarılı — layout'ta zaten çağrıldı, ek istek yapmaz
  const [supabase, user] = await Promise.all([
    createClient(),
    getCurrentUser(),
  ])

  const { data: homeData, error: homeError } =
    await supabase.rpc("get_dashboard_data_v4")

  if (homeError || !homeData?.profile) {
    console.error("Home veri hatası:", homeError)
    redirect("/complete-profile")
  }

  const { profile: userProfile, stats, progress, suggestion } = homeData
  const surveyStats = homeData.survey_stats || { total: 0, voted: 0 }
  const systemInfo = homeData.system_info || {}

  // Tarihler — null kontrolü ile
  const deadlineDate = systemInfo.deadline
    ? new Date(systemInfo.deadline)
    : null
  const graduationDate = systemInfo.graduation_date
    ? new Date(systemInfo.graduation_date)
    : null

  // Anket istatistikleri
  const { total: totalCategories, voted: votedCount } = surveyStats
  const surveyPercentage =
    totalCategories > 0 ? Math.round((votedCount / totalCategories) * 100) : 0
  const isSurveyComplete = totalCategories > 0 && votedCount === totalCategories

  // Rozet & selamlama
  const userBadge = getBadge(stats.written_count)
  const greetingData = getDetailedGreeting(userProfile.first_name || "")

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

          {deadlineDate && <CountdownCard deadlineDate={deadlineDate} />}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">
          {graduationDate && (
            <LockedCard
              receivedCount={stats.received_count}
              deadline={graduationDate}
              schoolNumber={userProfile.school_number}
              userYear={userProfile.user_year}
            />
          )}

          <Suspense fallback={<SurveyCardSkeleton />}>
            <SurveyCard userId={user!.id} />
          </Suspense>

          <SuggestionCard suggestion={suggestion} />
        </div>
      </div>
    </div>
  )
}