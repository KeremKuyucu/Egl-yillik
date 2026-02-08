"use client"

import { useState, useMemo, Fragment } from "react"
import { PERMS } from "@/lib/auth/permission-constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Shield,
    Crown,
    Key,
    Plus,
    Trash2,
    Edit,
    Search,
    ChevronDown,
    ChevronRight,
    Lock,
    Unlock,
    AlertCircle,
    Check,
    X,
    Download
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
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

// Rol seviyesine göre renk
function getRoleLevelColor(level: number): string {
    if (level >= 100) return "from-yellow-500 to-amber-600" // Owner
    if (level >= 90) return "from-red-500 to-rose-600" // System Admin
    if (level >= 80) return "from-purple-500 to-violet-600" // Super Admin
    if (level >= 50) return "from-blue-500 to-indigo-600" // Admin
    return "from-slate-400 to-slate-500" // User
}

const COLOR_PRESETS = [
    // ── Ultra / Legendary (çok özel roller)
    {
        name: "Efsane (Kızıl Alev)",
        value: "bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 text-white border-0 shadow-xl shadow-red-600/50 ring-2 ring-red-500/40 hover:brightness-110"
    },
    {
        name: "Efsane (Mor Kozmik)",
        value: "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white border-0 shadow-xl shadow-purple-600/50 ring-2 ring-purple-500/40 hover:brightness-110"
    },
    {
        name: "Efsane (Altın Işık)",
        value: "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black border-0 shadow-xl shadow-amber-500/50 ring-2 ring-yellow-400/50 hover:brightness-110"
    },

    // ── Neon Glow
    {
        name: "Neon Pembe Glow",
        value: "bg-pink-500 text-white border-0 shadow-[0_0_20px_rgba(236,72,153,0.8)] hover:shadow-[0_0_28px_rgba(236,72,153,1)]"
    },
    {
        name: "Neon Mor Glow",
        value: "bg-purple-600 text-white border-0 shadow-[0_0_20px_rgba(147,51,234,0.8)] hover:shadow-[0_0_28px_rgba(147,51,234,1)]"
    },
    {
        name: "Neon Mavi Glow",
        value: "bg-blue-600 text-white border-0 shadow-[0_0_20px_rgba(37,99,235,0.8)] hover:shadow-[0_0_28px_rgba(37,99,235,1)]"
    },

    // ── Cyber / Hologram
    {
        name: "Hologram",
        value: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white border border-white/30 shadow-xl backdrop-blur-sm hover:brightness-110"
    },
    {
        name: "Cyber Pink",
        value: "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white border border-white/20 shadow-xl hover:brightness-110"
    },

    // ── Dark Magic
    {
        name: "Karanlık Büyü",
        value: "bg-gradient-to-r from-neutral-900 via-purple-900 to-black text-purple-200 border border-purple-500/40 shadow-2xl shadow-purple-900/70"
    },
];



export function RolesManagementClient({
    initialRoles,
    initialPermissions,
    initialRolePermissions,
    currentUserPermissions
}: RolesManagementClientProps) {
    const [roles, setRoles] = useState<Role[]>(initialRoles)
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions)
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form states
    const [newRoleKey, setNewRoleKey] = useState("")
    const [newRoleLabel, setNewRoleLabel] = useState("")
    const [newRoleLevel, setNewRoleLevel] = useState("")
    const [newRoleDescription, setNewRoleDescription] = useState("")
    const [newRoleBadgeColor, setNewRoleBadgeColor] = useState(COLOR_PRESETS[0].value)

    // Check permissions
    const canManageRoles = currentUserPermissions.includes(PERMS.ADMIN_ROLES_UPDATE)
    const canManagePermissions = currentUserPermissions.includes(PERMS.ADMIN_ROLE_PERMISSIONS_UPDATE)

    // Filtered roles based on search
    const filteredRoles = useMemo(() => {
        if (!searchQuery) return roles
        const query = searchQuery.toLowerCase()
        return roles.filter(role =>
            role.key.toLowerCase().includes(query) ||
            role.label.toLowerCase().includes(query)
        )
    }, [roles, searchQuery])

    // Get permissions for a role
    const getRolePermissions = (roleKey: string): string[] => {
        return rolePermissions
            .filter(rp => rp.role_key === roleKey)
            .map(rp => rp.perm_key)
    }

    // Toggle role expansion
    const toggleRoleExpansion = (roleKey: string) => {
        const newExpanded = new Set(expandedRoles)
        if (newExpanded.has(roleKey)) {
            newExpanded.delete(roleKey)
        } else {
            newExpanded.add(roleKey)
        }
        setExpandedRoles(newExpanded)
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
                setNewRoleKey("")
                setNewRoleLabel("")
                setNewRoleLevel("")
                setNewRoleDescription("")
                setNewRoleBadgeColor(COLOR_PRESETS[0].value)
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
                setNewRoleLabel("")
                setNewRoleLevel("")
                setNewRoleDescription("")
                setNewRoleBadgeColor(COLOR_PRESETS[0].value)
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
        setIsLoading(true)
        try {
            let result
            if (hasPermission) {
                result = await adminRemoveRolePermission(roleKey, permKey)
                if (result.success) {
                    setRolePermissions(prev => prev.filter(
                        rp => !(rp.role_key === roleKey && rp.perm_key === permKey)
                    ))
                }
            } else {
                result = await adminAddRolePermission(roleKey, permKey)
                if (result.success) {
                    setRolePermissions(prev => [...prev, { role_key: roleKey, perm_key: permKey }])
                }
            }

            if (result.success) {
                toast.success(hasPermission ? "İzin kaldırıldı" : "İzin eklendi")
            } else {
                toast.error(result.error || "İşlem başarısız")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsLoading(false)
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

    // Stats
    const stats = {
        totalRoles: roles.length,
        totalPermissions: initialPermissions.length,
        totalMappings: rolePermissions.length
    }

    // Export role-permission mappings as CSV
    const exportRolePermissions = () => {
        // Build CSV content
        const lines: string[] = []

        // Header
        lines.push('Rol Key,Rol Etiket,Seviye,İzin Key,İzin Açıklama')

        // For each role, list all its permissions
        roles.forEach(role => {
            const perms = getRolePermissions(role.key)
            if (perms.length === 0) {
                // Role has no permissions
                lines.push(`"${role.key}","${role.label}",${role.level},"(yok)","(yok)"`)
            } else {
                perms.forEach(permKey => {
                    const perm = initialPermissions.find(p => p.key === permKey)
                    const desc = perm?.description || '-'
                    lines.push(`"${role.key}","${role.label}",${role.level},"${permKey}","${desc}"`)
                })
            }
        })

        const csvContent = lines.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                Rol Yönetimi
                            </h1>
                            <Badge variant="outline" className="gap-1">
                                <Key className="h-3 w-3" />
                                {stats.totalRoles} rol
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Lock className="h-4 w-4" />
                            Roller ve izinleri yönetin
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={exportRolePermissions}>
                        <Download className="h-4 w-4" />
                        Export
                    </Button>

                    {canManageRoles && (
                        <>
                            <Button
                                className="gap-2"
                                onClick={() => {
                                    setNewRoleKey("")
                                    setNewRoleLabel("")
                                    setNewRoleLevel("")
                                    setNewRoleDescription("")
                                    setNewRoleBadgeColor(COLOR_PRESETS[0].value)
                                    setIsCreateDialogOpen(true)
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                Yeni Rol
                            </Button>

                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Yeni Rol Oluştur</DialogTitle>
                                        <DialogDescription>
                                            Sisteme yeni bir rol ekleyin. Rol anahtarı benzersiz olmalıdır.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="roleKey">Rol Anahtarı</Label>
                                            <Input
                                                id="roleKey"
                                                placeholder="ornek_rol"
                                                value={newRoleKey}
                                                onChange={(e) => setNewRoleKey(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Küçük harf ve alt çizgi kullanın (örn: content_editor)
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="roleLabel">Rol Etiketi</Label>
                                            <Input
                                                id="roleLabel"
                                                placeholder="Örnek Rol"
                                                value={newRoleLabel}
                                                onChange={(e) => setNewRoleLabel(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="roleLevel">Seviye</Label>
                                            <Input
                                                id="roleLevel"
                                                type="number"
                                                placeholder="10"
                                                value={newRoleLevel}
                                                onChange={(e) => setNewRoleLevel(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Yüksek seviye = Daha fazla yetki. Kendi seviyenizden düşük olmalı.
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="roleDescription">Açıklama</Label>
                                            <Input
                                                id="roleDescription"
                                                placeholder="Rol açıklaması"
                                                value={newRoleDescription}
                                                onChange={(e) => setNewRoleDescription(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Renk Stili</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {COLOR_PRESETS.map((preset) => (
                                                    <div
                                                        key={preset.name}
                                                        className={cn(
                                                            "cursor-pointer rounded-md p-2 border-2 text-xs flex items-center justify-between transition-all",
                                                            newRoleBadgeColor === preset.value
                                                                ? "border-primary bg-muted"
                                                                : "border-transparent hover:bg-muted/50"
                                                        )}
                                                        onClick={() => setNewRoleBadgeColor(preset.value)}
                                                    >
                                                        <span className={cn("px-2 py-0.5 rounded text-[10px]", preset.value)}>
                                                            {preset.name}
                                                        </span>
                                                        {newRoleBadgeColor === preset.value && (
                                                            <Check className="h-3 w-3 text-primary" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                            İptal
                                        </Button>
                                        <Button onClick={handleCreateRole} disabled={isLoading}>
                                            {isLoading ? "Oluşturuluyor..." : "Oluştur"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Rol</CardTitle>
                        <Shield className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.totalRoles}</div>
                        <p className="text-xs text-muted-foreground">Tanımlı roller</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Toplam İzin</CardTitle>
                        <Key className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{stats.totalPermissions}</div>
                        <p className="text-xs text-muted-foreground">Sistem izinleri</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">İzin Eşlemeleri</CardTitle>
                        <Lock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalMappings}</div>
                        <p className="text-xs text-muted-foreground">Rol-izin bağlantıları</p>
                    </CardContent>
                </Card>
            </div>

            {/* Roles Table */}
            <Card className="shadow-xl border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Crown className="h-5 w-5 text-yellow-500" />
                                Roller
                            </CardTitle>
                            <CardDescription>
                                Sisteme tanımlı rolleri görüntüleyin ve düzenleyin.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rol ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>

                    {/* Edit Role Dialog */}
                    <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Rol Düzenle</DialogTitle>
                                <DialogDescription>
                                    {editingRole?.key} rolünü düzenliyorsunuz.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="editRoleLabel">Rol Etiketi</Label>
                                    <Input
                                        id="editRoleLabel"
                                        value={newRoleLabel}
                                        onChange={(e) => setNewRoleLabel(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editRoleLevel">Seviye</Label>
                                    <Input
                                        id="editRoleLevel"
                                        type="number"
                                        value={newRoleLevel}
                                        onChange={(e) => setNewRoleLevel(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editRoleDescription">Açıklama</Label>
                                    <Input
                                        id="editRoleDescription"
                                        placeholder="Rol açıklaması"
                                        value={newRoleDescription}
                                        onChange={(e) => setNewRoleDescription(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Renk Stili</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {COLOR_PRESETS.map((preset) => (
                                            <div
                                                key={preset.name}
                                                className={cn(
                                                    "cursor-pointer rounded-md p-2 border-2 text-xs flex items-center justify-between transition-all",
                                                    newRoleBadgeColor === preset.value
                                                        ? "border-primary bg-muted"
                                                        : "border-transparent hover:bg-muted/50"
                                                )}
                                                onClick={() => setNewRoleBadgeColor(preset.value)}
                                            >
                                                <span className={cn("px-2 py-0.5 rounded text-[10px]", preset.value)}>
                                                    {preset.name}
                                                </span>
                                                {newRoleBadgeColor === preset.value && (
                                                    <Check className="h-3 w-3 text-primary" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingRole(null)}>
                                    İptal
                                </Button>
                                <Button onClick={handleUpdateRole} disabled={isLoading}>
                                    {isLoading ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="rounded-lg border bg-card overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Anahtar</TableHead>
                                    <TableHead>Etiket</TableHead>
                                    <TableHead>Seviye</TableHead>
                                    <TableHead>İzinler</TableHead>
                                    {canManageRoles && <TableHead className="text-right">İşlemler</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRoles.length > 0 ? (
                                    filteredRoles.map((role) => {
                                        const perms = getRolePermissions(role.key)
                                        const isExpanded = expandedRoles.has(role.key)

                                        return (
                                            <Fragment key={role.key}>
                                                <TableRow className="hover:bg-muted/50 transition-colors">
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => toggleRoleExpansion(role.key)}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full bg-gradient-to-r",
                                                                getRoleLevelColor(role.level)
                                                            )} />
                                                            <code className="text-sm bg-muted px-2 py-0.5 rounded">
                                                                {role.key}
                                                            </code>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{role.label}</TableCell>
                                                    <TableCell>
                                                        <Badge className={cn("font-mono", role.badge_color)}>
                                                            {role.level}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {perms.length} izin
                                                        </Badge>
                                                    </TableCell>
                                                    {canManageRoles && (
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => startEditRole(role)}
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Düzenle</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>

                                                                {canManageRoles && (
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Rolü Sil</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    <strong>{role.label}</strong> rolünü silmek istediğinize emin misiniz?
                                                                                    Bu işlem geri alınamaz ve bu role sahip kullanıcıların yetkileri etkilenecektir.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDeleteRole(role.key)}
                                                                                    className="bg-red-500 hover:bg-red-600"
                                                                                >
                                                                                    Sil
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>

                                                {/* Expanded permissions row */}
                                                {isExpanded && (
                                                    <TableRow key={`${role.key}-perms`}>
                                                        <TableCell colSpan={canManageRoles ? 6 : 5} className="bg-muted/30 p-4">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                                    <Key className="h-4 w-4" />
                                                                    {role.label} İzinleri
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                    {initialPermissions.map((perm) => {
                                                                        const hasThisPerm = perms.includes(perm.key)
                                                                        return (
                                                                            <div
                                                                                key={perm.key}
                                                                                className={cn(
                                                                                    "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                                                                                    hasThisPerm
                                                                                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                                                                                        : "bg-background border-muted"
                                                                                )}
                                                                            >
                                                                                {canManagePermissions ? (
                                                                                    <Checkbox
                                                                                        id={`${role.key}-${perm.key}`}
                                                                                        checked={hasThisPerm}
                                                                                        disabled={isLoading}
                                                                                        onCheckedChange={() => handleTogglePermission(role.key, perm.key, hasThisPerm)}
                                                                                    />
                                                                                ) : (
                                                                                    hasThisPerm ? (
                                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                                    ) : (
                                                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                                                    )
                                                                                )}
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <label
                                                                                                htmlFor={`${role.key}-${perm.key}`}
                                                                                                className={cn(
                                                                                                    "text-xs font-mono cursor-pointer truncate flex-1",
                                                                                                    hasThisPerm ? "text-green-700 dark:text-green-300" : "text-muted-foreground"
                                                                                                )}
                                                                                            >
                                                                                                {perm.key}
                                                                                            </label>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>
                                                                                            <p>{perm.description || perm.key}</p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={canManageRoles ? 6 : 5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                                <h3 className="font-semibold text-lg mb-2">Rol bulunamadı</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Arama kriterlerinize uygun rol yok.
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

            {/* Permissions Reference */}
            <Card className="shadow-lg border-2">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Unlock className="h-5 w-5 text-green-500" />
                        İzin Referansı
                    </CardTitle>
                    <CardDescription>
                        Sistemdeki tüm izinlerin listesi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {initialPermissions.map((perm) => {
                            const usedByRoles = rolePermissions
                                .filter(rp => rp.perm_key === perm.key)
                                .map(rp => rp.role_key)

                            return (
                                <div
                                    key={perm.key}
                                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <code className="text-xs font-mono text-primary break-all">
                                            {perm.key}
                                        </code>
                                        <Badge variant="secondary" className="shrink-0">
                                            {usedByRoles.length} rol
                                        </Badge>
                                    </div>
                                    {perm.description && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {perm.description}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>

    )
}
