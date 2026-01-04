import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, Plus, LogOut, Edit, Users, CheckCircle } from "lucide-react"

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

interface Profile {
  id: string
  first_name: string
  last_name: string
  school_number: string
  class: string
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
  .eq("author_id", user.id) // KRİTİK EKLEME: Sadece kendi yazdıklarını filtreler
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
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Okul Yıllığı</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {userProfile?.first_name} {userProfile?.last_name} ({userProfile?.class})
            </span>
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sınıf Arkadaşlarına Yazma İlerlemesi
                </CardTitle>
                <CardDescription>
                  {userProfile?.class} sınıfındaki tüm arkadaşlarınıza yazmanız zorunludur
                </CardDescription>
              </div>
              {isRequiredComplete && <CheckCircle className="h-8 w-8 text-green-500" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Tamamlanan: {requiredWritten} / {requiredTotal}
                </span>
                <Badge variant={isRequiredComplete ? "default" : "secondary"}>
                  {isRequiredComplete ? "Tamamlandı" : "Devam Ediyor"}
                </Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${requiredTotal > 0 ? (requiredWritten / requiredTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Yazdıklarım</h2>
            <p className="text-muted-foreground">Yazdığın mesajları görüntüle ve düzenle</p>
          </div>
          <Link href="/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Metin
            </Button>
          </Link>
        </div>

        {textsError && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Hata: {textsError.message}
          </div>
        )}

        {texts && texts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Henüz metin yazmadın</h3>
              <p className="mb-4 text-sm text-muted-foreground text-center">Sınıf arkadaşlarına yazarak başla</p>
              <Link href="/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Metni Yaz
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {texts && texts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {texts.map((text: Text) => (
              <Card key={text.id} className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {text.recipient_profile.first_name} {text.recipient_profile.last_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {text.recipient_profile.class}
                    </Badge>
                    <span className="text-xs">{new Date(text.updated_at).toLocaleDateString("tr-TR")}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{text.content}</p>
                  <Link href={`/edit/${text.id}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
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
