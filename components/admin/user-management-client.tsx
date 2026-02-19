"use client"

import { useState, useMemo } from "react"
import { getFullName, getInitials } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Shield,
    Users,
    Crown,
    Sparkles,
    Star,
    Hash,
    GraduationCap,
    TrendingUp,
    Clock,
    Search,
    Filter,
    X,
    Copy,
    Check,
    Calendar
} from "lucide-react"
import { EditUserButton } from "@/components/admin/admin-actions"
import { UserRolesDialog } from "@/components/admin/user-roles-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface UserProfile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    user_year: number | null
    role_level: number
    highest_role_key: string
    last_active: string | null
    is_deleted: boolean
    deleted_at: string | null
}

interface Role {
    key: string
    label: string
    level: number
    description: string
    badge_color: string
}

interface UserManagementClientProps {
    initialUsers: UserProfile[]
    currentUser: { id: string }
    classes: string[]
    availableRoles: Role[]
    availableYears: number[]
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
    const charCode = (name || "").charCodeAt(0) || 0
    return avatarColors[charCode % avatarColors.length]
}

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

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const hours = date.getHours().toString().padStart(2, "0")
    const mins = date.getMinutes().toString().padStart(2, "0")

    return { text: `${day}.${month}.${date.getFullYear()} ${hours}:${mins}`, isRecent: false }
}

// Level'dan role key'i bul (artık doğrudan highest_role_key kullanılabilir)
function getUserRoleKey(user: UserProfile): string {
    return user.highest_role_key || "user"
}

export function UserManagementClient({
    initialUsers,
    currentUser,
    classes,
    availableRoles,
    availableYears
}: UserManagementClientProps) {

    // Local State
    const [searchQuery, setSearchQuery] = useState("")
    const [classFilter, setClassFilter] = useState("all")
    const [roleFilter, setRoleFilter] = useState("all")
    const [yearFilter, setYearFilter] = useState("all")
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Copy user ID to clipboard
    const copyUserId = async (userId: string) => {
        try {
            await navigator.clipboard.writeText(userId)
            setCopiedId(userId)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    // Rol seviyelerini tek seferde hesapla - availableRoles zaten level içeriyor
    const roleLevels = useMemo(() => {
        const levels: Record<string, number> = {}
        availableRoles.forEach(r => {
            levels[r.key] = r.level
        })
        return levels
    }, [availableRoles])

    // Kısa erişim için sabitler
    const adminLevel = roleLevels["admin"] ?? 50
    const superAdminLevel = roleLevels["super_admin"] ?? 100
    const ownerLevel = roleLevels["owner"] ?? 1000

    // Memoized Filtering
    const filteredUsers = useMemo(() => {
        return initialUsers.filter(user => {
            // 1. Search Query (Name or School Number)
            const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
            const matchesSearch = !searchQuery ||
                fullName.includes(searchQuery.toLowerCase()) ||
                user.school_number.includes(searchQuery)

            // 2. Class Filter
            const matchesClass = classFilter === "all" || user.class === classFilter

            // 3. Year Filter
            const matchesYear = yearFilter === "all" || user.user_year?.toString() === yearFilter

            // 4. Role Filter (dinamik adminLevel kullanılıyor)
            let matchesRole = true
            if (roleFilter === "admin") {
                matchesRole = (user.role_level ?? 0) >= adminLevel
            } else if (roleFilter === "user") {
                matchesRole = (user.role_level ?? 0) < adminLevel
            }

            return matchesSearch && matchesClass && matchesYear && matchesRole
        })
    }, [initialUsers, searchQuery, classFilter, yearFilter, roleFilter, adminLevel])

    // Stats based on filtered data
    const stats = useMemo(() => {
        return {
            total: filteredUsers.length,
            superAdmins: filteredUsers.filter(u => (u.role_level ?? 0) >= superAdminLevel).length,
            admins: filteredUsers.filter(u => (u.role_level ?? 0) >= adminLevel && (u.role_level ?? 0) < superAdminLevel).length,
            users: filteredUsers.filter(u => (u.role_level ?? 0) < adminLevel).length,
        }
    }, [filteredUsers, adminLevel, superAdminLevel])

    // Rol badge'i - veriler doğrudan availableRoles'dan geliyor
    const getRoleBadge = (roleKey: string, roleLevel: number) => {
        const role = availableRoles.find(r => r.key === roleKey)
        if (!role) return null

        const Icon = roleLevel >= adminLevel ? Shield : null
        const isOwner = roleLevel >= ownerLevel

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant={roleLevel >= adminLevel ? "default" : "secondary"} className={cn("gap-1", role.badge_color)}>
                            {isOwner ? <Crown className="h-3 w-3" /> : Icon && <Icon className="h-3 w-3" />}
                            {role.label}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{role.description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    const hasFilters = classFilter !== "all" || roleFilter !== "all" || yearFilter !== "all" || searchQuery !== ""

    const clearFilters = () => {
        setClassFilter("all")
        setRoleFilter("all")
        setYearFilter("all")
        setSearchQuery("")
    }

    return (
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
                                {stats.total}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Shield className="h-4 w-4" />
                            Yönetici Paneli
                        </p>
                    </div>
                </div>
            </div>

            {/* İstatistikler */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Filtrelenmiş</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Kayıtlı kullanıcı</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Süper Admin</CardTitle>
                        <Crown className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.superAdmins}</div>
                        <p className="text-xs text-muted-foreground">En yüksek yetki</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Admin</CardTitle>
                        <Shield className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{stats.admins}</div>
                        <p className="text-xs text-muted-foreground">Yönetim yetkisi</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Kullanıcı</CardTitle>
                        <GraduationCap className="h-4 w-4 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-600">{stats.users}</div>
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
                                Kullanıcıları görüntüleyin ve düzenleyin.
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                            <Hash className="h-3 w-3" />
                            {filteredUsers.length} sonuç
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Local Filter Bar */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="İsim veya okul no ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={classFilter} onValueChange={setClassFilter}>
                                <SelectTrigger className="w-[140px] h-10">
                                    <div className="flex items-center gap-2 truncate">
                                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="truncate">{classFilter === "all" ? "Tüm Sınıflar" : classFilter}</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Sınıflar</SelectItem>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[140px] h-10">
                                    <div className="flex items-center gap-2 truncate">
                                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="truncate">
                                            {roleFilter === "all" ? "Tüm Roller" : (roleFilter === "admin" ? "Yöneticiler" : "Kullanıcılar")}
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Roller</SelectItem>
                                    <SelectItem value="admin">Yöneticiler</SelectItem>
                                    <SelectItem value="user">Kullanıcılar</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={yearFilter} onValueChange={setYearFilter}>
                                <SelectTrigger className="w-[120px] h-10">
                                    <div className="flex items-center gap-2 truncate">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="truncate">
                                            {yearFilter === "all" ? "Tüm Yıllar" : yearFilter}
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Yıllar</SelectItem>
                                    {availableYears.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {hasFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-10 px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4 mr-1.5" />
                                    Temizle
                                </Button>
                            )}
                        </div>
                    </div>

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

                            <TableBody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => {
                                        const isCurrentUser = user.id === currentUser.id
                                        const isDeleted = user.is_deleted || !!user.deleted_at

                                        const avatarColor = getAvatarColor(user.first_name)
                                        const initials = getInitials(user.first_name, user.last_name)

                                        const showDate = isDeleted ? user.deleted_at : user.last_active
                                        const { text: activeText, isRecent } = formatLastActive(showDate)

                                        return (
                                            <TableRow
                                                key={user.id}
                                                className={cn("hover:bg-muted/50 transition-colors", isDeleted && "opacity-60")}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
                                                                {initials}
                                                            </div>
                                                            {isCurrentUser && (
                                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                                                            )}
                                                        </div>

                                                        <div className="font-medium flex items-center gap-2 group/name">
                                                            {getFullName(user.first_name, user.last_name)}

                                                            {isCurrentUser && (
                                                                <Badge variant="outline" className="text-xs">Siz</Badge>
                                                            )}

                                                            {isDeleted && (
                                                                <Badge variant="destructive" className="text-xs">Silindi</Badge>
                                                            )}

                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={() => copyUserId(user.id)}
                                                                            className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                        >
                                                                            {copiedId === user.id ? (
                                                                                <Check className="h-3.5 w-3.5 text-green-500" />
                                                                            ) : (
                                                                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                                            )}
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{copiedId === user.id ? "Kopyalandı!" : "UID Kopyala"}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>{user.school_number}</TableCell>
                                                <TableCell>{user.class}</TableCell>
                                                <TableCell>{getRoleBadge(user.highest_role_key, user.role_level ?? 0)}</TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {!isDeleted && isRecent && <Sparkles className="h-3.5 w-3.5 text-green-500" />}
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-sm">{activeText}</span>
                                                        {isDeleted && <span className="text-xs text-muted-foreground">(silinme)</span>}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <UserRolesDialog
                                                            userId={user.id}
                                                            userName={getFullName(user.first_name, user.last_name)}
                                                            availableRoles={availableRoles}
                                                        />
                                                        <EditUserButton user={user} />
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
                                                <p className="text-sm text-muted-foreground">
                                                    Kriterleri değiştirip tekrar deneyin.
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
    )
}
