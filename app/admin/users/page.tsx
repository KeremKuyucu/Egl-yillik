import { createClient } from "@/lib/supabase/server"
import RoleGuard from "@/components/role-guard"
import { ROLES, getLevelInfo } from "@/lib/constants"
import { getFullName, getInitials } from "@/lib/utils"
import { requireKamil } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Shield, Users, Crown, Sparkles, Star, LayoutDashboard, Hash, GraduationCap, TrendingUp, Clock } from "lucide-react"
import { LevelSelector, SearchInput, EditUserButton, MetadataButton } from "@/components/admin-actions"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface UserProfile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    level: number
    last_active: string | null
}

// Avatar renkleri - isim baş harfine göre
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

// Son aktiflik zamanını okunabilir formata çevir
function formatLastActive(dateString: string | null): { text: string; isRecent: boolean } {
    if (!dateString) return { text: "Hiç", isRecent: false }

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return { text: "Şimdi", isRecent: true }
    if (diffMins < 60) return { text: `${diffMins} dk önce`, isRecent: diffMins < 5 }
    if (diffHours < 24) return { text: `${diffHours} saat önce`, isRecent: false }
    if (diffDays < 7) return { text: `${diffDays} gün önce`, isRecent: false }

    return { text: date.toLocaleDateString('tr-TR'), isRecent: false }
}

export default async function UsersAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const supabase = await createClient()

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return null

    requireKamil();

    const { data: currentProfile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", currentUser.id)
        .single()

    const currentUserLevel = currentProfile?.level ?? 0

    // Kullanıcıları çek
    const searchQuery = (params.q as string) || ""

    let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, school_number, class, level, last_active")
        .order("level", { ascending: false })
        .order("last_name")

    const { data: users, error } = await query

    if (error) console.error("Kullanıcı çekme hatası:", error)

    // Arama filtresi
    let filteredUsers = (users || []) as UserProfile[]
    const totalUsers = filteredUsers.length

    if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filteredUsers = filteredUsers.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
            u.school_number.toLowerCase().includes(q) ||
            u.class.toLowerCase().includes(q)
        )
    }

    // İstatistikler
    const levelStats = {
        total: totalUsers,
        superAdmins: filteredUsers.filter(u => u.level >= ROLES.SUPER_ADMIN).length,
        admins: filteredUsers.filter(u => u.level >= ROLES.ADMIN && u.level < ROLES.SUPER_ADMIN).length,
        moderators: filteredUsers.filter(u => u.level >= ROLES.MODERATOR && u.level < ROLES.ADMIN).length,
        users: filteredUsers.filter(u => u.level < ROLES.MODERATOR).length,
    }

    const getLevelBadge = (level: number) => {
        const info = getLevelInfo(level);
        const Icon = level >= ROLES.ADMIN ? Shield : (level >= ROLES.MODERATOR ? Star : null);
        const isOwner = level >= ROLES.OWNER;

        const badgeContent = (
            <Badge
                variant={level < ROLES.MODERATOR ? "outline" : "default"}
                className={`${info.badgeColor} cursor-help transition-all duration-300 hover:scale-105`}
            >
                {isOwner ? <Crown className="h-3 w-3 mr-1" /> : Icon && <Icon className="h-3 w-3 mr-1" />}
                {info.label}
            </Badge>
        );

        return (
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs text-xs">{info.description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <RoleGuard minLevel={ROLES.KAMIL}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-fuchsia-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-fuchsia-950/30">
                {/* Animated background blobs */}
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-blob" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
                </div>

                {/* Header */}
                <header className="border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-pink-500/5">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 text-white shadow-xl shadow-pink-500/30">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-white">{totalUsers}</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent font-serif leading-none">Kullanıcı Yönetimi</h1>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                    <Sparkles className="h-2.5 w-2.5 text-pink-500" />
                                    {getLevelInfo(currentUserLevel).label} Paneli • {totalUsers} Kayıtlı
                                </p>
                            </div>
                        </div>

                        <Link href="/admin">
                            <Button variant="outline" size="sm" className="border-blue-200/50 bg-white/50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Yönetim Paneli</span>
                            </Button>
                        </Link>
                    </div>
                </header>

                <main className="container mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* İstatistikler - Premium Glassmorphism */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Toplam Kullanıcı */}
                        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl shadow-slate-900/50 hover:shadow-slate-900/70 transition-all duration-500 hover:scale-[1.02] group lg:col-span-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-80">Toplam</CardTitle>
                                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-black tracking-tight">{levelStats.total}</div>
                                <p className="text-xs opacity-60 mt-1">
                                    Kayıtlı kullanıcı
                                </p>
                            </CardContent>
                        </Card>

                        {/* Süper Adminler */}
                        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 text-white border-none shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 transition-all duration-500 hover:scale-[1.02] group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Süper Admin</CardTitle>
                                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Crown className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.superAdmins}</div>
                                <p className="text-xs opacity-75 mt-1">En yüksek yetki</p>
                            </CardContent>
                        </Card>

                        {/* Adminler */}
                        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 text-white border-none shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/50 transition-all duration-500 hover:scale-[1.02] group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Admin</CardTitle>
                                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Shield className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.admins}</div>
                                <p className="text-xs opacity-75 mt-1">Yönetim yetkisi</p>
                            </CardContent>
                        </Card>

                        {/* Moderatörler */}
                        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 text-white border-none shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-[1.02] group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Moderatör</CardTitle>
                                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Star className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.moderators}</div>
                                <p className="text-xs opacity-75 mt-1">Denetim yetkisi</p>
                            </CardContent>
                        </Card>

                        {/* Kullanıcılar */}
                        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-400 via-slate-500 to-gray-500 text-white border-none shadow-xl shadow-slate-500/30 hover:shadow-2xl hover:shadow-slate-500/50 transition-all duration-500 hover:scale-[1.02] group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Kullanıcı</CardTitle>
                                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                    <Users className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.users}</div>
                                <p className="text-xs opacity-75 mt-1">Standart üye</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Kullanıcı Tablosu - Premium Design */}
                    <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                        <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/80 via-rose-50/50 to-pink-50/80 dark:from-slate-800/50 dark:via-rose-900/20 dark:to-pink-900/20 px-4 sm:px-6 py-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 via-pink-700 to-purple-700 dark:from-slate-100 dark:via-pink-300 dark:to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 text-white text-sm shadow-lg shadow-pink-500/30">
                                            <Users className="w-4 h-4" />
                                        </span>
                                        Kullanıcı Listesi
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground mt-1">
                                        {currentUserLevel >= ROLES.SUPER_ADMIN
                                            ? "Kullanıcı seviyelerini ve profil bilgilerini yönetin."
                                            : "Kullanıcı profil bilgilerini görüntüleyin ve düzenleyin."}
                                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-700/50">
                                            {filteredUsers.length} sonuç
                                        </span>
                                    </CardDescription>
                                </div>
                                <SearchInput />
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
                                            <TableHead className="w-[30%] pl-6 font-bold text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-pink-500" />
                                                    Kullanıcı
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[15%] font-bold text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-4 h-4 text-blue-500" />
                                                    Okul No
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[12%] font-bold text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="w-4 h-4 text-amber-500" />
                                                    Sınıf
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[13%] font-bold text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-purple-500" />
                                                    Seviye
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[12%] font-bold text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-green-500" />
                                                    Son Aktif
                                                </div>
                                            </TableHead>
                                            <TableHead className="w-[20%] text-right pr-6 font-bold text-slate-700 dark:text-slate-300">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user, index) => {
                                            const canEditLevel = currentUserLevel > (user.level ?? 0)
                                            const canEditProfile = currentUserLevel >= ROLES.MODERATOR && (currentUserLevel > (user.level ?? 0) || user.id === currentUser.id)
                                            const isCurrentUser = user.id === currentUser.id
                                            const avatarColor = getAvatarColor(user.first_name)
                                            const initials = getInitials(user.first_name, user.last_name)

                                            return (
                                                <TableRow
                                                    key={user.id}
                                                    className={`
                                                        transition-all duration-300 group border-b border-slate-100 dark:border-slate-800
                                                        ${index % 2 === 0 ? 'bg-white/50 dark:bg-slate-900/50' : 'bg-slate-50/50 dark:bg-slate-800/30'}
                                                        hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-purple-50/80 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20
                                                        ${isCurrentUser ? 'bg-gradient-to-r from-pink-50/70 to-purple-50/70 dark:from-pink-900/30 dark:to-purple-900/30 ring-1 ring-pink-200 dark:ring-pink-800' : ''}
                                                    `}
                                                >
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Avatar */}
                                                            <Link href={`/profile/${user.school_number}`} className="flex-shrink-0">
                                                                <div className={`
                                                                    relative w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor} 
                                                                    flex items-center justify-center text-white font-bold text-sm
                                                                    shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-110
                                                                    ${isCurrentUser ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}
                                                                `}>
                                                                    {initials}
                                                                    {isCurrentUser && (
                                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                                            <Sparkles className="w-2.5 h-2.5 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Link>
                                                            <div className="flex flex-col min-w-0">
                                                                <Link href={`/profile/${user.school_number}`} className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                                                                    <span className={`font-semibold truncate ${isCurrentUser ? 'text-pink-600 dark:text-pink-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                        {getFullName(user.first_name, user.last_name)}
                                                                    </span>
                                                                </Link>
                                                                {isCurrentUser && (
                                                                    <span className="text-[10px] font-medium text-pink-500 dark:text-pink-400 uppercase tracking-wider">
                                                                        Sizin Hesabınız
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-mono text-slate-600 dark:text-slate-400">
                                                            <Hash className="w-3 h-3 opacity-50" />
                                                            {user.school_number}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-800/50 dark:hover:to-orange-800/50 transition-all"
                                                        >
                                                            {user.class}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getLevelBadge(user.level ?? 0)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            const { text, isRecent } = formatLastActive(user.last_active)
                                                            return (
                                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isRecent
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : 'text-slate-500 dark:text-slate-400'
                                                                    }`}>
                                                                    {isRecent && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                                                                    {text}
                                                                </span>
                                                            )
                                                        })()}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {/* Profil Düzenleme Butonu */}
                                                            {canEditProfile ? (
                                                                <EditUserButton
                                                                    user={user}
                                                                    currentUserLevel={currentUserLevel}
                                                                />
                                                            ) : null}

                                                            {/* Seviye Değiştirme (Sadece Süper Admin+) */}
                                                            {currentUserLevel >= ROLES.SUPER_ADMIN && canEditLevel ? (
                                                                <LevelSelector
                                                                    userId={user.id}
                                                                    currentLevel={user.level ?? 0}
                                                                    maxLevel={currentUserLevel}
                                                                />
                                                            ) : null}

                                                            {/* Meta Data Görüntüleme (Sadece Süper Admin+) */}
                                                            {currentUserLevel >= ROLES.SUPER_ADMIN && (
                                                                <MetadataButton userId={user.id} />
                                                            )}

                                                            {/* Mesaj - Kendi seviyesini değiştiremez ama profilini düzenleyebilir */}
                                                            {isCurrentUser && currentUserLevel < ROLES.SUPER_ADMIN && (
                                                                <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-500 dark:border-blue-800 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20">
                                                                    Seviye değiştiremezsiniz
                                                                </Badge>
                                                            )}
                                                            {!canEditProfile && !isCurrentUser && (
                                                                <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500">
                                                                    Yetki yok
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {filteredUsers.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
                                        <div className="relative bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 p-6 rounded-2xl">
                                            <Users className="h-12 w-12 text-pink-500" />
                                        </div>
                                    </div>
                                    <p className="font-bold text-xl text-slate-700 dark:text-slate-300">Kullanıcı bulunamadı</p>
                                    <p className="text-sm opacity-60 mt-2 max-w-xs">Arama kriterlerinizi değiştirip tekrar deneyin veya filtreleri temizleyin.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </RoleGuard>
    )
}