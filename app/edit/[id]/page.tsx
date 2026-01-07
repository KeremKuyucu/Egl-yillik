import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import EditTextForm from "@/components/edit-text-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, User, Calendar, PenLine, Edit3, Sparkles, History, Heart, X } from "lucide-react"

export default async function EditTextPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: text, error: textError } = await supabase
    .from("texts")
    .select(`
      *,
      recipient_profile:recipient_id (
        first_name,
        last_name,
        class
      )
    `)
    .eq("id", id)
    .single()

  if (textError || !text || text.author_id !== user.id) {
    redirect("/dashboard")
  }

  // Veri güvenliği kontrolü
  const profileData = Array.isArray(text.recipient_profile)
    ? text.recipient_profile[0]
    : text.recipient_profile

  const recipientName = profileData
    ? `${profileData.first_name} ${profileData.last_name}`
    : "Bilinmeyen Öğrenci"

  const recipientClass = profileData?.class || "Sınıf Yok"

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-950 dark:via-violet-950/20 dark:to-purple-950/20">
      {/* Mobile-First Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-10 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-10 w-64 h-64 sm:w-96 sm:h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Mobile-Optimized Header */}
      <header className="border-b border-border/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-purple-500/5">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 gap-2">
          {/* Compact Logo/Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
              <PenLine className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent text-base sm:text-lg leading-tight block truncate">
                Düzenle
              </span>
            </div>
          </div>

          {/* Mobile Action Button */}
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 h-8 sm:h-9 px-2 sm:px-3"
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

      <main className="px-3 sm:px-4 py-4 sm:py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Mobile-First Recipient Card */}
          <Card className="border-2 border-purple-200 dark:border-purple-800/50 shadow-lg overflow-hidden p-0">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 dark:from-violet-950/50 dark:via-purple-950/50 dark:to-fuchsia-950/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-white to-purple-50 dark:from-slate-900 dark:to-purple-950 border-2 border-purple-300 dark:border-purple-700 flex items-center justify-center shadow-md shrink-0">
                    <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent truncate">
                      {recipientName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs h-5">
                        {recipientClass}
                      </Badge>
                      <span className="text-xs text-muted-foreground dark:text-slate-300">için anı</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Date Badge */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(text.updated_at).toLocaleDateString("tr-TR", {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Mobile Form Card */}
          <Card className="border-2 border-transparent shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 border-b border-purple-200/50 dark:border-purple-800/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Anını Düzenle
                </h3>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6">
              <EditTextForm text={text} />
            </CardContent>
          </Card>

          {/* Mobile Tip Card */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Dikkat:</span> Değişiklikler kaydedildikten sonra geri alınamaz.
              </p>
            </div>
          </div>

          {/* Mobile Bottom Spacing for FAB */}
          <div className="h-20 sm:h-0"></div>
        </div >
      </main >
    </div >
  )
}