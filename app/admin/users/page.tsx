import { createClient } from "@/lib/supabase/server"
import RoleGuard from "@/components/role-guard"
import { ROLES, getLevelInfo } from "@/lib/constants"
import { getFullName, getInitials } from "@/lib/utils"
import { requireAdmin } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Users, Crown, Sparkles, Star, LayoutDashboard, Hash, GraduationCap, TrendingUp, Clock } from "lucide-react"
import { LevelSelector, SearchInput, EditUserButton, MetadataButton, UserFilterBar } from "@/components/admin-actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

// Son aktiflik zamanını okunabilir formata çevir (UTC+3 ayarlı)
function formatLastActive(dateString: string | null): { text: string; isRecent: boolean } {
    if (!dateString) return { text: "Hiç", isRecent: false }

    // Supabase'den gelen tarih UTC'dir
    const date = new Date(dateString)
    const now = new Date()

    // Fark hesaplama (Ms bazlı fark UTC epoch üzerinden olduğu için her zaman doğrudur)
    const diffMs = now.getTime() - date.getTime()

    // Kullanıcıya gösterilecek tarih için +3 saat ekle (Türkiye saati vb.)
    const displayDate = new Date(date.getTime() + (3 * 60 * 60 * 1000))

    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return { text: "Şimdi", isRecent: true }
    if (diffMins < 60) return { text: `${diffMins} dk önce`, isRecent: diffMins < 5 }
    if (diffHours < 24) return { text: `${diffHours} saat önce`, isRecent: false }
    if (diffDays < 7) return { text: `${diffDays} gün önce`, isRecent: false }

    const day = displayDate.getUTCDate().toString().padStart(2, '0')
    const month = (displayDate.getUTCMonth() + 1).toString().padStart(2, '0')
    const hours = displayDate.getUTCHours().toString().padStart(2, '0')
    const mins = displayDate.getUTCMinutes().toString().padStart(2, '0')

    return { text: `${day}.${month}.${displayDate.getUTCFullYear()} ${hours}:${mins}`, isRecent: false }
}

export default async function UsersAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Merkezi admin kontrolü - user ve level bilgisi döner
    const { user: currentUser, level: currentUserLevel } = await requireAdmin()

    const params = await searchParams
    const supabase = await createClient()

    // Filtre Parametreleri
    const searchQuery = (params.q as string) || ""
    const classFilter = (params.class as string) || ""
    const roleFilter = (params.role as string) || ""

    // 1. Tüm sınıfları çek (Filtreleme dropdown'ı için)
    const { data: allProfiles } = await supabase
        .from("profiles")
        .select("class")
        .order("class")

    // Benzersiz sınıfları al
    const classes = [...new Set(allProfiles?.map(p => p.class).filter(Boolean) || [])] as string[]

    // 2. Kullanıcıları çek (level hariç)
    let profileQuery = supabase
        .from("profiles")
        .select("id, first_name, last_name, school_number, class, last_active")
        .order("last_name")

    // Server-side sınıf filtresi
    if (classFilter && classFilter !== "all") {
        profileQuery = profileQuery.eq("class", classFilter)
    }

    const { data: profilesData, error: profilesError } = await profileQuery

    // 3. Tüm kullanıcı level'larını çek
    const { data: levelsData } = await supabase
        .from("user_levels")
        .select("id, level")

    // Level haritası oluştur
    const levelMap = new Map<string, number>()
    levelsData?.forEach(l => levelMap.set(l.id, l.level))

    // FIX 3: Hata kontrolü ve kullanıcı dostu hata mesajı
    if (profilesError) {
        console.error("Kullanıcı çekme hatası:", profilesError)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card>
                    <CardHeader>
                        <CardTitle>Hata Oluştu</CardTitle>
                        <CardDescription>Kullanıcılar yüklenirken bir hata oluştu: {profilesError.message}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Profilleri level ile birleştir
    let usersWithLevel = (profilesData || []).map(p => ({
        ...p,
        level: levelMap.get(p.id) ?? 0
    })) as UserProfile[]

    // Level'a göre sırala (yüksekten düşüğe)
    usersWithLevel.sort((a, b) => (b.level ?? 0) - (a.level ?? 0))

    // Role filtresi (JS tarafında)
    if (roleFilter === "admin") {
        usersWithLevel = usersWithLevel.filter(u => (u.level ?? 0) >= ROLES.ADMIN)
    } else if (roleFilter === "user") {
        usersWithLevel = usersWithLevel.filter(u => (u.level ?? 0) < ROLES.ADMIN)
    }

    let filteredUsers = usersWithLevel

    // JS-side search
    if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filteredUsers = filteredUsers.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
            u.school_number.toLowerCase().includes(q)
        )
    }

    const totalUsers = filteredUsers.length

    // İstatistikler
    const levelStats = {
        total: totalUsers,
        superAdmins: filteredUsers.filter(u => (u.level ?? 0) >= ROLES.SUPER_ADMIN).length,
        admins: filteredUsers.filter(u => (u.level ?? 0) >= ROLES.ADMIN && (u.level ?? 0) < ROLES.SUPER_ADMIN).length,
        users: filteredUsers.filter(u => (u.level ?? 0) < ROLES.ADMIN).length,
    }

    const getLevelBadge = (level: number) => {
        const info = getLevelInfo(level)
        const Icon = level >= ROLES.ADMIN ? Shield : null
        const isOwner = level >= ROLES.OWNER

        const badgeContent = (
            <>
                {isOwner ? <Crown className="h-3 w-3" /> : Icon && <Icon className="h-3 w-3" />}
                {info.label}
            </>
        )

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant={level >= ROLES.ADMIN ? "default" : "secondary"} className="gap-1">
                            {badgeContent}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{info.description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <RoleGuard minLevel={ROLES.ADMIN}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Kullanıcı Yönetimi
                                </h1>
                                <Badge variant="outline" className="gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {totalUsers}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Shield className="h-4 w-4" />
                                {getLevelInfo(currentUserLevel).label} Paneli
                            </p>
                        </div>
                    </div>
                </div>

                {/* İstatistikler */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Toplam Kullanıcı */}
                    <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{levelStats.total}</div>
                            <p className="text-xs text-muted-foreground">Kayıtlı kullanıcı</p>
                        </CardContent>
                    </Card>

                    {/* Süper Adminler */}
                    <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Süper Admin</CardTitle>
                            <Crown className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{levelStats.superAdmins}</div>
                            <p className="text-xs text-muted-foreground">En yüksek yetki</p>
                        </CardContent>
                    </Card>

                    {/* Adminler */}
                    <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admin</CardTitle>
                            <Shield className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-600">{levelStats.admins}</div>
                            <p className="text-xs text-muted-foreground">Yönetim yetkisi</p>
                        </CardContent>
                    </Card>

                    {/* Kullanıcılar */}
                    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kullanıcı</CardTitle>
                            <GraduationCap className="h-4 w-4 text-slate-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-600">{levelStats.users}</div>
                            <p className="text-xs text-muted-foreground">Standart üye</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Kullanıcı Tablosu */}
                <Card className="shadow-xl border-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    Kullanıcı Listesi
                                </CardTitle>
                                <CardDescription>
                                    {currentUserLevel >= ROLES.SUPER_ADMIN ? "Kullanıcıları yönetin." : "Kullanıcıları görüntüleyin."}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <Hash className="h-3 w-3" />
                                {filteredUsers.length} sonuç
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <UserFilterBar classes={classes} />

                        <div className="rounded-lg border bg-card overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[300px]">Kullanıcı</TableHead>
                                        <TableHead>Okul No</TableHead>
                                        <TableHead>Sınıf</TableHead>
                                        <TableHead>Seviye</TableHead>
                                        <TableHead>Son Aktif</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody suppressHydrationWarning>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => {
                                            const userLevel = user.level ?? 0
                                            const canEditLevel = currentUserLevel > userLevel
                                            const isCurrentUser = user.id === currentUser.id
                                            const canEditProfile = currentUserLevel >= ROLES.ADMIN && (canEditLevel || isCurrentUser)
                                            const avatarColor = getAvatarColor(user.first_name)
                                            const initials = getInitials(user.first_name, user.last_name)
                                            const { text: activeText, isRecent } = formatLastActive(user.last_active)

                                            return (
                                                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {/* Avatar */}
                                                            <div className="relative">
                                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
                                                                    {initials}
                                                                </div>
                                                                {isCurrentUser && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium flex items-center gap-2">
                                                                    {getFullName(user.first_name, user.last_name)}
                                                                    {isCurrentUser && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Sizin Hesabınız
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{user.school_number}</TableCell>
                                                    <TableCell>{user.class}</TableCell>
                                                    <TableCell>{getLevelBadge(userLevel)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            {isRecent && <Sparkles className="h-3.5 w-3.5 text-green-500" />}
                                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-sm">{activeText}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {canEditProfile && (
                                                                <EditUserButton
                                                                    user={user}
                                                                    currentUserLevel={currentUserLevel}
                                                                />
                                                            )}
                                                            {currentUserLevel >= ROLES.SUPER_ADMIN && canEditLevel && (
                                                                <LevelSelector
                                                                    userId={user.id}
                                                                    currentLevel={userLevel}
                                                                    maxLevel={currentUserLevel}
                                                                />
                                                            )}
                                                            {currentUserLevel >= ROLES.SUPER_ADMIN && (
                                                                <MetadataButton profileData={user} />
                                                            )}
                                                            {isCurrentUser && currentUserLevel < ROLES.SUPER_ADMIN && (
                                                                <span className="text-xs text-muted-foreground">Seviye değiştiremezsiniz</span>
                                                            )}
                                                            {!canEditProfile && !isCurrentUser && (
                                                                <span className="text-xs text-muted-foreground">Yetki yok</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                                    <h3 className="font-semibold text-lg mb-2">Kullanıcı bulunamadı</h3>
                                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                        Arama kriterlerinizi değiştirip tekrar deneyin veya filtreleri temizleyin.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </RoleGuard>
    )
}