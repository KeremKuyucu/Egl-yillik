"use client"

import { useState, useMemo } from "react"
import { PERMS } from "@/lib/auth/permission-constants"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Shield,
    Key,
    Plus,
    Trash2,
    Edit,
    Search,
    ChevronDown,
    ChevronRight,
    Check,
    X,
    Download,
    Layers,
    Lock,
    Hash,
    Sparkles,
    MoreVertical,
    AlertTriangle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
    adminCreateRole,
    adminUpdateRole,
    adminDeleteRole,
    adminAddRolePermission,
    adminRemoveRolePermission
} from "@/app/actions/admin"

interface Role {
    key: string
    label: string
    level: number
    description: string
    badge_color: string
    created_at: string
}

interface Permission {
    key: string
    description: string | null
}

interface RolePermission {
    role_key: string
    perm_key: string
}

interface RolesManagementClientProps {
    initialRoles: Role[]
    initialPermissions: Permission[]
    initialRolePermissions: RolePermission[]
    currentUserPermissions: string[]
}

// Rol seviyesine göre renk ve ikon
function getRoleLevelInfo(level: number) {
    if (level >= 100) return { color: "from-yellow-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", label: "Sahip" }
    if (level >= 90) return { color: "from-red-500 to-rose-600", bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-300", label: "Sistem" }
    if (level >= 80) return { color: "from-purple-500 to-violet-600", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-300", label: "Süper" }
    if (level >= 50) return { color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", label: "Admin" }
    return { color: "from-slate-400 to-slate-500", bg: "bg-slate-50 dark:bg-slate-950/30", text: "text-slate-700 dark:text-slate-300", label: "Kullanıcı" }
}

// İzinleri gruplara ayır
function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
    const groups: Record<string, Permission[]> = {}
    permissions.forEach(perm => {
        const parts = perm.key.split('.')
        const group = parts.length >= 2 ? parts[0] + '.' + parts[1] : parts[0]
        if (!groups[group]) groups[group] = []
        groups[group].push(perm)
    })
    return groups
}

// Grup isimlerini Türkçe'ye çevir
function getGroupLabel(groupKey: string): string {
    const labels: Record<string, string> = {
        'admin.feedback': 'Geri Bildirim',
        'admin.users': 'Kullanıcılar',
        'admin.roles': 'Roller',
        'admin.role_permissions': 'Rol İzinleri',
        'admin.stats': 'İstatistikler',
        'admin.suggestions': 'Öneriler',
        'admin.texts': 'Mesajlar',
        'admin.votes': 'Oylamalar',
        'admin.reminder': 'Hatırlatıcılar',
        'survey.categories': 'Anket Kategorileri',
        'email_opt_outs': 'E-posta Tercihleri',
        'site.settings': 'Site Ayarları',
        'system.logs': 'Sistem Logları',
        'system.texts': 'Sistem Metin',
    }
    return labels[groupKey] || groupKey
}

const COLOR_PRESETS = [
    {
        name: "Kızıl Alev",
        value: "bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 text-white border-0 shadow-xl shadow-red-600/50 ring-2 ring-red-500/40 hover:brightness-110"
    },
    {
        name: "Mor Kozmik",
        value: "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white border-0 shadow-xl shadow-purple-600/50 ring-2 ring-purple-500/40 hover:brightness-110"
    },
    {
        name: "Altın Işık",
        value: "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black border-0 shadow-xl shadow-amber-500/50 ring-2 ring-yellow-400/50 hover:brightness-110"
    },
    {
        name: "Neon Pembe",
        value: "bg-pink-500 text-white border-0 shadow-[0_0_20px_rgba(236,72,153,0.8)] hover:shadow-[0_0_28px_rgba(236,72,153,1)]"
    },
    {
        name: "Neon Mor",
        value: "bg-purple-600 text-white border-0 shadow-[0_0_20px_rgba(147,51,234,0.8)] hover:shadow-[0_0_28px_rgba(147,51,234,1)]"
    },
    {
        name: "Neon Mavi",
        value: "bg-blue-600 text-white border-0 shadow-[0_0_20px_rgba(37,99,235,0.8)] hover:shadow-[0_0_28px_rgba(37,99,235,1)]"
    },
    {
        name: "Hologram",
        value: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white border border-white/30 shadow-xl backdrop-blur-sm hover:brightness-110"
    },
    {
        name: "Cyber Pink",
        value: "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white border border-white/20 shadow-xl hover:brightness-110"
    },
    {
        name: "Karanlık Büyü",
        value: "bg-gradient-to-r from-neutral-900 via-purple-900 to-black text-purple-200 border border-purple-500/40 shadow-2xl shadow-purple-900/70"
    },
]

export function RolesManagementClient({
    initialRoles,
    initialPermissions,
    initialRolePermissions,
    currentUserPermissions
}: RolesManagementClientProps) {
    const [roles, setRoles] = useState<Role[]>(initialRoles)
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions)
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedRole, setExpandedRole] = useState<string | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [permSearchQuery, setPermSearchQuery] = useState("")
    const [showPermRef, setShowPermRef] = useState(false)

    // Form states
    const [newRoleKey, setNewRoleKey] = useState("")
    const [newRoleLabel, setNewRoleLabel] = useState("")
    const [newRoleLevel, setNewRoleLevel] = useState("")
    const [newRoleDescription, setNewRoleDescription] = useState("")
    const [newRoleBadgeColor, setNewRoleBadgeColor] = useState(COLOR_PRESETS[0].value)

    // Check permissions
    const canManageRoles = currentUserPermissions.includes(PERMS.ADMIN_ROLES_UPDATE)
    const canManagePermissions = currentUserPermissions.includes(PERMS.ADMIN_ROLE_PERMISSIONS_UPDATE)

    // Grouped permissions
    const groupedPermissions = useMemo(() => groupPermissions(initialPermissions), [initialPermissions])

    // Filtered roles based on search
    const filteredRoles = useMemo(() => {
        if (!searchQuery) return roles
        const query = searchQuery.toLowerCase()
        return roles.filter(role =>
            role.key.toLowerCase().includes(query) ||
            role.label.toLowerCase().includes(query) ||
            (role.description || '').toLowerCase().includes(query)
        )
    }, [roles, searchQuery])

    // Get permissions for a role
    const getRolePermissions = (roleKey: string): string[] => {
        return rolePermissions
            .filter(rp => rp.role_key === roleKey)
            .map(rp => rp.perm_key)
    }

    // Create new role
    const handleCreateRole = async () => {
        if (!newRoleKey || !newRoleLabel || !newRoleLevel) {
            toast.error("Tüm alanları doldurun")
            return
        }

        setIsLoading(true)
        try {
            const result = await adminCreateRole(newRoleKey, newRoleLabel, parseInt(newRoleLevel), newRoleDescription, newRoleBadgeColor)
            if (result.success) {
                setRoles(prev => [...prev, {
                    key: newRoleKey,
                    label: newRoleLabel,
                    level: parseInt(newRoleLevel),
                    description: newRoleDescription,
                    badge_color: newRoleBadgeColor,
                    created_at: new Date().toISOString()
                }].sort((a, b) => b.level - a.level))
                resetForm()
                setIsCreateDialogOpen(false)
                toast.success("Rol başarıyla oluşturuldu")
            } else {
                toast.error(result.error || "Rol oluşturulamadı")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    // Update role
    const handleUpdateRole = async () => {
        if (!editingRole || !newRoleLabel || !newRoleLevel) {
            toast.error("Tüm alanları doldurun")
            return
        }

        setIsLoading(true)
        try {
            const result = await adminUpdateRole(editingRole.key, newRoleLabel, parseInt(newRoleLevel), newRoleDescription, newRoleBadgeColor)
            if (result.success) {
                setRoles(prev => prev.map(r =>
                    r.key === editingRole.key
                        ? {
                            ...r,
                            label: newRoleLabel,
                            level: parseInt(newRoleLevel),
                            description: newRoleDescription,
                            badge_color: newRoleBadgeColor
                        }
                        : r
                ).sort((a, b) => b.level - a.level))
                setEditingRole(null)
                resetForm()
                toast.success("Rol başarıyla güncellendi")
            } else {
                toast.error(result.error || "Rol güncellenemedi")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    // Delete role
    const handleDeleteRole = async (roleKey: string) => {
        setIsLoading(true)
        try {
            const result = await adminDeleteRole(roleKey)
            if (result.success) {
                setRoles(prev => prev.filter(r => r.key !== roleKey))
                setRolePermissions(prev => prev.filter(rp => rp.role_key !== roleKey))
                if (expandedRole === roleKey) setExpandedRole(null)
                toast.success("Rol başarıyla silindi")
            } else {
                toast.error(result.error || "Rol silinemedi")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    // Toggle permission for role
    const handleTogglePermission = async (roleKey: string, permKey: string, hasPermission: boolean) => {
        // Optimistic update
        if (hasPermission) {
            setRolePermissions(prev => prev.filter(
                rp => !(rp.role_key === roleKey && rp.perm_key === permKey)
            ))
        } else {
            setRolePermissions(prev => [...prev, { role_key: roleKey, perm_key: permKey }])
        }

        try {
            const result = hasPermission
                ? await adminRemoveRolePermission(roleKey, permKey)
                : await adminAddRolePermission(roleKey, permKey)

            if (!result.success) {
                // Rollback on failure
                if (hasPermission) {
                    setRolePermissions(prev => [...prev, { role_key: roleKey, perm_key: permKey }])
                } else {
                    setRolePermissions(prev => prev.filter(
                        rp => !(rp.role_key === roleKey && rp.perm_key === permKey)
                    ))
                }
                toast.error(result.error || "İşlem başarısız")
            }
        } catch {
            // Rollback on error
            if (hasPermission) {
                setRolePermissions(prev => [...prev, { role_key: roleKey, perm_key: permKey }])
            } else {
                setRolePermissions(prev => prev.filter(
                    rp => !(rp.role_key === roleKey && rp.perm_key === permKey)
                ))
            }
            toast.error("Bir hata oluştu")
        }
    }

    // Start editing a role
    const startEditRole = (role: Role) => {
        setEditingRole(role)
        setNewRoleLabel(role.label)
        setNewRoleLevel(role.level.toString())
        setNewRoleDescription(role.description || "")
        setNewRoleBadgeColor(role.badge_color || COLOR_PRESETS[0].value)
    }

    const resetForm = () => {
        setNewRoleKey("")
        setNewRoleLabel("")
        setNewRoleLevel("")
        setNewRoleDescription("")
        setNewRoleBadgeColor(COLOR_PRESETS[0].value)
    }

    // Stats
    const stats = {
        totalRoles: roles.length,
        totalPermissions: initialPermissions.length,
        totalMappings: rolePermissions.length
    }

    // Export
    const exportRolePermissions = () => {
        const lines: string[] = ['Rol Key,Rol Etiket,Seviye,İzin Key,İzin Açıklama']
        roles.forEach(role => {
            const perms = getRolePermissions(role.key)
            if (perms.length === 0) {
                lines.push(`"${role.key}","${role.label}",${role.level},"(yok)","(yok)"`)
            } else {
                perms.forEach(permKey => {
                    const perm = initialPermissions.find(p => p.key === permKey)
                    const desc = perm?.description || '-'
                    lines.push(`"${role.key}","${role.label}",${role.level},"${permKey}","${desc}"`)
                })
            }
        })
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `rol-izin-esleme-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Export başarılı!')
    }

    // Role form dialog content (shared between create and edit)
    const RoleFormContent = ({ isEdit }: { isEdit: boolean }) => (
        <div className="grid gap-4 py-4">
            {!isEdit && (
                <div className="grid gap-2">
                    <Label htmlFor="roleKey" className="text-sm font-medium">Rol Anahtarı</Label>
                    <Input
                        id="roleKey"
                        placeholder="ornek_rol"
                        value={newRoleKey}
                        onChange={(e) => setNewRoleKey(e.target.value)}
                        className="rounded-xl"
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Küçük harf ve alt çizgi kullanın (örn: content_editor)
                    </p>
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="roleLabel" className="text-sm font-medium">Etiket</Label>
                    <Input
                        id="roleLabel"
                        placeholder="Örnek Rol"
                        value={newRoleLabel}
                        onChange={(e) => setNewRoleLabel(e.target.value)}
                        className="rounded-xl"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="roleLevel" className="text-sm font-medium">Seviye</Label>
                    <Input
                        id="roleLevel"
                        type="number"
                        placeholder="10"
                        value={newRoleLevel}
                        onChange={(e) => setNewRoleLevel(e.target.value)}
                        className="rounded-xl"
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="roleDescription" className="text-sm font-medium">Açıklama</Label>
                <Input
                    id="roleDescription"
                    placeholder="Bu rolün ne işe yaradığını açıklayın..."
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="rounded-xl"
                />
            </div>
            <div className="grid gap-2">
                <Label className="text-sm font-medium">Rozet Rengi</Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {COLOR_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            type="button"
                            className={cn(
                                "relative rounded-xl p-2.5 border-2 transition-all text-center",
                                newRoleBadgeColor === preset.value
                                    ? "border-primary ring-1 ring-primary/30 bg-muted"
                                    : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
                            )}
                            onClick={() => setNewRoleBadgeColor(preset.value)}
                        >
                            <span className={cn("inline-block px-2.5 py-1 rounded-md text-[10px] font-medium", preset.value)}>
                                {preset.name}
                            </span>
                            {newRoleBadgeColor === preset.value && (
                                <div className="absolute top-1 right-1">
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-2xl shadow-purple-900/20">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
                            <Shield className="h-7 w-7 text-purple-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rol Yönetimi</h1>
                            <p className="text-white/60 text-sm mt-1">
                                Roller ve izinleri yönetin
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={exportRolePermissions}
                            className="gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-0 text-white rounded-xl"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>

                        {canManageRoles && (
                            <Button
                                onClick={() => {
                                    resetForm()
                                    setIsCreateDialogOpen(true)
                                }}
                                className="gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border-0 text-white rounded-xl"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Yeni Rol</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mini stats */}
                <div className="relative mt-5 grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-3 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                        <strong className="text-white/80">{stats.totalRoles}</strong> rol
                    </span>
                    <span className="hidden sm:block w-px h-4 bg-white/15" />
                    <span className="flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 flex-shrink-0" />
                        <strong className="text-white/80">{stats.totalPermissions}</strong> izin
                    </span>
                    <span className="hidden sm:block w-px h-4 bg-white/15" />
                    <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 flex-shrink-0" />
                        <strong className="text-white/80">{stats.totalMappings}</strong> eşleme
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Rol ara (isim, anahtar veya açıklama)..."
                    className="pl-10 h-11 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Role Cards */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredRoles.length > 0 ? (
                        filteredRoles.map((role, index) => {
                            const perms = getRolePermissions(role.key)
                            const levelInfo = getRoleLevelInfo(role.level)
                            const isExpanded = expandedRole === role.key

                            return (
                                <motion.div
                                    key={role.key}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: Math.min(index * 0.03, 0.2) }}
                                >
                                    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden rounded-2xl group">
                                        {/* Top color bar */}
                                        <div className={cn("h-[2px] w-full bg-gradient-to-r", levelInfo.color)} />

                                        <CardContent className="p-0">
                                            {/* Role header */}
                                            <div
                                                className="p-4 sm:p-5 cursor-pointer"
                                                onClick={() => setExpandedRole(isExpanded ? null : role.key)}
                                            >
                                                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                                    {/* Level indicator */}
                                                    <div className={cn(
                                                        "h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0",
                                                        levelInfo.color
                                                    )}>
                                                        {role.level}
                                                    </div>

                                                    {/* Role info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                                                                {role.label}
                                                            </h3>
                                                            <Badge className={cn("text-[10px] rounded-md", role.badge_color)}>
                                                                {role.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <code className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                                                {role.key}
                                                            </code>
                                                            {role.description && (
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                                                                    · {role.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {role.description && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:hidden">
                                                                {role.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Right side */}
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className={cn(
                                                            "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                                                            levelInfo.bg, levelInfo.text
                                                        )}>
                                                            <Key className="h-3 w-3" />
                                                            {perms.length} izin
                                                        </div>

                                                        {/* Mobile perm count */}
                                                        <Badge variant="secondary" className="sm:hidden text-[10px] rounded-md">
                                                            {perms.length} izin
                                                        </Badge>

                                                        {/* Actions */}
                                                        {canManageRoles && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                                                    <DropdownMenuItem onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        startEditRole(role)
                                                                    }}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Düzenle
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 focus:text-red-600"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            // Trigger the alert dialog through state
                                                                            const dialog = document.getElementById(`delete-trigger-${role.key}`)
                                                                            dialog?.click()
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Sil
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}

                                                        {/* Hidden alert dialog trigger */}
                                                        {canManageRoles && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button id={`delete-trigger-${role.key}`} className="hidden" />
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="rounded-2xl">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="flex items-center gap-2">
                                                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                                                            Rolü Sil
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            <strong>{role.label}</strong> rolünü silmek istediğinize emin misiniz?
                                                                            Bu işlem geri alınamaz ve bu role sahip kullanıcıların yetkileri etkilenecektir.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteRole(role.key)}
                                                                            className="bg-red-500 hover:bg-red-600 rounded-xl"
                                                                        >
                                                                            Sil
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}

                                                        {/* Expand arrow */}
                                                        <div className={cn(
                                                            "h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200",
                                                            isExpanded
                                                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
                                                                : "text-slate-400"
                                                        )}>
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded permissions panel */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-slate-100 dark:border-slate-800">
                                                            {/* Permission search */}
                                                            <div className="px-4 sm:px-5 pt-4 pb-2">
                                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                                        <Lock className="h-4 w-4" />
                                                                        İzinler
                                                                        <Badge variant="secondary" className="text-[10px] rounded-md">
                                                                            {perms.length} / {initialPermissions.length}
                                                                        </Badge>
                                                                    </h4>
                                                                    {canManagePermissions && (
                                                                        <div className="relative flex-1 max-w-xs">
                                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                                            <Input
                                                                                placeholder="İzin ara..."
                                                                                className="pl-8 h-8 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/50 border-0"
                                                                                value={permSearchQuery}
                                                                                onChange={(e) => setPermSearchQuery(e.target.value)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Grouped permissions */}
                                                            <div className="px-4 sm:px-5 pb-4 space-y-3">
                                                                {Object.entries(groupedPermissions).map(([groupKey, groupPerms]) => {
                                                                    const filteredGroupPerms = permSearchQuery
                                                                        ? groupPerms.filter(p =>
                                                                            p.key.toLowerCase().includes(permSearchQuery.toLowerCase()) ||
                                                                            (p.description || '').toLowerCase().includes(permSearchQuery.toLowerCase())
                                                                        )
                                                                        : groupPerms
                                                                    if (filteredGroupPerms.length === 0) return null

                                                                    const activeInGroup = filteredGroupPerms.filter(p => perms.includes(p.key)).length
                                                                    const allActive = activeInGroup === filteredGroupPerms.length

                                                                    return (
                                                                        <div key={groupKey} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                                                            {/* Group header */}
                                                                            <div className={cn(
                                                                                "px-3 py-2 flex items-center justify-between",
                                                                                allActive
                                                                                    ? "bg-emerald-50/80 dark:bg-emerald-950/20"
                                                                                    : activeInGroup > 0
                                                                                        ? "bg-amber-50/50 dark:bg-amber-950/10"
                                                                                        : "bg-slate-50 dark:bg-slate-800/30"
                                                                            )}>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                                                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                                                        {getGroupLabel(groupKey)}
                                                                                    </span>
                                                                                </div>
                                                                                <span className={cn(
                                                                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                                                                                    allActive
                                                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                                                        : activeInGroup > 0
                                                                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                                                            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                                                                )}>
                                                                                    {activeInGroup}/{filteredGroupPerms.length}
                                                                                </span>
                                                                            </div>

                                                                            {/* Group permissions */}
                                                                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                                                {filteredGroupPerms.map((perm) => {
                                                                                    const hasPerm = perms.includes(perm.key)
                                                                                    // Extract the last part of the key for display
                                                                                    const shortKey = perm.key.split('.').slice(-1)[0]

                                                                                    return (
                                                                                        <div
                                                                                            key={perm.key}
                                                                                            className={cn(
                                                                                                "flex items-center gap-3 px-3 py-2 transition-colors",
                                                                                                hasPerm
                                                                                                    ? "bg-emerald-50/40 dark:bg-emerald-950/10"
                                                                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/20"
                                                                                            )}
                                                                                        >
                                                                                            {canManagePermissions ? (
                                                                                                <Checkbox
                                                                                                    id={`${role.key}-${perm.key}`}
                                                                                                    checked={hasPerm}
                                                                                                    onCheckedChange={() => handleTogglePermission(role.key, perm.key, hasPerm)}
                                                                                                    className="flex-shrink-0"
                                                                                                />
                                                                                            ) : (
                                                                                                hasPerm ? (
                                                                                                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                                                                ) : (
                                                                                                    <X className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                                                                                )
                                                                                            )}
                                                                                            <label
                                                                                                htmlFor={canManagePermissions ? `${role.key}-${perm.key}` : undefined}
                                                                                                className="flex-1 min-w-0 cursor-pointer"
                                                                                            >
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <span className={cn(
                                                                                                        "text-xs font-medium",
                                                                                                        hasPerm
                                                                                                            ? "text-emerald-700 dark:text-emerald-300"
                                                                                                            : "text-slate-600 dark:text-slate-400"
                                                                                                    )}>
                                                                                                        {shortKey}
                                                                                                    </span>
                                                                                                    <code className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                                                                                                        {perm.key}
                                                                                                    </code>
                                                                                                </div>
                                                                                                {perm.description && (
                                                                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                                                                        {perm.description}
                                                                                                    </p>
                                                                                                )}
                                                                                            </label>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl rounded-2xl">
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6">
                                        <Shield className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                                        Rol bulunamadı
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Arama kriterlerinize uygun rol yok.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Permission Reference (collapsible) */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                <button
                    onClick={() => setShowPermRef(!showPermRef)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">İzin Referansı</h3>
                            <p className="text-[11px] text-slate-500">{initialPermissions.length} izin tanımlı</p>
                        </div>
                    </div>
                    <ChevronDown className={cn(
                        "h-4 w-4 text-slate-400 transition-transform duration-200",
                        showPermRef && "rotate-180"
                    )} />
                </button>

                <AnimatePresence>
                    {showPermRef && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {initialPermissions.map((perm) => {
                                        const usedByCount = rolePermissions.filter(rp => rp.perm_key === perm.key).length

                                        return (
                                            <div
                                                key={perm.key}
                                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <code className="text-[11px] font-mono text-purple-600 dark:text-purple-400 break-all leading-relaxed">
                                                        {perm.key}
                                                    </code>
                                                    <Badge variant="secondary" className="shrink-0 text-[10px] rounded-md">
                                                        {usedByCount}
                                                    </Badge>
                                                </div>
                                                {perm.description && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                                        {perm.description}
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Role Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-purple-600" />
                            </div>
                            Yeni Rol Oluştur
                        </DialogTitle>
                        <DialogDescription>
                            Sisteme yeni bir rol ekleyin. Rol anahtarı benzersiz olmalıdır.
                        </DialogDescription>
                    </DialogHeader>
                    <RoleFormContent isEdit={false} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl">
                            İptal
                        </Button>
                        <Button onClick={handleCreateRole} disabled={isLoading} className="rounded-xl">
                            {isLoading ? "Oluşturuluyor..." : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Edit className="h-4 w-4 text-blue-600" />
                            </div>
                            Rol Düzenle
                        </DialogTitle>
                        <DialogDescription>
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                {editingRole?.key}
                            </code> rolünü düzenliyorsunuz.
                        </DialogDescription>
                    </DialogHeader>
                    <RoleFormContent isEdit={true} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingRole(null)} className="rounded-xl">
                            İptal
                        </Button>
                        <Button onClick={handleUpdateRole} disabled={isLoading} className="rounded-xl">
                            {isLoading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
