import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, Plus, LogOut, Edit, Users, CheckCircle, ShieldAlert } from "lucide-react"

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

  const writtenRecipientIds = texts?.map((t) => t.recipient_id) || []
  const classmateIds = classmates?.map((c) => c.id) || []
  const requiredWritten = classmateIds.filter((id) => writtenRecipientIds.includes(id)).length
  const requiredTotal = classmateIds.length
  const isRequiredComplete = requiredWritten === requiredTotal

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight text-slate-800 font-serif">EGL Yıllık</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* ADMIN ÖZEL BUTONU */}
            {userProfile?.role === "admin" && (
              <Link href="/admin">
                <Button variant="secondary" size="sm" className="hidden md:flex bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Admin Paneli
                </Button>
              </Link>
            )}

            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium leading-none">
                {userProfile?.first_name} {userProfile?.last_name}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                {userProfile?.class}
              </span>
            </div>

            <form action={handleSignOut}>
              <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Sınıf İlerlemesi Kartı */}
        <Card className="mb-8 border-none shadow-sm bg-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-serif">
                  <Users className="h-5 w-5 text-primary" />
                  Sınıf Arkadaşların
                </CardTitle>
                <CardDescription>
                  {userProfile?.class} sınıfındaki herkese anı bırakmayı unutma.
                </CardDescription>
              </div>
              {isRequiredComplete && (
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  İlerleme: %{requiredTotal > 0 ? Math.round((requiredWritten / requiredTotal) * 100) : 0}
                </span>
                <Badge variant={isRequiredComplete ? "default" : "outline"} className={isRequiredComplete ? "bg-green-600" : ""}>
                  {requiredWritten} / {requiredTotal} Kişi
                </Badge>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full transition-all duration-500 ${isRequiredComplete ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${requiredTotal > 0 ? (requiredWritten / requiredTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yazdıklarım Başlık ve Ekleme */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Yazdıklarım</h2>
            <p className="text-sm text-muted-foreground">Şu ana kadar eklediğin hatıralar</p>
          </div>
          <Link href="/new">
            <Button className="shadow-md hover:shadow-lg transition-shadow">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Anı Ekle
            </Button>
          </Link>
        </div>

        {textsError && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 mb-6">
            Hata oluştu: {textsError.message}
          </div>
        )}

        {/* Metin Listesi */}
        {texts && texts.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Henüz bir şey yazmadın</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-[250px]">
                Ertuğrulgazi Lisesi hatıralarını biriktirmeye başla!
              </p>
              <Link href="/new">
                <Button variant="outline">İlk Metni Yaz</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {texts?.map((text: Text) => (
              <Card key={text.id} className="group hover:ring-2 hover:ring-primary/20 transition-all border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-md font-bold">
                        {text.recipient_profile.first_name} {text.recipient_profile.last_name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                        {text.recipient_profile.class}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(text.updated_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-slate-600 italic">
                    "{text.content}"
                  </p>
                  <Link href={`/edit/${text.id}`}>
                    <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-primary/10 hover:text-primary">
                      <Edit className="mr-2 h-3 w-3" />
                      Düzenle
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
