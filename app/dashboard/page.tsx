import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  FileText,
  Plus,
  LogOut,
  Sparkles,
  ShieldAlert,
  Quote,
  ChevronRight,
  School,
  UserPlus,
  Zap,
  Clock
} from "lucide-react"

interface Text {
  id: string
  recipient_id: string
  content: string
  created_at: string
  updated_at: string
  recipient_profile: {
    first_name: string
    last_name: string
    class: string
  }
}

// Avatar Renkleri
const getAvatarColor = (name: string) => {
  const colors = [
    "bg-red-100 text-red-700", "bg-orange-100 text-orange-700", "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700", "bg-emerald-100 text-emerald-700", "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700", "bg-blue-100 text-blue-700", "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700", "bg-purple-100 text-purple-700", "bg-fuchsia-100 text-fuchsia-700",
    "bg-pink-100 text-pink-700", "bg-rose-100 text-rose-700",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Zaman bazlı selamlama
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Günaydın"
  if (hour < 18) return "Tünaydın"
  return "İyi Akşamlar"
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

  // İstatistikler ve Hesaplamalar
  const writtenRecipientIds = texts?.map((t) => t.recipient_id) || []
  const classmateIds = classmates?.map((c) => c.id) || []

  // Henüz yazılmamış kişiler (Öneri sistemi için)
  const unwrittenClassmates = classmates?.filter(c => !writtenRecipientIds.includes(c.id)) || []
  const suggestedClassmate = unwrittenClassmates.length > 0
    ? unwrittenClassmates[Math.floor(Math.random() * unwrittenClassmates.length)]
    : null

  const requiredWritten = classmateIds.filter((id) => writtenRecipientIds.includes(id)).length
  const requiredTotal = classmateIds.length
  const progressPercentage = requiredTotal > 0 ? Math.round((requiredWritten / requiredTotal) * 100) : 0
  const isRequiredComplete = requiredWritten === requiredTotal

  // Toplam Kelime Sayısı (Gamification)
  const totalWords = texts?.reduce((acc, curr) => acc + (curr.content?.split(" ").length || 0), 0) || 0

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 font-serif leading-none">
                EGL Yıllık
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide">2026 MEZUNİYETİ</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {userProfile?.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 transition-all shadow-sm">
                  <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                  Yönetim
                </Button>
              </Link>
            )}

            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-800 leading-none">
                {userProfile?.first_name} {userProfile?.last_name}
              </span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/5 px-1.5 py-0.5 rounded mt-1">
                {userProfile?.class}
              </span>
            </div>

            <form action={handleSignOut}>
              <Button variant="ghost" size="icon" type="submit" className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Hero Section: Grid Layout for Stats & Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* Sol Kolon: İlerleme ve Selamlama (2 birim genişlik) */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-emerald-50/50 opacity-40 pointer-events-none" />

            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-2 text-primary/80 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{getGreeting()}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-slate-800 mb-4">
                {userProfile?.first_name}
              </h2>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed">
                <span className="font-semibold text-slate-900">{userProfile?.class}</span> sınıfında anılarınla iz bırakıyorsun. Şu ana kadar <span className="text-primary font-bold">{totalWords}</span> kelimelik hatıra biriktirdin.
              </p>
            </div>

            {/* Progress Bar Alt Kısım */}
            <div className="relative bg-slate-50/80 border-t border-slate-100 p-6 sm:px-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-semibold text-slate-700">Sınıf Tamamlama Oranı</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">{requiredWritten}</span>
                  <span className="text-sm text-slate-400 font-medium">/{requiredTotal}</span>
                </div>
              </div>
              <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${isRequiredComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Akıllı Öneri Kartı (1 birim genişlik) */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col h-full">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Zap className="h-24 w-24 text-amber-500" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Sıradaki Kişi
            </h3>

            {suggestedClassmate ? (
              <div className="flex-1 flex flex-col justify-between">
                <p className="text-slate-500 text-sm mb-6">
                  Henüz <strong>{suggestedClassmate.first_name}</strong> için bir anı yazmadın. Ona güzel bir hatıra bırakmaya ne dersin?
                </p>

                <div className="mt-auto">
                  <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(suggestedClassmate.first_name)}`}>
                      {suggestedClassmate.first_name[0]}{suggestedClassmate.last_name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{suggestedClassmate.first_name} {suggestedClassmate.last_name}</div>
                      <div className="text-xs text-slate-400">{suggestedClassmate.school_number}</div>
                    </div>
                  </div>

                  {/* Bunu query params ile New sayfasına taşıyabilirsin, şimdilik direkt New'e gidiyor */}
                  <Link href="/new">
                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Ona Yazmaya Başla
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-slate-600 font-medium">Tebrikler!</p>
                <p className="text-slate-400 text-xs mt-1">Sınıfındaki herkese yazdın.</p>
              </div>
            )}
          </div>
        </div>

        {/* Yazdıklarım Başlık ve Buton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              Anı Defterin
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Toplam {texts?.length || 0} anı biriktirdin.
            </p>
          </div>
          <Link href="/new">
            <Button className="w-full sm:w-auto shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Anı Yaz
            </Button>
          </Link>
        </div>

        {textsError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100 mb-6 flex items-center">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Bir hata oluştu: {textsError.message}
          </div>
        )}

        {/* Anı Listesi */}
        {texts && texts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4 ring-1 ring-slate-100">
              <Sparkles className="h-8 w-8 text-amber-400 fill-amber-100 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Henüz kimseye yazmadın</h3>
            <p className="text-sm text-slate-500 mb-8 max-w-[280px]">
              Ertuğrulgazi Lisesi hatıralarını ölümsüzleştirmek için ilk adımı at.
            </p>
            <Link href="/new">
              <Button variant="outline" className="border-slate-300 hover:bg-white hover:text-primary">
                İlk Anını Paylaş
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {texts?.map((text: Text, index) => {
              const initials = `${text.recipient_profile.first_name[0]}${text.recipient_profile.last_name[0]}`.toUpperCase();
              const fullName = `${text.recipient_profile.first_name} ${text.recipient_profile.last_name}`;
              const avatarColorClass = getAvatarColor(fullName);

              return (
                <Card
                  key={text.id}
                  className="group hover:-translate-y-1 transition-all duration-300 border-slate-200/60 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-primary/20 bg-white overflow-hidden flex flex-col"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center gap-3 space-y-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shadow-inner ring-2 ring-white ${avatarColorClass}`}>
                      {initials}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-slate-800 truncate text-sm">
                        {fullName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-slate-100 text-slate-500 font-normal">
                          {text.recipient_profile.class}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-3 flex-1 relative">
                    <Quote className="absolute top-2 left-3 h-6 w-6 text-slate-100 -z-10 fill-slate-50 transform -scale-x-100" />
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 relative z-0">
                      {text.content}
                    </p>
                  </CardContent>

                  <CardFooter className="px-5 py-4 pt-0 flex items-center justify-between border-t border-slate-50 mt-3 bg-slate-50/30">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center">
                      {new Date(text.updated_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long' })}
                    </span>
                    <Link href={`/edit/${text.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:text-primary hover:bg-white group-hover:shadow-sm group-hover:pr-1 transition-all">
                        Düzenle
                        <ChevronRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}