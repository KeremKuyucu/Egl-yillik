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

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all texts with author and recipient information
  const { data: texts } = await supabase
    .from("texts")
    .select(
      `
      id,
      content,
      created_at,
      author:author_id (
        first_name,
        last_name,
        school_number,
        class
      ),
      recipient:recipient_id (
        first_name,
        last_name,
        school_number,
        class
      )
    `,
    )
    .order("created_at", { ascending: false })

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
                    {texts.map((text) => (
                      <TableRow key={text.id}>
                        <TableCell className="font-medium">
                          {text.author?.first_name} {text.author?.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{text.author?.school_number}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{text.author?.class}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {text.recipient?.first_name} {text.recipient?.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{text.recipient?.school_number}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{text.recipient?.class}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2 text-sm text-muted-foreground">{text.content}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(text.created_at).toLocaleDateString("tr-TR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Henüz yazılmış metin yok</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
