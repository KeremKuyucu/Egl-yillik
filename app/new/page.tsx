import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NewTextForm from "@/components/new-text-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, PenLine, Sparkles, School, Heart, X } from "lucide-react"

interface Profile {
  id: string
  first_name: string
  last_name: string
  class: string
}

export default async function NewTextPage({
  searchParams,
}: {
  searchParams: Promise<{ recipientId?: string }>
}) {
  const { recipientId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Kullanıcı profili
  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !userProfile) {
    redirect("/login")
  }

  // Diğer tüm profiller
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .order("class", { ascending: true })
    .order("first_name", { ascending: true })

  // Kullanıcının daha önce yazdığı metinler
  const { data: existingTexts } = await supabase
    .from("texts")
    .select("recipient_id")
    .eq("author_id", user.id)

  const writtenRecipientIds = existingTexts?.map((t) => t.recipient_id) ?? []

  // Sınıflandırma
  const classmates =
    allProfiles?.filter(
      (p: Profile) =>
        p.class === userProfile.class && !writtenRecipientIds.includes(p.id)
    ) ?? []

  const others =
    allProfiles?.filter(
      (p: Profile) =>
        p.class !== userProfile.class && !writtenRecipientIds.includes(p.id)
    ) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-orange-950/20 dark:to-amber-950/20">
      {/* Mobile-Optimized Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-10 w-64 h-64 sm:w-96 sm:h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 sm:w-96 sm:h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Mobile Header */}
      <header className="border-b border-border/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-orange-500/5">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <PenLine className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent truncate">
              Yeni Anı
            </span>
          </div>

          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 h-8 sm:h-9 px-2 sm:px-3"
            >
              <X className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                İptal
              </span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="px-3 sm:px-4 py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Mobile Hero Section */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center">
              <div className="relative p-3 sm:p-4 bg-gradient-to-br from-white to-orange-50 dark:from-slate-900 dark:to-orange-950 shadow-lg rounded-full border-2 border-orange-200 dark:border-orange-800">
                <PenLine className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500" />
                <Heart className="absolute -top-1 -right-1 h-3 w-3 text-rose-400 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2 px-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 bg-clip-text text-transparent">
                Yeni Bir Anı Bırak
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Sözcüklerin <span className="font-bold text-orange-600">kalıcıdır</span>. Arkadaşların için samimi bir hatıra yaz. ✨
              </p>
            </div>
          </div>

          {/* Mobile Stats */}
          {/*
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800 shadow-sm">
              <Heart className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {classmates.length} Sınıf
              </span>
              <span className="text-xs text-muted-foreground hidden xs:inline">Sınıf</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 border border-purple-200 dark:border-purple-800 shadow-sm">
              <School className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {others.length} Okul
              </span>
              <span className="text-xs text-muted-foreground hidden xs:inline">Diğer</span>
            </div>
          </div>
          */}

          {/* Mobile Form Card */}
          <Card className="border-2 border-orange-200 dark:border-orange-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-100 via-amber-100 to-rose-100 dark:from-orange-950/50 dark:via-amber-950/50 dark:to-rose-950/50 border-b border-orange-200/50 dark:border-orange-800/50 px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Yazım Kuralları
                </span>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                <span className="text-orange-600 dark:text-orange-400 font-bold">Nazik</span>, <span className="text-amber-600 dark:text-amber-400 font-bold">yapıcı</span> ve <span className="text-rose-600 dark:text-rose-400 font-bold">samimi</span> ol.
              </p>
            </div>

            <CardContent className="p-4 sm:p-6">
              <NewTextForm
                classmates={classmates}
                others={others}
                userClass={userProfile.class}
                preSelectedId={recipientId}
              />
            </CardContent>
          </Card>

          {/* Mobile Tip */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">💡 İpucu:</span> Her kelime bir tohum, her anı bir çiçek. Bugün bıraktığın satırlar yarın hatıralar olacak.
              </p>
            </div>
          </div>

          {/* Mobile Bottom Spacing */}
          <div className="h-20 sm:h-0"></div>
        </div>
      </main>
    </div>
  )
}