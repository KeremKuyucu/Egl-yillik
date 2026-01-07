import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { DeleteTextButton, SearchInput } from "@/components/admin-actions"

import {
  Shield,
  LayoutDashboard,
  ArrowRight,
  FileText,
  Users,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  Sparkles
} from "lucide-react"

// --- TİPLER ---
interface Profile {
  first_name: string
  last_name: string
  school_number: string
  class: string
}

interface TextEntry {
  id: string
  content: string
  created_at: string
  author: Profile | Profile[]
  recipient: Profile | Profile[]
}

const formatName = (person: Profile | Profile[]) => {
  const p = Array.isArray(person) ? person[0] : person
  if (!p) return "Bilinmiyor"
  return `${p.first_name} ${p.last_name}`
}

const getDetails = (person: Profile | Profile[]) => {
  const p = Array.isArray(person) ? person[0] : person
  if (!p) return { number: "-", class: "-" }
  return { number: p.school_number, class: p.class }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // 1. Yetki Kontrolü
  await requireAdmin();

  // 2. Veri Çekme
  const searchQuery = (params.q as string) || ""

  const { data: rawTexts, error } = await supabase
    .from("texts")
    .select(`
      id,
      content,
      created_at,
      author:profiles!texts_author_id_fkey (first_name, last_name, school_number, class),
      recipient:profiles!texts_recipient_id_fkey (first_name, last_name, school_number, class)
    `)
    .order('created_at', { ascending: false })

  if (error) console.error("Veri hatası:", error)

  // 3. Client-Side Filtreleme
  let texts = (rawTexts as unknown as TextEntry[]) || []

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    texts = texts.filter(t =>
      t.content.toLowerCase().includes(q) ||
      formatName(t.author).toLowerCase().includes(q) ||
      formatName(t.recipient).toLowerCase().includes(q)
    )
  }

  // 4. Sıralama Mantığı
  const sortKey = (params.sort as string) || "date"
  const sortOrder = (params.order as string) || "desc"

  if (sortKey !== "date") {
    texts.sort((a, b) => {
      let valA = "", valB = ""
      if (sortKey === "recipient") {
        valA = formatName(a.recipient).toLowerCase()
        valB = formatName(b.recipient).toLowerCase()
      } else if (sortKey === "author") {
        valA = formatName(a.author).toLowerCase()
        valB = formatName(b.author).toLowerCase()
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1
      if (valA > valB) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  } else if (sortOrder === "asc") {
    texts.reverse()
  }

  // İstatistikler
  const totalTexts = texts.length
  const uniqueAuthors = new Set(texts.map(t => {
    const p = Array.isArray(t.author) ? t.author[0] : t.author
    return p?.school_number
  })).size

  // Sıralama Link Bileşeni
  const SortLink = ({ column, label }: { column: string, label: string }) => {
    const isActive = sortKey === column
    const nextOrder = isActive && sortOrder === "asc" ? "desc" : "asc"

    const newParams = new URLSearchParams()
    if (searchQuery) newParams.set("q", searchQuery)
    newParams.set("sort", column)
    newParams.set("order", nextOrder)

    return (
      <Link
        href={`/admin?${newParams.toString()}`}
        className={`flex items-center gap-1 hover:text-foreground transition-all duration-300 ${isActive ? "text-foreground font-bold" : "text-muted-foreground"}`}
      >
        {label}
        {isActive ? (
          sortOrder === "asc" ? <ArrowUp className="h-3 w-3 animate-bounce" /> : <ArrowDown className="h-3 w-3 animate-bounce" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-300/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-300/20 via-transparent to-transparent pointer-events-none" />

      <header className="border-b border-border/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-indigo-500/5">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/50 animate-pulse">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-serif leading-none">Yönetim Paneli</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                Admin Erişimi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-300">
                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Öğrenci Görünümü</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* İstatistikler */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-none shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Listelenen Mesaj</CardTitle>
              <FileText className="h-5 w-5 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalTexts}</div>
              <p className="text-xs opacity-75 mt-1">Toplam kayıt</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-none shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Aktif Yazarlar</CardTitle>
              <Users className="h-5 w-5 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueAuthors}</div>
              <p className="text-xs opacity-75 mt-1">Benzersiz kullanıcı</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-none shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Sistem Durumu</CardTitle>
              <Shield className="h-5 w-5 opacity-75 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Aktif</div>
              <p className="text-xs opacity-75 mt-1">Admin yetkileri doğrulandı</p>
            </CardContent>
          </Card>
        </div>

        {/* Tablo/Kart Kartı */}
        <Card className="border-border shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 px-4 sm:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Metin Kayıtları</CardTitle>
                <CardDescription className="text-muted-foreground">Tüm mesajlaşma trafiğini izle ve yönet.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <SearchInput />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {texts.length > 0 ? (
              <>
                {/* Masaüstü Tablo Görünümü */}
                <div className="hidden lg:block w-full overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                      <TableRow>
                        <TableHead className="w-[20%] pl-6">
                          <SortLink column="author" label="Gönderen" />
                        </TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                        <TableHead className="w-[20%]">
                          <SortLink column="recipient" label="Alıcı" />
                        </TableHead>
                        <TableHead className="w-[35%]">İçerik</TableHead>
                        <TableHead className="w-[10%]">
                          <SortLink column="date" label="Tarih" />
                        </TableHead>
                        <TableHead className="w-[10%] text-right pr-6">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {texts.map((text, index) => {
                        const authorDetails = getDetails(text.author)
                        const recipientDetails = getDetails(text.recipient)
                        const colors = [
                          'from-blue-500/10 to-cyan-500/10',
                          'from-purple-500/10 to-pink-500/10',
                          'from-emerald-500/10 to-teal-500/10',
                          'from-orange-500/10 to-amber-500/10',
                          'from-rose-500/10 to-red-500/10'
                        ]
                        const colorClass = colors[index % colors.length]

                        return (
                          <TableRow key={text.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950/50 dark:hover:to-purple-950/50 group border-border transition-all duration-300">
                            <TableCell className="pl-6 align-top py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground truncate max-w-[150px] group-hover:text-indigo-600 transition-colors" title={formatName(text.author)}>
                                  {formatName(text.author)}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    {authorDetails.class}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">#{authorDetails.number}</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="align-top py-4">
                              <ArrowRight className="h-4 w-4 text-indigo-400 mt-2 group-hover:translate-x-1 transition-transform duration-300" />
                            </TableCell>

                            <TableCell className="align-top py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground truncate max-w-[150px] group-hover:text-purple-600 transition-colors" title={formatName(text.recipient)}>
                                  {formatName(text.recipient)}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 text-purple-700 border-purple-300 dark:text-purple-300 dark:border-purple-700 font-normal">
                                    {recipientDetails.class}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">#{recipientDetails.number}</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="align-top py-4">
                              <div className={`bg-gradient-to-br ${colorClass} p-3 rounded-lg border border-border text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words max-w-prose group-hover:shadow-md transition-shadow duration-300`}>
                                {text.content}
                              </div>
                            </TableCell>

                            <TableCell className="align-top py-4">
                              <div className="flex items-center text-xs text-muted-foreground mt-2 whitespace-nowrap">
                                <Calendar className="mr-1.5 h-3 w-3 text-emerald-500" />
                                {new Date(text.created_at).toLocaleDateString("tr-TR", {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </TableCell>

                            <TableCell className="align-top py-4 text-right pr-6">
                              <div className="flex justify-end gap-1">
                                <Link href={`/print/${text.id}`} target="_blank">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300"
                                    title="Görüntüle ve Yazdır"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <DeleteTextButton id={text.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobil Kart Görünümü */}
                <div className="lg:hidden space-y-3 p-4">
                  {texts.map((text, index) => {
                    const authorDetails = getDetails(text.author)
                    const recipientDetails = getDetails(text.recipient)
                    const colors = [
                      'from-blue-500 to-cyan-500',
                      'from-purple-500 to-pink-500',
                      'from-emerald-500 to-teal-500',
                      'from-orange-500 to-amber-500',
                      'from-rose-500 to-red-500'
                    ]
                    const colorClass = colors[index % colors.length]

                    return (
                      <Card key={text.id} className="border-2 border-border bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                        <div className={`h-1 bg-gradient-to-r ${colorClass}`}></div>
                        <CardContent className="p-4 space-y-3">
                          {/* Gönderen ve Alıcı */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground font-medium">Gönderen:</span>
                              </div>
                              <div className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                                {formatName(text.author)}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  {authorDetails.class}
                                </Badge>
                                <span className="text-xs text-muted-foreground">#{authorDetails.number}</span>
                              </div>
                            </div>

                            <ArrowRight className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-1" />

                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="text-xs text-muted-foreground font-medium">Alıcı:</span>
                              </div>
                              <div className="font-medium text-purple-600 dark:text-purple-400 truncate">
                                {formatName(text.recipient)}
                              </div>
                              <div className="flex items-center justify-end gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] h-4 px-1 text-purple-700 border-purple-300 dark:text-purple-300 dark:border-purple-700 font-normal">
                                  {recipientDetails.class}
                                </Badge>
                                <span className="text-xs text-muted-foreground">#{recipientDetails.number}</span>
                              </div>
                            </div>
                          </div>

                          {/* İçerik */}
                          <div className={`bg-gradient-to-br ${colorClass.replace(/500/g, '50').replace('dark:', '')} dark:${colorClass.replace(/500/g, '950')} p-3 rounded-lg border border-border text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words`}>
                            {text.content}
                          </div>

                          {/* Alt Bilgi: Tarih ve İşlemler */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="mr-1.5 h-3 w-3 text-emerald-500" />
                              {new Date(text.created_at).toLocaleDateString("tr-TR", {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>

                            <div className="flex items-center gap-1">
                              <Link href={`/print/${text.id}`} target="_blank">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300"
                                  title="Görüntüle ve Yazdır"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </Link>
                              <DeleteTextButton id={text.id} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 rounded-full mb-4 animate-pulse">
                  <FileText className="h-10 w-10 text-purple-500" />
                </div>
                <p className="font-medium text-lg">Sonuç bulunamadı.</p>
                <p className="text-sm opacity-60 mt-1">Arama kriterlerinizi değiştirip tekrar deneyin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}