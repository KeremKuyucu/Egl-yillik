import { redirect } from "next/navigation"
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
  Users,
  UserPlus,
  Clock,
  Lock,
  Heart,
  Star,
  Zap,
  Shield
} from "lucide-react"

// Zaman bazlı selamlama
const getGreeting = () => {
  const hour = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false })
  const hourNum = parseInt(hour, 10)
  if (hourNum < 12) return "Günaydın"
  if (hourNum < 18) return "Tünaydın"
  return "İyi Akşamlar"
}

// ROZET SİSTEMİ
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

  // Son aktiflik zamanını güncelle (arka planda, sayfa yüklemesini bekletmez)
  supabase
    .from("profiles")
    .update({ last_active: getIstanbulISOString() })
    .eq("id", user.id)
    .then(() => { /* güncelleme tamamlandı */ })

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
        class
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

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300 font-sans">

      {/* Animated Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <div className="relative">
              <img src="/image.png" className="h-7 w-7 sm:h-9 sm:w-9" alt="Logo" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold font-serif leading-none bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                EGL Yıllık
              </h1>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden xs:block">2026</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Admin Button */}
            <RoleGuard minLevel={ROLES.KAMIL}>
              <Link href="/admin">
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 sm:h-9 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-purple-500/20"
                >
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Yönetim Paneli</span>
                </Button>
              </Link>
            </RoleGuard>

            <ModeToggle />

            {/* User Info - Desktop */}
            <div className="hidden md:flex flex-col items-end mr-2 min-w-0">
              <span className="text-sm font-bold leading-none text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                {getFullName(userProfile?.first_name, userProfile?.last_name)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {userProfile?.class}
              </span>
            </div>

            {/* Logout Button */}
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

        {/* Mobile User Info */}
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

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* Sol Kolon - Ana Kart */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur-2xl flex flex-col justify-between group">

            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-indigo-950/30 dark:to-pink-950/30 pointer-events-none"></div>

            <div className="relative p-6 sm:p-8 z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">{getGreeting()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h2 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 dark:text-white drop-shadow-sm">
                  {userProfile?.first_name}
                </h2>
                <Badge className={`${userBadge.color} flex items-center px-3 py-1 text-sm shadow-md`}>
                  {userBadge.icon}
                  {userBadge.label}
                </Badge>
              </div>

              <p className="text-slate-700 dark:text-slate-200 max-w-lg text-base leading-relaxed font-medium">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{userProfile?.class}</span> sınıfında anılarınla iz bırakıyorsun. Şu ana kadar{" "}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  {totalWords}
                </span>{" "}
                kelimelik hatıra biriktirdin.
              </p>

              {/* Son Teslim Tarihi - Geri Sayım */}
              {(() => {
                // 9 Şubat 2026 23:59:59 UTC+3 (İstanbul)
                const deadlineDate = new Date(2026, 1, 9, 23, 59, 59) // Ay 0-indexed (1 = Şubat)
                const now = new Date()
                const diffTime = deadlineDate.getTime() - now.getTime()
                const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
                const formattedDate = deadlineDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

                const isUrgent = daysLeft <= 7 && daysLeft > 0
                const isPassed = daysLeft === 0

                return (
                  <div className={`mt-6 p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${isPassed
                    ? 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-950/40 border-red-200 dark:border-red-800'
                    : isUrgent
                      ? 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200 dark:border-amber-800 animate-pulse'
                      : 'bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40 border-indigo-200 dark:border-indigo-800'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isPassed
                          ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                          : isUrgent
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                            : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                          }`}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className={`text-sm font-bold ${isPassed
                          ? 'text-red-700 dark:text-red-300'
                          : isUrgent
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-indigo-700 dark:text-indigo-300'
                          }`}>
                          Son Teslim Tarihi
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${isPassed
                        ? 'text-red-600 dark:text-red-400'
                        : isUrgent
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                        {formattedDate}
                      </span>
                    </div>

                    {/* Geri Sayım Sayacı */}
                    <div className="flex items-center justify-center py-4">
                      <div className="text-center">
                        <div className={`text-5xl font-bold font-mono ${isPassed
                          ? 'text-red-600 dark:text-red-400'
                          : isUrgent
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                          }`}>
                          {daysLeft}
                        </div>
                        <div className={`text-sm font-medium mt-1 ${isPassed
                          ? 'text-red-700 dark:text-red-300'
                          : isUrgent
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-indigo-700 dark:text-indigo-300'
                          }`}>
                          {isPassed ? 'Süre Doldu' : daysLeft === 1 ? 'Gün Kaldı' : 'Gün Kaldı'}
                        </div>
                      </div>
                    </div>

                    {/* Alt Mesaj */}
                    <div className={`text-center text-xs font-medium ${isPassed
                      ? 'text-red-600 dark:text-red-400'
                      : isUrgent
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-indigo-600 dark:text-indigo-400'
                      }`}>
                      {isPassed
                        ? '⏰ Son teslim tarihi geçti!'
                        : isUrgent
                          ? '⚠️ Son günler! Acele et!'
                          : '✨ Anılarını yazmak için bolca zaman var'}
                    </div>
                  </div>
                )
              })()}

              {texts && texts.length === 0 && (
                <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Henüz bir yazım kaydı bulunmamaktadır.</p>
                </div>
              )}
            </div>

            {/* Progress Bar Alt Kısım */}
            <div className="relative bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-700/60 p-6 sm:px-8 z-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Sınıf Tamamlama Oranı</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{requiredWritten}</span>
                  <span className="text-sm text-slate-500 font-medium">/{requiredTotal}</span>
                </div>
              </div>
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden ${isRequiredComplete
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-purple-500/30'
                    }`}
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center font-medium">
                {isRequiredComplete ? "🎉 Tebrikler! Sınıfı tamamladın!" : `%${progressPercentage} tamamlandı`}
              </div>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="flex flex-col gap-6">

            {/* 1. SANA YAZILANLAR KARTI */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 min-h-[160px] group shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-black dark:via-indigo-950 dark:to-purple-950"></div>

              <div className="absolute -right-6 -bottom-6 text-white/5 group-hover:text-white/10 transition-colors duration-500">
                <Lock size={120} className="group-hover:rotate-12 transition-transform duration-500" />
              </div>

              <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gizli Kasa</h3>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-5xl font-bold font-serif text-white drop-shadow-lg">{receivedCount}</span>
                    <span className="text-sm text-slate-200 font-medium mb-2">kişi senin ile ilgili metin yazdı.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/5">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    Mezuniyet günü kilitler açılacak!
                  </p>
                </div>
              </div>
            </div>

            {/* 2. ÖNERİ KARTI */}
            {suggestedClassmate ? (
              <div className="relative rounded-2xl border border-amber-200/50 dark:border-amber-900/30 overflow-hidden flex-1 shadow-lg group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40">
                <div className="relative p-5 flex flex-col justify-between h-full z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                        Sıradaki: {suggestedClassmate.first_name}
                      </h3>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-4 pl-1">
                      Ona güzel bir anı bırakmaya ne dersin?
                    </p>
                  </div>
                  <Link href={`/new?recipientId=${suggestedClassmate.id}`}>
                    <Button
                      size="sm"
                      className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white shadow-md border-0"
                    >
                      <UserPlus className="mr-2 h-3.5 w-3.5" />
                      Yazmaya Başla
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden flex-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                <div className="relative p-5 flex flex-col items-center justify-center text-center h-full z-10">
                  <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full mb-3 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Tebrikler! 🎉</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Sınıfı tamamladın!</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Yazdıklarım Başlık */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold font-serif text-slate-800 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <FileText className="h-5 w-5" />
              </div>
              Anı Defterin
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-1">
              Yazdığın tüm anılar burada. ✨
            </p>
          </div>
          <Link href="/new">
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 border-0">
              <Plus className="mr-2 h-4 w-4" />
              <span className="font-semibold">Yeni Anı Yaz</span>
            </Button>
          </Link>
        </div>

        {textsError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/10 px-4 py-3 text-sm border border-red-200 dark:border-red-900/20 mb-6 flex items-center">
            <ShieldAlert className="h-4 w-4 mr-2 text-red-600" />
            <span className="text-red-700 dark:text-red-400 font-medium">Bir hata oluştu: {textsError.message}</span>
          </div>
        )}

        {/* Client Component */}
        {/* @ts-ignore */}
        <DashboardGrid texts={texts || []} />

      </main>
      <Footer />
    </div>
  )
}