import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import EditTextForm from "@/components/edit-text-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, User, Calendar, PenLine, Edit3, Sparkles, X, AlertTriangle } from "lucide-react"
import { isMessagingEnabled } from "@/lib/settings"

export default async function EditTextPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Sistem kontrolü
  const messagingEnabled = await isMessagingEnabled()
  if (!messagingEnabled) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Düzenleme Kapalı</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Anı düzenleme ve silme işlemleri şu an için sistem yöneticisi tarafından durdurulmuştur.
          </p>
          <Link href="/dashboard">
            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>
    )
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header/Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <PenLine className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white">
            Düzenle
          </span>
        </div>

        <Link href="/dashboard" prefetch={false}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-purple-600">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">İptal</span>
          </Button>
        </Link>
      </div>

      <div className="mx-auto max-w-2xl space-y-4">

        {/* Recipient Card */}
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

        {/* Date Badge */}
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

        {/* Form Card */}
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

        {/* Tip Card */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">Dikkat:</span> Değişiklikler kaydedildikten sonra geri alınamaz.
            </p>
          </div>
        </div>

      </div >
    </div >
  )
}