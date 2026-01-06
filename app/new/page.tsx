import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NewTextForm from "@/components/new-text-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, PenLine, Sparkles, School } from "lucide-react"

interface Profile {
  id: string
  first_name: string
  last_name: string
  class: string
}

export default async function NewTextPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Kullanıcının profili
  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !userProfile) {
    redirect("/login")
  }

  // Diğer tüm profiller
  const { data: allProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .order("class", { ascending: true })
    .order("first_name", { ascending: true })

  if (profilesError) {
    console.error("Profiles error:", profilesError)
  }

  // Kullanıcının daha önce yazdığı metinler
  const { data: existingTexts, error: textsError } = await supabase
    .from("texts")
    .select("recipient_id")
    .eq("author_id", user.id)

  if (textsError) {
    console.error("Texts error:", textsError)
  }

  const writtenRecipientIds = existingTexts?.map((t) => t.recipient_id) ?? []

  // Aynı sınıf (zorunlu)
  const classmates =
    allProfiles?.filter(
      (p: Profile) =>
        p.class === userProfile.class &&
        !writtenRecipientIds.includes(p.id)
    ) ?? []

  // Diğer sınıflar (isteğe bağlı)
  const others =
    allProfiles?.filter(
      (p: Profile) =>
        p.class !== userProfile.class &&
        !writtenRecipientIds.includes(p.id)
    ) ?? []

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dekoratif Arka Plan (Dashboard ile uyumlu) */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <School className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 font-serif">EGL Yıllık</span>
          </div>

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Panele Dön
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mx-auto max-w-2xl">

          {/* Başlık Alanı */}
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-white shadow-sm rounded-full ring-1 ring-slate-100">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <PenLine className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight font-serif text-slate-900">
                Yeni Bir Anı Bırak
              </h2>
              <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                Sözcüklerin kalıcıdır. Arkadaşların için içten ve samimi bir hatıra bırak.
                Unutma, bu satırlar yıl sonunda herkes tarafından okunacak; bu yüzden kalemini özenle kullan.
              </p>
            </div>
          </div>

          {/* Form Kartı */}
          <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
            {/* Üst Bilgi Şeridi */}
            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Yazarken nazik ve yapıcı olmayı unutma.</span>
            </div>

            <CardContent className="p-6 sm:p-8">
              <NewTextForm
                classmates={classmates}
                others={others}
                userClass={userProfile.class}
              />
            </CardContent>
          </Card>

          {/* Alt Bilgi */}
          <p className="text-center text-xs text-slate-400 mt-6">
            Kalan Sınıf Arkadaşı: <span className="font-medium text-slate-600">{classmates.length}</span> kişi
          </p>

        </div>
      </main>
    </div>
  )
}