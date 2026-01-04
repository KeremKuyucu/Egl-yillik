import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Admin kontrolü
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Verileri çekme
  // NOT: author ve recipient aynı tabloya (profiles) baktığı için açık foreign key isimlendirmesi kullanıyoruz.
  const { data: texts, error } = await supabase
    .from("texts")
    .select(
      `
      id,
      content,
      created_at,
      author:profiles!texts_author_id_fkey (
        first_name,
        last_name,
        school_number,
        class
      ),
      recipient:profiles!texts_recipient_id_fkey (
        first_name,
        last_name,
        school_number,
        class
      )
    `
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Veri çekme hatası:", error)
    // Hata durumunda basit bir UI gösterilebilir veya loglanabilir
  }

  // Tip güvenliği için basit bir yardımcı fonksiyon (optional)
  const formatName = (person: any) => {
    if (!person) return "Bilinmiyor"
    return `${person.first_name} ${person.last_name}`
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Admin Paneli</h1>
            <p className="text-sm text-muted-foreground">Tüm Metinler</p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Yazılan Tüm Metinler</CardTitle>
            <CardDescription>Tüm kullanıcıların yazdığı metinleri görüntüleyin</CardDescription>
          </CardHeader>
          <CardContent>
            {texts && texts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kimden</TableHead>
                      <TableHead>Numara</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead>Kime</TableHead>
                      <TableHead>Numara</TableHead>
                      <TableHead>Sınıf</TableHead>
                      <TableHead>Metin</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {texts.map((text: any) => (
                      <TableRow key={text.id}>
                        {/* GÖNDEREN BİLGİLERİ */}
                        <TableCell className="font-medium">
                          {formatName(text.author)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{text.author?.school_number || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{text.author?.class || "-"}</Badge>
                        </TableCell>

                        {/* ALICI BİLGİLERİ */}
                        <TableCell className="font-medium">
                          {formatName(text.recipient)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{text.recipient?.school_number || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{text.recipient?.class || "-"}</Badge>
                        </TableCell>

                        {/* METİN İÇERİĞİ */}
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2 text-sm text-muted-foreground">{text.content}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(text.created_at).toLocaleDateString("tr-TR", {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Henüz yazılmış metin yok.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
