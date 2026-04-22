"use client"

import { useState, useMemo, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getFullName, getInitials } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
    Calendar,
    Trash2,
    Loader2,
    RotateCcw,
    Download,
    FileText,
    FileJson,
    Printer
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { adminDeleteAccount, adminRestoreAccount } from "@/app/actions/admin"
import { PERMS } from "@/lib/auth/permission-constants"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Table as LucideTable } from "lucide-react"

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
    permissions: string[]
    canExportTexts: boolean
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

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
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
    availableYears,
    permissions,
    canExportTexts
}: UserManagementClientProps) {

    // Local State
    const [searchQuery, setSearchQuery] = useState("")
    const [classFilter, setClassFilter] = useState("all")
    const [roleFilter, setRoleFilter] = useState("all")
    const [yearFilter, setYearFilter] = useState("all")
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
    const [restoringUserId, setRestoringUserId] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Permission kontrolü
    const canDeleteAccount = permissions.includes(PERMS.ADMIN_ACCOUNT_DELETE)

    // Hesap silme handler
    const handleDeleteAccount = (userId: string) => {
        setDeletingUserId(userId)
        startTransition(async () => {
            try {
                const result = await adminDeleteAccount(userId)
                if (result.success) {
                    toast.success("Hesap başarıyla silindi")
                    router.refresh()
                } else {
                    toast.error(result.error || "Hesap silinemedi")
                }
            } catch {
                toast.error("Beklenmeyen bir hata oluştu")
            } finally {
                setDeletingUserId(null)
            }
        })
    }

    // Hesap geri getirme handler
    const handleRestoreAccount = (userId: string) => {
        setRestoringUserId(userId)
        startTransition(async () => {
            try {
                const result = await adminRestoreAccount(userId)
                if (result.success) {
                    toast.success("Hesap başarıyla geri getirildi")
                    router.refresh()
                } else {
                    toast.error(result.error || "Hesap geri getirilemedi")
                }
            } catch {
                toast.error("Beklenmeyen bir hata oluştu")
            } finally {
                setRestoringUserId(null)
            }
        })
    }

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

    // ─── Per-User Export ───
    const downloadBlob = useCallback((blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, [])

    const handleUserExport = async (targetUser: UserProfile, exportFormat: 'md' | 'csv' | 'json') => {
        setExporting(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_texts_export')
            if (error) throw error

            const allData = (data as any[]) || []
            // Bu kullanıcının yazdığı mesajları filtrele (yazar olarak)
            const exportData = allData.filter(d => d.author_id === targetUser.id)

            const userName = getFullName(targetUser.first_name, targetUser.last_name)
            const safeFileName = `${targetUser.school_number}_${targetUser.first_name}_${targetUser.last_name}`.replace(/\s+/g, '_')

            if (!exportData.length) {
                toast.error(`${userName} için dışa aktarılacak mesaj bulunamadı`)
                setExporting(false)
                return
            }

            const timestamp = format(new Date(), 'yyyyMMdd_HHmm')

            if (exportFormat === 'json') {
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                downloadBlob(blob, `mesajlar_${safeFileName}_${timestamp}.json`)
            } else if (exportFormat === 'csv') {
                const headers = ['Alıcı Sınıf', 'Alıcı No', 'Alıcı Adı', 'Mesaj', 'Anonim mi', 'Tarih']
                const rows = exportData.map(d => [
                    d.recipient_class || 'Bilinmiyor',
                    d.recipient_school_number || '',
                    `"${(d.recipient_name || '').replace(/"/g, '""')}"`,
                    `"${(d.content || '').replace(/"/g, '""')}"`,
                    d.is_anonymous ? 'Evet' : 'Hayır',
                    format(new Date(d.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })
                ])
                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
                downloadBlob(blob, `mesajlar_${safeFileName}_${timestamp}.csv`)
            } else if (exportFormat === 'md') {
                let mdContent = `# ${userName} — Yazdığı Mesajlar\n`
                mdContent += `> Sınıf: ${targetUser.class} | No: ${targetUser.school_number}\n`
                mdContent += `> Dışa aktarma tarihi: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: tr })}\n\n`
                mdContent += `---\n\n`

                exportData.forEach((msg: any) => {
                    mdContent += `**Alıcı:** ${msg.recipient_name} (${msg.recipient_class}) ${msg.is_anonymous ? '*(Anonim olarak)*' : ''}\n`
                    mdContent += `**Tarih:** ${format(new Date(msg.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}\n\n`
                    mdContent += `> ${msg.content.split('\n').join('\n> ')}\n\n`
                    mdContent += `---\n\n`
                })
                const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' })
                downloadBlob(blob, `mesajlar_${safeFileName}_${timestamp}.md`)
            }
            toast.success(`${userName} için ${exportData.length} mesaj dışa aktarıldı`)
        } catch (err) {
            console.error('Export error:', err)
            toast.error('Dışa aktarma başarısız!')
        } finally {
            setExporting(false)
        }
    }

    const handleUserPrintPreview = async (targetUser: UserProfile) => {
        setExporting(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase.rpc('get_admin_texts_export')
            if (error) throw error

            const allData = (data as any[]) || []
            const exportData = allData.filter(d => d.author_id === targetUser.id)
            const userName = getFullName(targetUser.first_name, targetUser.last_name)

            if (!exportData.length) {
                toast.error(`${userName} için dışa aktarılacak mesaj bulunamadı`)
                setExporting(false)
                return
            }

            const timestamp = format(new Date(), 'dd.MM.yyyy HH:mm')

            const escapeHtml = (str: string) =>
                (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

            const rows = exportData.map((d: any, i: number) => `
                <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
                    <td>${i + 1}</td>
                    <td>${escapeHtml(d.recipient_class || 'Bilinmiyor')}</td>
                    <td>${escapeHtml(d.recipient_name)}</td>
                    <td class="content-cell">${escapeHtml(d.content)}</td>
                    <td>${d.is_anonymous ? 'Evet' : 'Hayır'}</td>
                    <td>${format(new Date(d.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}</td>
                </tr>
            `).join('')

            const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(userName)} — Mesajlar</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            padding: 24px;
            background: #fff;
            font-size: 11px;
            line-height: 1.5;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #6366f1;
        }
        .header h1 {
            font-size: 20px;
            font-weight: 700;
            color: #312e81;
        }
        .header .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
        }
        .header .meta {
            text-align: right;
            color: #64748b;
            font-size: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        th {
            background: #4338ca;
            color: #fff;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
            word-break: break-word;
        }
        tr.even { background: #f8fafc; }
        tr.odd { background: #fff; }
        tr:hover { background: #eef2ff !important; }
        .content-cell {
            max-width: 400px;
            white-space: pre-wrap;
            font-size: 10px;
            line-height: 1.4;
        }
        .footer {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
        }
        .print-hint {
            text-align: center;
            padding: 12px;
            margin-bottom: 16px;
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            color: #92400e;
            font-size: 12px;
        }
        .print-hint kbd {
            background: #fff;
            border: 1px solid #d1d5db;
            border-radius: 3px;
            padding: 1px 5px;
            font-family: monospace;
            font-size: 11px;
        }
        @media print {
            .print-hint { display: none !important; }
            body { padding: 8px; font-size: 9px; }
            th { background: #4338ca !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr.even { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table { font-size: 8px; }
            td { padding: 3px 5px; }
            .content-cell { max-width: 300px; font-size: 8px; }
            .footer { font-size: 8px; }
            @page { size: landscape; margin: 10mm; }
        }
    </style>
</head>
<body>
    <div class="print-hint">
        📄 PDF olarak kaydetmek için <kbd>Ctrl</kbd> + <kbd>P</kbd> tuşlarına basın ve hedefi <strong>"PDF olarak kaydet"</strong> seçin.
    </div>
    <div class="header">
        <div>
            <h1>📋 ${escapeHtml(userName)} — Yazdığı Mesajlar</h1>
            <div class="subtitle">Sınıf: ${escapeHtml(targetUser.class)} | No: ${escapeHtml(targetUser.school_number)}</div>
        </div>
        <div class="meta">
            <div>${timestamp}</div>
            <div><strong>${exportData.length}</strong> mesaj</div>
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Alıcı Sınıf</th>
                <th>Alıcı</th>
                <th>Mesaj</th>
                <th>Anonim</th>
                <th>Tarih</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <div class="footer">
        <span>EGL Yıllık — ${escapeHtml(userName)} Mesaj Raporu</span>
        <span>Toplam: ${exportData.length} mesaj</span>
    </div>
</body>
</html>`

            const printWindow = window.open('', '_blank')
            if (printWindow) {
                printWindow.document.write(htmlContent)
                printWindow.document.close()
                toast.success('Yazdırma önizlemesi yeni sekmede açıldı')
            } else {
                toast.error('Yeni sekme açılamadı. Pop-up engelleyiciyi kontrol edin.')
            }
        } catch (err) {
            console.error('Print preview error:', err)
            toast.error('Önizleme oluşturulamadı!')
        } finally {
            setExporting(false)
        }
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

                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <UserRolesDialog
                                                            userId={user.id}
                                                            userName={getFullName(user.first_name, user.last_name)}
                                                            availableRoles={availableRoles}
                                                        />
                                                        <EditUserButton user={user} />
                                                        {canExportTexts && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                                                        disabled={exporting}
                                                                    >
                                                                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                                                                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                                                        Mesajları dışa aktar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleUserPrintPreview(user)} className="gap-2 cursor-pointer">
                                                                        <Printer className="h-4 w-4" /> PDF / Yazdır
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => handleUserExport(user, 'md')} className="gap-2 cursor-pointer">
                                                                        <FileText className="h-4 w-4" /> Markdown (.md)
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleUserExport(user, 'csv')} className="gap-2 cursor-pointer">
                                                                        <LucideTable className="h-4 w-4" /> Excel / CSV (.csv)
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleUserExport(user, 'json')} className="gap-2 cursor-pointer">
                                                                        <FileJson className="h-4 w-4" /> JSON (.json)
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                        {canDeleteAccount && !isCurrentUser && isDeleted && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                                                        disabled={isPending && restoringUserId === user.id}
                                                                    >
                                                                        {isPending && restoringUserId === user.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <RotateCcw className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Hesabı Geri Getir</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            <strong>{getFullName(user.first_name, user.last_name)}</strong> kullanıcısının hesabını geri getirmek istediğinize emin misiniz?
                                                                            Bu işlem hesabı tekrar aktif hale getirecek ve kullanıcının giriş yapabilmesini sağlayacaktır.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleRestoreAccount(user.id)}
                                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                                        >
                                                                            Geri Getir
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                        {canDeleteAccount && !isCurrentUser && !isDeleted && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                                        disabled={isPending && deletingUserId === user.id}
                                                                    >
                                                                        {isPending && deletingUserId === user.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Hesabı Sil</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            <strong>{getFullName(user.first_name, user.last_name)}</strong> kullanıcısının hesabını silmek istediğinize emin misiniz?
                                                                            Bu işlem hesabı devre dışı bırakacak ve kullanıcının oturumunu sonlandıracaktır.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteAccount(user.id)}
                                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                                        >
                                                                            Hesabı Sil
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
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
