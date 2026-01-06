import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import EditTextForm from "@/components/edit-text-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, User, Calendar, Quote } from "lucide-react"

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

  // Veriyi çekerken recipient bilgilerini alıyoruz
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

  // GÜVENLİK KONTROLÜ: Supabase bazen ilişkileri dizi (array) olarak döndürebilir.
  // Bu kontrol sayesinde veri array de gelse obje de gelse doğru ismi alırız.
  const profileData = Array.isArray(text.recipient_profile)
    ? text.recipient_profile[0]
    : text.recipient_profile;

  const recipientName = profileData
    ? `${profileData.first_name} ${profileData.last_name}`
    : "Bilinmeyen Öğrenci";

  const recipientClass = profileData?.class || "Sınıf Yok";

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="font-serif font-bold text-primary text-lg">E</span>
            </div>
            <span className="font-bold text-slate-900 tracking-tight hidden sm:block">Düzenleme Modu</span>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vazgeç ve Dön
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto max-w-2xl">

          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold font-serif text-slate-900">Anıyı Düzenle</h1>
            <div className="flex items-center text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              {new Date(text.updated_at).toLocaleDateString("tr-TR")}
            </div>
          </div>

          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
            {/* Vurgulu Üst Kısım: Alıcı Bilgisi */}
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 shrink-0">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{recipientName}</h3>
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-600 hover:bg-white">
                    {recipientClass}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Quote className="h-3 w-3 text-primary" />
                  <span>Bu kişiye yazdığın anıyı güncelliyorsun.</span>
                </div>
              </div>
            </div>

            <CardContent className="p-6 sm:p-8">
              {/* Form Componenti Buraya Geliyor */}
              <EditTextForm text={text} />
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-6">
            Değişiklikleri kaydettiğinde arkadaşın bildirim alabilir.
          </p>

        </div>
      </main>
    </div>
  )
}