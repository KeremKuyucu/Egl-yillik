import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { DeleteTextButton, SearchInput } from "@/components/admin-actions"
import { getFullName, getInitials, cn } from "@/lib/utils"
import { ROLES, getLevelInfo } from "@/lib/constants"
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
  Sparkles,
  TrendingUp,
  Clock,
  AlignLeft,
  Trophy,
  BarChart3,
  Filter,
  MessageSquare,
  Star,
  Crown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

// --- TİPLER ---
interface Profile {
  id: string
  first_name: string
  last_name: string
  school_number: string
  class: string
  level: number
}

interface TextEntry {
  id: string
  content: string
  created_at: string
  author: Profile | Profile[]
  recipient: Profile | Profile[]
}

// Yardımcı fonksiyonlar
const getProfile = (person: Profile | Profile[]): Profile | null => {
  if (Array.isArray(person)) return person[0] || null
  return person || null
}

// User tablosu ile aynı renkler
const avatarColors = [
  "from-red-500 to-rose-600",
  "from-orange-500 to-amber-600",
  "from-yellow-500 to-lime-600",
  "from-green-500 to-emerald-600",
  "from-teal-500 to-cyan-600",
  "from-blue-500 to-indigo-600",
  "from-indigo-500 to-purple-600",
  "from-purple-500 to-pink-600",
  "from-pink-500 to-rose-600",
  "from-fuchsia-500 to-purple-600",
]

function getAvatarColor(name: string): string {
  const charCode = (name || '').charCodeAt(0) || 0
  return avatarColors[charCode % avatarColors.length]
}

const getRoleBadge = (level: number) => {
  // Sadece önemli rolleri göster (Kullanıcı hariç)
  // Veya hepsini göster ama User silik olsun. User tablosundaki mantık:
  const info = getLevelInfo(level);
  if (level <= ROLES.USER) return null; // Normal kullanıcı için badge gösterme

  const Icon = level >= ROLES.SUPER_ADMIN ? Shield : (level >= ROLES.ADMIN ? Star : Sparkles);
  const isOwner = level >= ROLES.OWNER;

  return (
    <Badge
      variant="outline"
      className={`${info.badgeColor} h-4 px-1 text-[9px] gap-1 ml-1`}
    >
      {isOwner ? <Crown className="h-2 w-2" /> : Icon && <Icon className="h-2 w-2" />}
      {info.label}
    </Badge>
  );
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // 1. Yetki Kontrolü
  const { profile: currentProfile } = await requireAdmin();

  // 2. Veri Çekme
  const searchQuery = (params.q as string) || ""
  const filterTime = (params.filter as string) || "all" // all, today, week

  const { data: rawTexts, error } = await supabase
    .from("texts")
    .select(`
      id,
      content,
      created_at,
      author:profiles!texts_author_id_fkey (id, first_name, last_name, school_number, class, level),
      recipient:profiles!texts_recipient_id_fkey (id, first_name, last_name, school_number, class, level)
    `)
    .order('created_at', { ascending: false })

  if (error) console.error("Veri hatası:", error)

  let texts = (rawTexts as unknown as TextEntry[]) || []

  // 3. İstatistik Hesaplamaları (Filtrelemeden Önce - Genel İstatistikler)
  const allTextsCount = texts.length

  // Kelime Sayısı
  const totalWords = texts.reduce((acc, t) => acc + (t.content?.split(/\s+/).length || 0), 0)

  // En Çok Mesaj Alan (Popüler)
  const recipientCounts = texts.reduce((acc, t) => {
    const p = getProfile(t.recipient)
    if (p) {
      const name = getFullName(p.first_name, p.last_name)
      acc[name] = (acc[name] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const mostPopularRecipient = Object.entries(recipientCounts)
    .sort(([, a], [, b]) => b - a)[0]

  // Grafik Verisi (Son 14 gün)
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dailyCounts = last14Days.map(date => {
    const count = texts.filter(t => t.created_at.startsWith(date)).length
    return { date, count }
  })

  const maxDailyCount = Math.max(...dailyCounts.map(d => d.count), 1)

  // 4. Filtreleme
  if (filterTime === "today") {
    const today = new Date().toISOString().split('T')[0]
    texts = texts.filter(t => t.created_at.startsWith(today))
  } else if (filterTime === "week") {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    texts = texts.filter(t => new Date(t.created_at) >= weekAgo)
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    texts = texts.filter(t => {
      const author = getProfile(t.author)
      const recipient = getProfile(t.recipient)
      return (
        t.content.toLowerCase().includes(q) ||
        getFullName(author?.first_name, author?.last_name).toLowerCase().includes(q) ||
        getFullName(recipient?.first_name, recipient?.last_name).toLowerCase().includes(q)
      )
    })
  }

  // Bugün ve Bu Hafta İstatistikleri
  const today = new Date().toISOString().split('T')[0]
  const todayCount = rawTexts?.filter(t => t.created_at.startsWith(today)).length || 0

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekCount = rawTexts?.filter(t => new Date(t.created_at) >= weekAgo).length || 0

  // 5. Sıralama
  const sortKey = (params.sort as string) || "date"
  const sortOrder = (params.order as string) || "desc"

  if (sortKey !== "date") {
    texts.sort((a, b) => {
      let valA = "", valB = ""
      const authorA = getProfile(a.author), recipientA = getProfile(a.recipient)
      const authorB = getProfile(b.author), recipientB = getProfile(b.recipient)

      if (sortKey === "recipient") {
        valA = getFullName(recipientA?.first_name, recipientA?.last_name).toLowerCase()
        valB = getFullName(recipientB?.first_name, recipientB?.last_name).toLowerCase()
      } else if (sortKey === "author") {
        valA = getFullName(authorA?.first_name, authorA?.last_name).toLowerCase()
        valB = getFullName(authorB?.first_name, authorB?.last_name).toLowerCase()
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1
      if (valA > valB) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  } else if (sortOrder === "asc") {
    texts.reverse()
  }

  // Sıralama Link Bileşeni
  const SortLink = ({ column, label }: { column: string, label: string }) => {
    const isActive = sortKey === column
    const nextOrder = isActive && sortOrder === "asc" ? "desc" : "asc"
    const newParams = new URLSearchParams()
    if (searchQuery) newParams.set("q", searchQuery)
    if (filterTime !== "all") newParams.set("filter", filterTime)
    newParams.set("sort", column)
    newParams.set("order", nextOrder)

    return (
      <Link
        href={`/admin/texts?${newParams.toString()}`}
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
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-300/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-300/20 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-indigo-500/5">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/40 animate-pulse">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-serif leading-none">
                {currentProfile ? `${getLevelInfo(currentProfile.level).label} Paneli` : "Yönetim Paneli"}
              </h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                Admin Erişimi
              </p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="border-indigo-200/50 bg-white/50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-300 backdrop-blur-sm">
              <LayoutDashboard className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Yönetim Paneli</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 pb-24 sm:pb-32 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* --- İSTATİSTİKLER --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* Toplam Mesaj */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-none shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium opacity-90">Toplam Mesaj</CardTitle>
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm"><FileText className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{allTextsCount}</div>
              <div className="flex items-center text-xs opacity-75 mt-1 gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>+%12 bu ay</span>
              </div>
            </CardContent>
          </Card>

          {/* Bugün ve Bu Hafta */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-500 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium opacity-90">Yeni İçerik</CardTitle>
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm"><Clock className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold">{todayCount}</div>
                  <p className="text-[10px] opacity-75">Bugün</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{weekCount}</div>
                  <p className="text-[10px] opacity-75">Bu Hafta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kelime Sayısı */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/50 transition-all duration-500 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium opacity-90">Toplam Kelime</CardTitle>
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm"><AlignLeft className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{(totalWords / 1000).toFixed(1)}k</div>
              <p className="text-xs opacity-75 mt-1">Kelime hazinesi</p>
            </CardContent>
          </Card>

          {/* En Popüler */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 text-white border-none shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-500 hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium opacity-90">Yıllık Yıldızı</CardTitle>
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm"><Trophy className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-xl font-bold truncate" title={mostPopularRecipient?.[0]}>
                {mostPopularRecipient ? mostPopularRecipient[0] : "-"}
              </div>
              <p className="text-xs opacity-75 mt-1">
                {mostPopularRecipient ? `${mostPopularRecipient[1]} mesaj aldı` : "Henüz veri yok"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- GRAFİK VE LİSTE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Aktivite Grafiği */}
          <Card className="lg:col-span-3 border-none shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Günlük Aktivite
              </CardTitle>
              <CardDescription>Son 14 günün mesajlaşma trafiği</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full mt-4 overflow-x-auto pb-8 invisible-scrollbar">
                <div className="flex h-full min-w-[600px] lg:min-w-full items-end gap-2 sm:gap-4 px-2 pb-6">
                  {dailyCounts.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1.5 px-3 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 flex flex-col items-center">
                        <span className="font-bold">{item.count} Mesaj</span>
                        <span className="text-[10px] opacity-80" suppressHydrationWarning>{new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                      </div>
                      {/* Bar */}
                      <div className="w-full relative flex items-end justify-center h-full">
                        <div
                          className="w-full max-w-[32px] sm:max-w-[48px] bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md hover:from-indigo-400 hover:to-purple-400 transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                          style={{
                            height: item.count > 0 ? `${(item.count / maxDailyCount) * 100}%` : '4px',
                            opacity: item.count > 0 ? 1 : 0.1
                          }}
                        ></div>
                      </div>
                      {/* Label */}
                      <span className="text-[10px] text-muted-foreground rotate-0 font-medium absolute -bottom-6 w-full text-center" suppressHydrationWarning>
                        {new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }).split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- TABLO --- */}
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <CardHeader className="border-b border-indigo-100/50 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 px-4 sm:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 dark:from-indigo-300 dark:to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                  Mesaj Kayıtları
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Toplam {texts.length} mesaj listeleniyor
                  {filterTime !== 'all' && <span className="ml-1 font-medium text-indigo-600 dark:text-indigo-400">({filterTime === 'today' ? 'Bugün' : 'Bu hafta'})</span>}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Filtre Butonu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 bg-white/50 backdrop-blur-sm">
                      <Filter className={`h-4 w-4 ${filterTime !== 'all' ? 'text-indigo-600' : 'text-slate-500'}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Zaman Filtresi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/texts?filter=all&q=${searchQuery}`} className="w-full cursor-pointer">
                        <span className={filterTime === 'all' ? 'font-bold text-indigo-600' : ''}>Tüm Zamanlar</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/texts?filter=today&q=${searchQuery}`} className="w-full cursor-pointer">
                        <span className={filterTime === 'today' ? 'font-bold text-indigo-600' : ''}>Bugün Yazılanlar</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/texts?filter=week&q=${searchQuery}`} className="w-full cursor-pointer">
                        <span className={filterTime === 'week' ? 'font-bold text-indigo-600' : ''}>Bu Hafta Yazılanlar</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <SearchInput />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {texts.length > 0 ? (
              <>
                {/* MASAÜSTÜ GÖRÜNÜMÜ (TABLO) */}
                <div className="hidden lg:block w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/80">
                        <TableHead className="w-[22%] pl-6">
                          <SortLink column="author" label="Gönderen" />
                        </TableHead>
                        <TableHead className="w-[5%]"></TableHead>
                        <TableHead className="w-[22%]">
                          <SortLink column="recipient" label="Alıcı" />
                        </TableHead>
                        <TableHead className="w-[30%]">İçerik</TableHead>
                        <TableHead className="w-[12%]">
                          <SortLink column="date" label="Tarih" />
                        </TableHead>
                        <TableHead className="w-[9%] text-right pr-6">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {texts.map((text, index) => {
                        const author = getProfile(text.author)
                        const recipient = getProfile(text.recipient)
                        const authorName = getFullName(author?.first_name, author?.last_name)
                        const recipientName = getFullName(recipient?.first_name, recipient?.last_name)
                        const authorInitials = getInitials(author?.first_name, author?.last_name)
                        const recipientInitials = getInitials(recipient?.first_name, recipient?.last_name)

                        return (
                          <TableRow key={text.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                            {/* GÖNDEREN */}
                            <TableCell className="pl-6 py-4">
                              <Link href={`/admin/users?q=${authorName}`} className="group/link flex items-center gap-3 w-fit">
                                <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${getAvatarColor(authorName)} flex items-center justify-center text-xs font-bold text-white shadow-md group-hover/link:scale-110 transition-transform`}>
                                  {authorInitials}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <span className="font-semibold text-sm group-hover/link:text-indigo-600 transition-colors">{authorName}</span>
                                    {getRoleBadge(author?.level || 0)}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[9px] px-1 h-4 border-indigo-200 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800">
                                      {author?.class || '-'}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{author?.school_number}</span>
                                  </div>
                                </div>
                              </Link>
                            </TableCell>

                            <TableCell>
                              <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                            </TableCell>

                            {/* ALICI */}
                            <TableCell>
                              <Link href={`/admin/users?q=${recipientName}`} className="group/link flex items-center gap-3 w-fit">
                                <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${getAvatarColor(recipientName)} flex items-center justify-center text-xs font-bold text-white shadow-md group-hover/link:scale-110 transition-transform`}>
                                  {recipientInitials}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <span className="font-semibold text-sm group-hover/link:text-purple-600 transition-colors">{recipientName}</span>
                                    {getRoleBadge(recipient?.level || 0)}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-[9px] px-1 h-4 border-purple-200 text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                                      {recipient?.class || '-'}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{recipient?.school_number}</span>
                                  </div>
                                </div>
                              </Link>
                            </TableCell>

                            {/* İÇERİK (POPUP İLE) */}
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-600 dark:text-slate-300 truncate max-w-[250px] xl:max-w-[400px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer group/text relative">
                                    {text.content}
                                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-800/50 to-transparent pointer-events-none" />
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <MessageSquare className="h-5 w-5 text-indigo-500" />
                                      Mesaj Detayı
                                    </DialogTitle>
                                    <DialogDescription suppressHydrationWarning>
                                      Bu mesaj {new Date(text.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} tarihinde gönderildi.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="grid grid-cols-2 gap-4 py-4">
                                    {/* Gönderen Kartı */}
                                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                      <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-2">GÖNDEREN</p>
                                      <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(authorName)} flex items-center justify-center text-sm font-bold text-white shadow-md`}>
                                          {authorInitials}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-indigo-900 dark:text-indigo-100 leading-none">{authorName}</p>
                                          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                            {author?.class} - #{author?.school_number}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Alıcı Kartı */}
                                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                                      <p className="text-xs text-purple-500 font-bold uppercase tracking-wider mb-2">ALICI</p>
                                      <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(recipientName)} flex items-center justify-center text-sm font-bold text-white shadow-md`}>
                                          {recipientInitials}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-purple-900 dark:text-purple-100 leading-none">{recipientName}</p>
                                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                            {recipient?.class} - #{recipient?.school_number}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Tam Metin */}
                                  <div className="mt-2 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-100 dark:border-slate-700 shadow-inner max-h-[40vh] overflow-y-auto">
                                    <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                      {text.content}
                                    </p>
                                  </div>

                                  <DialogFooter className="mt-4 sm:justify-between gap-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>ID: {text.id.slice(0, 8)}...</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <DeleteTextButton id={text.id} />
                                    </div>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>

                            {/* TARİH */}
                            <TableCell>
                              <div className="flex flex-col text-xs text-muted-foreground">
                                <span className="font-medium text-slate-700 dark:text-slate-300" suppressHydrationWarning>
                                  {new Date(text.created_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })}
                                </span>
                                <span suppressHydrationWarning>
                                  {new Date(text.created_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </TableCell>

                            {/* İŞLEMLER */}
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <DeleteTextButton id={text.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* MOBİL GÖRÜNÜMÜ (LİSTE) */}
                <div className="lg:hidden flex flex-col divide-y divide-indigo-100 dark:divide-indigo-800/50">
                  {texts.map((text, index) => {
                    const author = getProfile(text.author)
                    const recipient = getProfile(text.recipient)
                    const authorName = getFullName(author?.first_name, author?.last_name)
                    const recipientName = getFullName(recipient?.first_name, recipient?.last_name)
                    const authorInitials = getInitials(author?.first_name, author?.last_name)
                    const recipientInitials = getInitials(recipient?.first_name, recipient?.last_name)

                    return (
                      <Dialog key={text.id}>
                        <DialogTrigger asChild>
                          <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer active:scale-[0.98] transition-transform">
                            <div className="flex justify-between items-start mb-3 gap-2">
                              {/* Gönderen */}
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={cn(
                                  "shrink-0 h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white shadow",
                                  getAvatarColor(authorName)
                                )}>
                                  {authorInitials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{authorName}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{author?.class}</p>
                                </div>
                              </div>

                              <ArrowRight className="h-3 w-3 text-slate-300 mt-2 shrink-0" />

                              {/* Alıcı */}
                              <div className="flex items-center gap-2 text-right min-w-0 flex-1 justify-end">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{recipientName}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{recipient?.class}</p>
                                </div>
                                <div className={cn(
                                  "shrink-0 h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white shadow",
                                  getAvatarColor(recipientName)
                                )}>
                                  {recipientInitials}
                                </div>
                              </div>
                            </div>

                            {/* Metin */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed border border-slate-100 dark:border-slate-800 mb-2 font-medium">
                              {text.content}
                            </div>

                            {/* Alt: Tarih */}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                                <Calendar className="h-3 w-3" />
                                {new Date(text.created_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <Badge variant="secondary" className="text-[9px] h-5 bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                                Detay
                              </Badge>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-[95vw] rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base">
                              <MessageSquare className="h-4 w-4 text-indigo-500" />
                              Mesaj Detayı
                            </DialogTitle>
                            <DialogDescription className="text-xs" suppressHydrationWarning>
                              {new Date(text.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid grid-cols-2 gap-3 py-2">
                            {/* Gönderen Kartı */}
                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-2">GÖNDEREN</p>
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarColor(authorName)} flex items-center justify-center text-xs font-bold text-white shadow-md`}>
                                  {authorInitials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-indigo-900 dark:text-indigo-100 leading-none truncate">{authorName}</p>
                                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    {author?.class} - #{author?.school_number}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Alıcı Kartı */}
                            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                              <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider mb-2">ALICI</p>
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarColor(recipientName)} flex items-center justify-center text-xs font-bold text-white shadow-md`}>
                                  {recipientInitials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-purple-900 dark:text-purple-100 leading-none truncate">{recipientName}</p>
                                  <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">
                                    {recipient?.class} - #{recipient?.school_number}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tam Metin */}
                          <div className="mt-1 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-100 dark:border-slate-700 shadow-inner max-h-[40vh] overflow-y-auto">
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                              {text.content}
                            </p>
                          </div>

                          <DialogFooter className="mt-2 flex-row gap-2 justify-end">
                            <div className="scale-90 origin-right">
                              <DeleteTextButton id={text.id} />
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-6 rounded-2xl">
                    <FileText className="h-12 w-12 text-indigo-500" />
                  </div>
                </div>
                <p className="font-bold text-xl text-slate-700 dark:text-slate-300">Mesaj bulunamadı</p>
                <p className="text-sm opacity-60 mt-2 max-w-xs">Arama kriterlerinizi değiştirip tekrar deneyin veya filtreleri temizleyin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div >
  )
}