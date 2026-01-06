import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import {
    Shield,
    LayoutDashboard,
    ArrowRight,
    Trash2,
    FileText,
    Users,
    Calendar,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Printer // Yazıcı ikonu eklendi
} from "lucide-react"

// --- SERVER ACTION: SİLME İŞLEMİ ---
async function deleteText(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const supabase = await createClient()

    const { error } = await supabase.from("texts").delete().eq("id", id)

    if (!error) {
        revalidatePath("/admin")
    }
}

// --- TİPLER VE YARDIMCI FONKSİYONLAR ---
interface AdminPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const formatName = (person: any) => {
    const p = Array.isArray(person) ? person[0] : person
    if (!p) return "Bilinmiyor"
    return `${p.first_name} ${p.last_name}`
}

const getDetails = (person: any) => {
    const p = Array.isArray(person) ? person[0] : person
    if (!p) return { number: "-", class: "-" }
    return { number: p.school_number, class: p.class }
}

export default async function AdminPage(props: AdminPageProps) {
    const searchParams = await props.searchParams;
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
    const { data: rawTexts, error } = await supabase
        .from("texts")
        .select(
            `
      id,
      recipient_id, 
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
    // recipient_id EKLENDİ (Yukarıda) ^^^

    if (error) {
        console.error("Veri çekme hatası:", error)
    }

    // --- SIRALAMA MANTIĞI (Javascript Tarafında) ---
    const sortKey = (searchParams.sort as string) || "date"
    const sortOrder = (searchParams.order as string) || "desc"

    let texts = rawTexts ? [...rawTexts] : []

    texts.sort((a: any, b: any) => {
        let valA, valB

        switch (sortKey) {
            case "recipient":
                valA = formatName(a.recipient).toLowerCase()
                valB = formatName(b.recipient).toLowerCase()
                break
            case "author":
                valA = formatName(a.author).toLowerCase()
                valB = formatName(b.author).toLowerCase()
                break
            case "date":
            default:
                valA = new Date(a.created_at).getTime()
                valB = new Date(b.created_at).getTime()
                break
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1
        if (valA > valB) return sortOrder === "asc" ? 1 : -1
        return 0
    })

    // Sıralama Linki Bileşeni
    const SortLink = ({ column, label }: { column: string, label: string }) => {
        const isActive = sortKey === column
        const nextOrder = isActive && sortOrder === "asc" ? "desc" : "asc"

        return (
            <Link
                href={`/admin?sort=${column}&order=${nextOrder}`}
                className={`flex items-center gap-1 hover:text-slate-900 transition-colors ${isActive ? "text-slate-900 font-bold" : "text-slate-500"}`}
            >
                {label}
                {isActive ? (
                    sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                )}
            </Link>
        )
    }

    // İstatistikler
    const totalTexts = texts?.length || 0
    const uniqueAuthors = new Set(texts?.map((t: any) => Array.isArray(t.author) ? t.author[0]?.school_number : t.author?.school_number)).size

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />

            {/* Header */}
            <header className="border-b border-amber-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 font-serif leading-none">Yönetim Paneli</h1>
                            <p className="text-[10px] text-amber-700/80 font-bold uppercase tracking-wider mt-0.5">Admin Erişimi</p>
                        </div>
                    </div>

                    <Link href="/dashboard">
                        <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Öğrenci Görünümü</span>
                            <span className="sm:hidden">Öğrenci</span>
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* İstatistik Kartları */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Toplam Anı</CardTitle>
                            <FileText className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{totalTexts}</div>
                            <p className="text-xs text-slate-500">Sistemdeki toplam mesaj sayısı</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Aktif Yazarlar</CardTitle>
                            <Users className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{uniqueAuthors}</div>
                            <p className="text-xs text-slate-500">Anı yazan öğrenci sayısı</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">Sistem Durumu</CardTitle>
                            <Shield className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Aktif</div>
                            <p className="text-xs text-slate-400">Veritabanı bağlantısı sağlıklı</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Ana Tablo */}
                <Card className="border-slate-200 shadow-lg shadow-slate-200/40 overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">Metin Kayıtları</CardTitle>
                                <CardDescription>Tüm sınıf içi ve sınıflar arası mesajlaşma trafiği.</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-white w-fit">
                                {totalTexts} kayıt listelendi
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {texts && texts.length > 0 ? (
                            <div className="w-full">
                                <Table className="w-full table-fixed">
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[18%] pl-6">
                                                <SortLink column="author" label="Gönderen" />
                                            </TableHead>
                                            <TableHead className="w-[4%]"></TableHead>
                                            <TableHead className="w-[18%]">
                                                <SortLink column="recipient" label="Alıcı" />
                                            </TableHead>
                                            <TableHead className="w-[45%]">İçerik</TableHead>
                                            <TableHead className="w-[10%]">
                                                <SortLink column="date" label="Tarih" />
                                            </TableHead>
                                            <TableHead className="w-[5%] text-right pr-6">İşlem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {texts.map((text: any) => {
                                            const authorDetails = getDetails(text.author)
                                            const recipientDetails = getDetails(text.recipient)

                                            return (
                                                <TableRow key={text.id} className="hover:bg-slate-50/80 group">
                                                    {/* GÖNDEREN */}
                                                    <TableCell className="pl-6 align-top py-4">
                                                        <div className="flex flex-col truncate">
                                                            <span className="font-semibold text-slate-900 truncate" title={formatName(text.author)}>
                                                                {formatName(text.author)}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-indigo-50 text-indigo-700 border-indigo-100 whitespace-nowrap">
                                                                    {authorDetails.class}
                                                                </Badge>
                                                                <span className="text-xs text-slate-400 whitespace-nowrap">#{authorDetails.number}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* OK İKONU */}
                                                    <TableCell className="align-top py-4">
                                                        <ArrowRight className="h-4 w-4 text-slate-300 mt-2" />
                                                    </TableCell>

                                                    {/* ALICI + YAZDIR BUTONU */}
                                                    <TableCell className="align-top py-4">
                                                        <div className="flex flex-col truncate group/recipient">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-medium text-slate-700 truncate" title={formatName(text.recipient)}>
                                                                    {formatName(text.recipient)}
                                                                </span>
                                                                {/* Yazdır Butonu */}
                                                                <Link
                                                                    href={`/print/${text.recipient_id}`}
                                                                    target="_blank"
                                                                    className="opacity-0 group-hover/recipient:opacity-100 transition-opacity"
                                                                    title="Bu öğrencinin yıllığını indir"
                                                                >
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                                        <Printer className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[10px] h-4 px-1 text-slate-500 whitespace-nowrap">
                                                                    {recipientDetails.class}
                                                                </Badge>
                                                                <span className="text-xs text-slate-400 whitespace-nowrap">#{recipientDetails.number}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* İÇERİK */}
                                                    <TableCell className="align-top py-4">
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-normal break-words w-full">
                                                            "{text.content}"
                                                        </div>
                                                    </TableCell>

                                                    {/* TARİH */}
                                                    <TableCell className="align-top py-4">
                                                        <div className="flex items-center text-xs text-slate-400 mt-2 whitespace-nowrap">
                                                            <Calendar className="mr-1.5 h-3 w-3" />
                                                            {new Date(text.created_at).toLocaleDateString("tr-TR", {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </TableCell>

                                                    {/* SİLME BUTONU */}
                                                    <TableCell className="align-top py-4 text-right pr-6">
                                                        <form action={deleteText}>
                                                            <input type="hidden" name="id" value={text.id} />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                type="submit"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </form>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="bg-slate-50 p-4 rounded-full mb-3">
                                    <Search className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">Henüz hiç anı yazılmamış.</p>
                                <p className="text-xs text-slate-400 mt-1">Öğrenciler yazmaya başladığında burada görünecek.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}