import { createClient } from "@/lib/supabase/server"
import RoleGuard from "@/components/role-guard"
import { ROLES } from "@/lib/constants"
import { requireMod } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Shield, Users, Crown, ChevronLeft, Sparkles, Star, LayoutDashboard } from "lucide-react"
import { LevelSelector, SearchInput, EditUserButton } from "@/components/admin-actions"
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

    requireMod();

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
        .select("id, first_name, last_name, school_number, class, level")
        .order("level", { ascending: false })
        .order("last_name")

    const { data: users, error } = await query

    if (error) console.error("Kullanıcı çekme hatası:", error)

    // Arama filtresi
    let filteredUsers = (users || []) as UserProfile[]

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
        superAdmins: filteredUsers.filter(u => u.level === ROLES.SUPER_ADMIN).length,
        admins: filteredUsers.filter(u => u.level === ROLES.ADMIN).length,
        moderators: filteredUsers.filter(u => u.level === ROLES.MODERATOR).length,
        users: filteredUsers.filter(u => u.level === ROLES.USER).length,
    }

    const getLevelBadge = (level: number) => {
        let badgeContent: React.ReactNode;
        let tooltipText: string;

        if (level >= ROLES.OWNER) {
            badgeContent = (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 cursor-help shadow-lg shadow-purple-500/50 animate-pulse">
                    <Crown className="h-3 w-3 mr-1" />
                    Owner
                </Badge>
            );
            tooltipText = "Tam Yetki: Veritabanı silme, admin atama, her şeyi yönetme.";
        } else if (level >= ROLES.SUPER_ADMIN) {
            badgeContent = (
                <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 hover:from-red-700 hover:to-orange-700 cursor-help shadow-md shadow-red-500/50">
                    <Shield className="h-3 w-3 mr-1" />
                    Süper Admin
                </Badge>
            );
            tooltipText = "Yüksek Yetki: Admin ve Moderatör atayabilir, tüm içerikleri ve kullanıcıları yönetebilir.";
        } else if (level >= ROLES.ADMIN) {
            badgeContent = (
                <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-0 hover:from-amber-700 hover:to-yellow-700 cursor-help shadow-md shadow-amber-500/50">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                </Badge>
            );
            tooltipText = "Yönetim: Moderatör atayabilir, içerikleri yönetebilir, kullanıcıları düzenleyebilir.";
        } else if (level >= ROLES.MODERATOR) {
            badgeContent = (
                <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 hover:from-blue-700 hover:to-cyan-700 cursor-help shadow-md shadow-blue-500/50">
                    <Star className="h-3 w-3 mr-1" />
                    Moderatör
                </Badge>
            );
            tooltipText = "Denetim: Profil bilgilerini düzenleyebilir (Rol değiştiremez).";
        } else {
            badgeContent = (
                <Badge variant="outline" className="cursor-help border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-900">
                    Kullanıcı
                </Badge>
            );
            tooltipText = "Standart: Sadece kendi profilini görebilir ve mesaj yazabilir.";
        }

        return (
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs text-xs">{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <RoleGuard minLevel={ROLES.MODERATOR}>
            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-100 dark:from-slate-950 dark:via-slate-900 dark:to-fuchsia-950">
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-300/20 via-transparent to-transparent pointer-events-none" />
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-300/20 via-transparent to-transparent pointer-events-none" />

                {/* Header */}
                <header className="border-b border-border/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-pink-500/5">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white ring-2 ring-red-500/30 shadow-lg shadow-red-500/50 animate-pulse">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent font-serif leading-none">Kullanıcı Yönetimi</h1>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                    <Sparkles className="h-2.5 w-2.5 text-pink-500" />
                                    {currentUserLevel >= ROLES.SUPER_ADMIN ? "Süper Admin Paneli" : currentUserLevel >= ROLES.ADMIN ? "Admin Paneli" : currentUserLevel >= ROLES.MODERATOR ? "Moderatör Paneli" : "Kullanıcı Paneli"}
                                </p>
                            </div>
                        </div>

                        <Link href="/dashboard">
                            <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-300">
                                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Öğrenci Görünümü</span>
                            </Button>
                        </Link>
                    </div>
                </header>

                <main className="container mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* İstatistikler */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-gradient-to-br from-red-500 to-orange-500 text-white border-none shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 hover:scale-105 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Süper Adminler</CardTitle>
                                <Shield className="h-5 w-5 opacity-75" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.superAdmins}</div>
                                <p className="text-xs opacity-75 mt-1">En yüksek yetki</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white border-none shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Adminler</CardTitle>
                                <Shield className="h-5 w-5 opacity-75" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.admins}</div>
                                <p className="text-xs opacity-75 mt-1">Yönetim yetkisi</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-none shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Moderatörler</CardTitle>
                                <Star className="h-5 w-5 opacity-75" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.moderators}</div>
                                <p className="text-xs opacity-75 mt-1">Denetim yetkisi</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-slate-500 to-gray-500 text-white border-none shadow-xl shadow-slate-500/30 hover:shadow-2xl hover:shadow-slate-500/40 transition-all duration-300 hover:scale-105 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-sm font-medium opacity-90">Kullanıcılar</CardTitle>
                                <Users className="h-5 w-5 opacity-75" />
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-bold">{levelStats.users}</div>
                                <p className="text-xs opacity-75 mt-1">Standart üyeler</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Kullanıcı Tablosu */}
                    <Card className="border-border shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-border bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 px-4 sm:px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Kullanıcı Listesi</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        {currentUserLevel >= ROLES.SUPER_ADMIN
                                            ? "Kullanıcı seviyelerini ve profil bilgilerini yönetin."
                                            : "Kullanıcı profil bilgilerini görüntüleyin ve düzenleyin."}
                                    </CardDescription>
                                </div>
                                <SearchInput />
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="w-full overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                                        <TableRow>
                                            <TableHead className="w-[25%] pl-6 font-bold text-foreground">Kullanıcı</TableHead>
                                            <TableHead className="w-[15%] font-bold text-foreground">Okul No</TableHead>
                                            <TableHead className="w-[15%] font-bold text-foreground">Sınıf</TableHead>
                                            <TableHead className="w-[15%] font-bold text-foreground">Seviye</TableHead>
                                            <TableHead className="w-[30%] text-right pr-6 font-bold text-foreground">İşlemler</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user, index) => {
                                            const canEditLevel = currentUserLevel > (user.level ?? 0)
                                            const canEditProfile = currentUserLevel >= ROLES.MODERATOR && currentUserLevel > (user.level ?? 0)
                                            const isCurrentUser = user.id === currentUser.id

                                            // Her kullanıcı için farklı hover rengi
                                            const hoverColors = [
                                                'hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/30 dark:hover:to-orange-950/30',
                                                'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30',
                                                'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/30 dark:hover:to-cyan-950/30',
                                                'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30',
                                                'hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 dark:hover:from-amber-950/30 dark:hover:to-yellow-950/30'
                                            ]
                                            const hoverColor = hoverColors[index % hoverColors.length]

                                            return (
                                                <TableRow
                                                    key={user.id}
                                                    className={`${hoverColor} transition-all duration-300 group border-border ${isCurrentUser ? 'bg-gradient-to-r from-pink-50/50 to-purple-50/50 dark:from-pink-950/20 dark:to-purple-950/20' : ''}`}
                                                >
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col">
                                                            <span className={`font-semibold transition-colors ${isCurrentUser ? 'text-pink-600 dark:text-pink-400' : 'text-foreground group-hover:text-red-600 dark:group-hover:text-red-400'}`}>
                                                                {user.first_name} {user.last_name}
                                                            </span>
                                                            {isCurrentUser && (
                                                                <Badge className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 w-fit mt-1 shadow-md">
                                                                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                                                                    Siz
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground font-medium">#{user.school_number}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-300 dark:border-slate-600 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all"
                                                        >
                                                            {user.class}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getLevelBadge(user.level ?? 0)}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {/* Profil Düzenleme Butonu */}
                                                            {canEditProfile && !isCurrentUser ? (
                                                                <EditUserButton
                                                                    user={user}
                                                                    currentUserLevel={currentUserLevel}
                                                                />
                                                            ) : null}

                                                            {/* Seviye Değiştirme (Sadece Süper Admin+) */}
                                                            {currentUserLevel >= ROLES.SUPER_ADMIN && canEditLevel && !isCurrentUser ? (
                                                                <LevelSelector
                                                                    userId={user.id}
                                                                    currentLevel={user.level ?? 0}
                                                                    maxLevel={currentUserLevel}
                                                                />
                                                            ) : null}

                                                            {/* Mesaj */}
                                                            {isCurrentUser && (
                                                                <Badge variant="outline" className="text-xs border-pink-300 text-pink-600 dark:border-pink-700 dark:text-pink-400">
                                                                    Kendi profilinizi değiştiremezsiniz
                                                                </Badge>
                                                            )}
                                                            {!canEditProfile && !isCurrentUser && (
                                                                <Badge variant="outline" className="text-xs border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                                                    Yetkiniz yok
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
                                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                                    <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 p-6 rounded-full mb-4 animate-pulse">
                                        <Users className="h-10 w-10 text-red-500" />
                                    </div>
                                    <p className="font-medium text-lg">Kullanıcı bulunamadı.</p>
                                    <p className="text-sm opacity-60 mt-1">Arama kriterlerinizi değiştirip tekrar deneyin.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </RoleGuard>
    )
}