import { redirect } from "next/navigation"
export const dynamic = "force-dynamic"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import DashboardGrid from "@/components/dashboard-grid"
import { ModeToggle } from "@/components/mode-toggle"
import RoleGuard from "@/components/role-guard"
import { ROLES, getIstanbulISOString } from "@/lib/constants"
import { getFullName } from "@/lib/utils"
import Footer from "@/components/footer"
import {
  FileText,
  Plus,
  LogOut,
  Sparkles,
  ShieldAlert,
  UserPlus,
  Clock,
  Lock,
  Heart,
  Star,
  Zap,
  Shield,
  Award,
  User,
  Vote,
  TrendingUp,
  ChevronRight,
  PenLine,
  MessageCircle,
  Users
} from "lucide-react"

const getGreeting = () => {
  const hour = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false })
  const hourNum = parseInt(hour, 10)
  if (hourNum < 12) return "Günaydın"
  if (hourNum < 18) return "Tünaydın"
  return "İyi Akşamlar"
}

const getBadge = (count: number) => {
  if (count >= 30) return {
    label: "Yıllık Efsanesi",
    color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg shadow-purple-500/40",
    icon: <Star className="h-3 w-3 mr-1" />
  }
  if (count >= 15) return {
    label: "Hatıra Mimarı",
    color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40",
    icon: <Zap className="h-3 w-3 mr-1" />
  }
  if (count >= 5) return {
    label: "Anı Yazarı",
    color: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/40",
    icon: <Heart className="h-3 w-3 mr-1" />
  }
  return {
    label: "Yeni Üye",
    color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md",
    icon: <Sparkles className="h-3 w-3 mr-1" />
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

  const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  supabase
    .from("profiles")
    .update({ last_active: getIstanbulISOString() })
    .eq("id", user.id)
    .then(() => { })

  const { data: classmates } = await supabase
    .from("profiles")
    .select("*")
    .eq("class", userProfile?.class)
    .neq("id", user.id)

  const { data: texts, error: textsError } = await supabase
    .from("texts")
    .select(`
      *,
      recipient_profile:recipient_id (
        first_name,
        last_name,
        class,
        school_number
      )
    `)
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false })

  let receivedCount = 0
  try {
    const { data, error } = await supabase.rpc('get_my_received_count')
    if (!error) receivedCount = data || 0
  } catch (e) {
    console.error("Sayaç hatası:", e)
  }

  const { data: categories } = await supabase
    .from("survey_categories")
    .select("id, title, emoji, description, color")
    .eq("is_active", true)

  const totalCategories = categories?.length || 0

  const { data: userVotes } = await supabase
    .from("survey_votes")
    .select("category_id")
    .eq("voter_id", user.id)

  const votedCategoryIds = userVotes?.map(v => v.category_id) || []
  const votedCount = votedCategoryIds.length
  const surveyPercentage = totalCategories > 0 ? Math.round((votedCount / totalCategories) * 100) : 0
  const isSurveyComplete = votedCount === totalCategories

  const unvotedCategories = categories?.filter(c => !votedCategoryIds.includes(c.id)) || []
  const featuredSurvey = unvotedCategories.length > 0
    ? unvotedCategories[Math.floor(Math.random() * unvotedCategories.length)]
    : null

  const writtenRecipientIds = texts?.map((t) => t.recipient_id) || []
  const classmateIds = classmates?.map((c) => c.id) || []

  const unwrittenClassmates = classmates?.filter(c => !writtenRecipientIds.includes(c.id)) || []
  const suggestedClassmate = unwrittenClassmates.length > 0
    ? unwrittenClassmates[Math.floor(Math.random() * unwrittenClassmates.length)]
    : null

  const requiredWritten = classmateIds.filter((id) => writtenRecipientIds.includes(id)).length
  const requiredTotal = classmateIds.length
  const progressPercentage = requiredTotal > 0 ? Math.round((requiredWritten / requiredTotal) * 100) : 0
  const isRequiredComplete = requiredWritten === requiredTotal
  const totalWords = texts?.reduce((acc, curr) => acc + (curr.content?.split(" ").length || 0), 0) || 0
  const userBadge = getBadge(texts?.length || 0)

  const lastText = texts && texts.length > 0 ? texts[0] : null
  const lastTextDate = lastText ? new Date(lastText.updated_at) : null

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300 font-sans">

      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-6000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 shadow-lg">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-opacity"></div>
              <img src="/image.png" className="h-7 w-7 sm:h-9 sm:w-9 relative" alt="Logo" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold font-serif leading-none bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                EGL Yıllık
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden xs:block">2026</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <RoleGuard minLevel={ROLES.KAMIL}>
              <Link href="/admin">
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 sm:h-9 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105"
                >
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Yönetim Paneli</span>
                </Button>
              </Link>
            </RoleGuard>

            <ModeToggle />

            <Link href={`/profile/${userProfile?.school_number}`} className="hidden md:flex flex-col items-end mr-2 min-w-0 hover:opacity-80 transition-opacity cursor-pointer group">
              <span className="text-sm font-bold leading-none text-slate-800 dark:text-slate-100 truncate max-w-[120px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {getFullName(userProfile?.first_name, userProfile?.last_name)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {userProfile?.class}
              </span>
            </Link>

            <Link href={`/profile/${userProfile?.school_number}`} className="md:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            <form action={handleSignOut}>
              <Button
                variant="ghost"
                size="icon"
                type="submit"
                className="h-8 w-8 sm:h-9 sm:w-9 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </form>
          </div>
        </div>

        <div className="md:hidden border-t border-indigo-100/50 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {getFullName(userProfile?.first_name, userProfile?.last_name)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 flex-shrink-0">
              {userProfile?.class}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Enhanced Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-indigo-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <PenLine className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{texts?.length || 0}</p>
                <p className="text-xs text-slate-500 font-medium">Yazılan</p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalWords}</p>
                <p className="text-xs text-slate-500 font-medium">Kelime</p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Vote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{votedCount}/{totalCategories}</p>
                <p className="text-xs text-slate-500 font-medium">Anket</p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-amber-200/50 dark:border-slate-700/50 p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">%{progressPercentage}</p>
                <p className="text-xs text-slate-500 font-medium">İlerleme</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Responsive Theme Profile Card */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 shadow-2xl group transition-all duration-300 hover:shadow-indigo-500/20 bg-white dark:bg-transparent">

              {/* Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81] transition-colors duration-500"></div>

              {/* Glow Effects (Dark Mode Only) */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -ml-16 -mb-16 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500"></div>

              <div className="relative p-8 pb-6 z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/20 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-200 text-xs font-medium backdrop-blur-md shadow-sm transition-colors">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getGreeting()}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <h1 className="text-5xl font-black text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-indigo-100 dark:to-indigo-200 tracking-tight font-serif drop-shadow-sm transition-colors">
                      {userProfile?.first_name}
                    </h1>
                    {/* Assuming isAdmin, profile.role, and profile.class_name are defined elsewhere or need to be adapted */}
                    {/* For now, using userBadge for consistency with original code */}
                    <Badge className={`${userBadge.color} flex items-center px-4 py-2 text-sm shadow-xl hover:scale-105 transition-transform`}>
                      {userBadge.icon}
                      {userBadge.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-lg text-slate-600 dark:text-indigo-200/80 font-medium leading-relaxed transition-colors">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 text-indigo-700 dark:text-white font-bold shadow-sm transition-colors">
                      {userProfile?.class || "12-?"}
                    </span>
                    <span>sınıfında anılarınla iz bırakıyorsun.</span>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
                    <span>Şu ana kadar</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold font-mono transition-colors">
                      {totalWords}
                    </span>
                    <span>kelimelik hatıra biriktirdin.</span>
                  </div>
                </div>
              </div>

              {/* Progress Section (Combined - Responsive) */}
              <div className="relative bg-slate-50/80 dark:bg-[#0b1021]/60 backdrop-blur-md border-t border-indigo-100 dark:border-indigo-500/20 p-8 z-10 flex flex-col gap-6 transition-colors">

                {/* 1. Yazı Tamamlama Oranı */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors">
                      <PenLine className="h-4 w-4 text-indigo-400" />
                      Yazı Görevi
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-indigo-400">{requiredWritten}</span>
                      <span className="text-xs text-slate-500 font-medium">/{requiredTotal}</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden ${isRequiredComplete
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                        }`}
                      style={{ width: `${progressPercentage}%` }}
                    >
                    </div>
                  </div>
                </div>

                {/* 2. Anket Tamamlama Oranı (Alt Alta) */}
                <Link href="/surveys" className="group block hover:opacity-80 transition-opacity">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <Vote className="h-4 w-4 text-emerald-500" />
                      Anket Oyları <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-xs text-emerald-400 font-normal">(Görüntüle)</span>
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-emerald-400">{votedCount}</span>
                      <span className="text-xs text-slate-500 font-medium">/{totalCategories}</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 cursor-pointer">
                    <div
                      className={`h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden ${isSurveyComplete
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                      style={{ width: `${surveyPercentage}%` }}
                    >
                    </div>
                  </div>
                </Link>

                {/* Ortak Durum Mesajı */}
                <div className="text-sm text-slate-400 mt-2 text-center font-medium border-t border-white/5 pt-4">
                  {isRequiredComplete && isSurveyComplete
                    ? "🎉 Harikasın! Tüm görevleri tamamladın!"
                    : "Mezuniyet yıllığını oluşturmak için görevleri tamamla."}
                </div>
              </div>
            </div>


            {/* Midnight Theme Countdown Card */}
            {(() => {
              const deadlineDate = new Date(2026, 1, 9, 23, 59, 59)
              const now = new Date()
              const diffTime = deadlineDate.getTime() - now.getTime()
              const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
              const formattedDate = deadlineDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
              const isUrgent = daysLeft <= 7 && daysLeft > 0
              const isPassed = daysLeft === 0

              return (
                <div className={`relative overflow-hidden rounded-3xl border-2 shadow-2xl transition-all duration-300 group bg-white dark:bg-transparent ${isPassed
                  ? 'border-red-100 bg-red-50 dark:bg-gradient-to-br dark:from-red-950 dark:via-red-900 dark:to-red-950 dark:border-red-800/50'
                  : isUrgent
                    ? 'border-amber-100 bg-amber-50 dark:bg-gradient-to-br dark:from-amber-950 dark:via-orange-900 dark:to-amber-950 dark:border-amber-600/50'
                    : 'border-indigo-100 dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81] dark:border-indigo-500/30' // Responsive Theme
                  }`}>

                  {/* Background Glow Effects (Dark Mode) */}
                  {!isPassed && !isUrgent && (
                    <>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none opacity-0 dark:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -ml-16 -mb-16 pointer-events-none opacity-0 dark:opacity-100 transition-opacity"></div>
                    </>
                  )}

                  <div className="relative p-8 z-10 flex flex-col sm:flex-row items-center justify-between gap-6">

                    {/* Sol Taraf: Bilgi */}
                    <div className="flex-1 text-center sm:text-left text-slate-800 dark:text-white transition-colors">
                      <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                        <div className={`p-3 rounded-xl backdrop-blur-md shadow-lg ${isPassed
                          ? 'bg-red-500/20 text-red-200'
                          : 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30'}`}>
                          <Clock className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold tracking-wide">
                          Son Teslim Tarihi
                        </h3>
                      </div>
                      <p className="text-base text-slate-300/90 font-medium">
                        {formattedDate} tarihine kadar anılarını tamamla.
                      </p>
                      <p className={`text-sm mt-3 font-bold flex items-center justify-center sm:justify-start gap-2 ${isPassed ? 'text-red-400' : 'text-indigo-300'}`}>
                        {isPassed ? 'Süre doldu!' : '⏳ Zaman daralıyor!'}
                      </p>
                    </div>

                    {/* Sağ Taraf: Sayaç */}
                    <div className="flex-shrink-0">
                      <div className={`rounded-2xl p-6 min-w-[140px] text-center border backdrop-blur-md shadow-xl transition-all group-hover:scale-105 ${isPassed
                        ? 'bg-red-50 border-red-100 dark:bg-red-950/50 dark:border-red-500/30'
                        : 'bg-indigo-50 border-indigo-100 dark:bg-white/5 dark:border-white/10 dark:ring-1 dark:ring-white/5'}`}>
                        <div className={`text-6xl font-black font-mono tracking-tighter drop-shadow-lg ${isPassed
                          ? 'text-red-500'
                          : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70'}`}>
                          {daysLeft}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
                          Gün Kaldı
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )
            })()}
          </div>

          {/* Right Column - Enhanced Cards */}
          <div className="flex flex-col gap-5">

            {/* Enhanced Locked Card */}
            <div className="relative rounded-2xl border-2 border-slate-700 dark:border-slate-800 overflow-hidden group shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-black dark:via-indigo-950 dark:to-purple-950"></div>

              <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-white/10 transition-all duration-500">
                <Lock size={120} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500" />
              </div>

              <div className="relative z-10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30">
                    <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Gizli Kasa</h3>
                  </div>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-5xl font-bold font-serif text-white drop-shadow-2xl">{receivedCount}</span>
                  <span className="text-base text-slate-200 font-medium mb-2">kişi sana yazdı</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-amber-500/20 mt-4 shadow-lg">
                  <Lock className="h-4 w-4 text-amber-400 animate-pulse" />
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    Mezuniyet günü kilitler açılacak!
                  </p>
                </div>
              </div>
            </div>



            {/* Enhanced Featured Survey Card */}
            {featuredSurvey && (
              <div className="relative rounded-2xl border-2 border-indigo-300 dark:border-indigo-800 overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full -ml-12 -mb-12"></div>

                <div className="relative p-6 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-3 py-1.5 shadow-md">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-500 animate-pulse" />
                      Günün Sorusu
                    </Badge>
                  </div>

                  <div className="text-center py-3">
                    <span className="text-6xl block mb-4 filter drop-shadow-lg hover:scale-110 transition-transform cursor-default select-none">
                      {featuredSurvey.emoji}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {featuredSurvey.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-5">
                      Sence bu kişi kim?
                    </p>

                    <Link href={`/surveys/${featuredSurvey.id}`} className="block">
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-[1.02] transition-transform">
                        Seçimini Yap <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Suggestion Card */}
            {suggestedClassmate ? (
              <div className="relative rounded-2xl border-2 border-amber-300/60 dark:border-amber-900/40 overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>

                <div className="relative p-6 z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400 shadow-md">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
                      Sıradaki: {suggestedClassmate.first_name}
                    </h3>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-5 pl-1">
                    Ona güzel bir anı bırakmaya ne dersin?
                  </p>
                  <Link href={`/new?recipientId=${suggestedClassmate.id}`}>
                    <Button
                      size="sm"
                      className="w-full h-10 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 border-0 transition-all hover:scale-[1.02]"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Yazmaya Başla
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-200 dark:border-emerald-900 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>

                <div className="relative p-6 flex flex-col items-center justify-center text-center z-10">
                  <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-2xl mb-4 text-emerald-600 dark:text-emerald-400 shadow-lg">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <p className="text-base font-bold text-emerald-800 dark:text-emerald-200">Tebrikler! 🎉</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Sınıfı tamamladın!</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Enhanced Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-bold font-serif text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg shadow-purple-500/30">
                <FileText className="h-6 w-6" />
              </div>
              Anı Defterin
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 pl-1">
              {lastTextDate ? (
                <>Son yazın: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastTextDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span></>
              ) : (
                'Yazdığın tüm anılar burada. ✨'
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href={`/profile/${userProfile?.school_number}`}>
              <Button variant="outline" className="w-full sm:w-auto border-2 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                <User className="mr-2 h-4 w-4" />
                <span className="font-semibold">Profilim</span>
              </Button>
            </Link>
            <Link href="/surveys">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                <Award className="mr-2 h-4 w-4" />
                <span className="font-semibold">Anketler</span>
              </Button>
            </Link>
            <Link href="/school">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                <Users className="mr-2 h-4 w-4" />
                <span className="font-semibold">Okul Listesi</span>
              </Button>
            </Link>
            <Link href="/new">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl border-0">
                <Plus className="mr-2 h-5 w-5" />
                <span className="font-bold">Yeni Anı Yaz</span>
              </Button>
            </Link>
          </div>
        </div>

        {textsError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/10 px-5 py-4 text-sm border-2 border-red-200 dark:border-red-900/20 mb-6 flex items-center shadow-md">
            <ShieldAlert className="h-5 w-5 mr-3 text-red-600" />
            <span className="text-red-700 dark:text-red-400 font-semibold">Bir hata oluştu: {textsError.message}</span>
          </div>
        )}

        {/* @ts-ignore */}
        <DashboardGrid texts={texts || []} />

      </main>
      <Footer />
    </div>
  )
}