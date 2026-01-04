import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NewTextForm from "@/components/new-text-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

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

  const writtenRecipientIds =
    existingTexts?.map((t) => t.recipient_id) ?? []

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
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Okul Yıllığı</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Panele Dön
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">
              Yeni Metin Yaz
            </h2>
            <p className="text-muted-foreground">
              Arkadaşlarından birine anlamlı bir mesaj yaz
            </p>
          </div>

          <NewTextForm
            classmates={classmates}
            others={others}
            userClass={userProfile.class}
          />
        </div>
      </main>
    </div>
  )
}