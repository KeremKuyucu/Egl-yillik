"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Loader2, Shield, Trash2, Edit, Database, Filter, X, UserCog } from "lucide-react"
import { AVAILABLE_ROLES, ROLE_LEVELS, type RealRoleKey } from "@/lib/constants"
import { updateUserRole } from "@/app/actions/admin"
import { deleteTextAction } from "@/app/actions/texts"
import { EditUserForm } from "./edit-user-form"
import { toast } from "sonner"

// --------------------------------------------------------
// 7. USER FILTER BAR (Sınıf ve Rol Filtreleme)
// --------------------------------------------------------
interface UserFilterBarProps {
    classes: string[]
}

export function UserFilterBar({ classes }: UserFilterBarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentClass = searchParams.get("class") || "all"
    const currentRole = searchParams.get("role") || "all"

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }

        router.push(`?${params.toString()}`)
    }

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("class")
        params.delete("role")
        router.push(`?${params.toString()}`)
    }

    const hasFilters = currentClass !== "all" || currentRole !== "all"

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select
                value={currentClass}
                onValueChange={(val: string) => updateFilter("class", val)}
            >
                <SelectTrigger className="w-[110px] h-9 text-xs">
                    <div className="flex items-center gap-2 truncate">
                        <Filter className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{currentClass === "all" ? "Tüm Sınıflar" : currentClass}</span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Sınıflar</SelectItem>
                    {classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={currentRole}
                onValueChange={(val: string) => updateFilter("role", val)}
            >
                <SelectTrigger className="w-[110px] h-9 text-xs">
                    <div className="flex items-center gap-2 truncate">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">
                            {currentRole === "all"
                                ? "Tüm Roller"
                                : currentRole === "admin" ? "Yöneticiler" : "Kullanıcılar"
                            }
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Roller</SelectItem>
                    <SelectItem value="admin">Yöneticiler</SelectItem>
                    <SelectItem value="user">Kullanıcılar</SelectItem>
                </SelectContent>
            </Select>

            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    <X className="w-3 h-3 mr-1" />
                    Temizle
                </Button>
            )}
        </div>
    )
}

// --------------------------------------------------------
// 1. ROLE SELECTOR (Kullanıcı Rolü Değiştirme)
// --------------------------------------------------------

interface RoleSelectorProps {
    userId: string
    currentRoleKey: string
    maxLevel: number // Mevcut kullanıcının max seviyesi (filtreleme için)
}

export function RoleSelector({ userId, currentRoleKey, maxLevel }: RoleSelectorProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedRoleKey, setSelectedRoleKey] = useState<string>(currentRoleKey)
    const router = useRouter()

    // Kullanıcının atayabileceği roller (kendi seviyesinden düşük olanlar)
    const availableRoles = AVAILABLE_ROLES.map((role) => {
        const roleLevel = ROLE_LEVELS[role.value as RealRoleKey] || 0
        return {
            value: role.value,
            label: role.label,
            disabled: roleLevel >= maxLevel
        }
    })

    const handleRoleChange = async () => {
        startTransition(async () => {
            const result = await updateUserRole(userId, selectedRoleKey)

            if (result.success) {
                toast.success("Kullanıcı rolü güncellendi")
                router.refresh()
            } else {
                toast.error(result.error || "Hata oluştu")
                setSelectedRoleKey(currentRoleKey)
            }
        })
    }

    const hasChanged = selectedRoleKey !== currentRoleKey

    // Seçili rolün label'ını bul
    const selectedRoleLabel = AVAILABLE_ROLES.find(r => r.value === selectedRoleKey)?.label || selectedRoleKey

    return (
        <div className="flex items-center gap-2">
            <Select
                value={selectedRoleKey}
                onValueChange={setSelectedRoleKey}
                disabled={isPending}
            >
                <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {availableRoles.map((role) => (
                        <SelectItem
                            key={role.value}
                            value={role.value}
                            disabled={role.disabled}
                        >
                            {role.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {hasChanged && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="default"
                            className="h-8 text-xs px-2"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3 mr-1" />}
                            Kaydet
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Yetki Değişikliği</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu kullanıcının yetkisini <strong>{selectedRoleLabel}</strong> olarak güncellemek istiyor musunuz?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedRoleKey(currentRoleKey)}>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRoleChange}>Onayla</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    )
}

// --------------------------------------------------------
// 2. EDIT USER BUTTON (Kullanıcı Profil Düzenleme)
// --------------------------------------------------------
interface UserProfile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    role_level: number
    [key: string]: any
}

interface EditUserButtonProps {
    user: UserProfile
}

export function EditUserButton({ user }: EditUserButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Düzenle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Profil Düzenle</DialogTitle>
                    <DialogDescription>
                        {user.first_name} {user.last_name} kullanıcısının bilgilerini güncelleyin.
                    </DialogDescription>
                </DialogHeader>

                <EditUserForm
                    user={user}
                    onSuccess={() => setOpen(false)}
                />

            </DialogContent>
        </Dialog>
    )
}

// --------------------------------------------------------
// 3. SEARCH INPUT (Arama Kutusu)
// --------------------------------------------------------
export function SearchInput() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchValue, setSearchValue] = useState(searchParams.get("q") || "")

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (searchValue) params.set("q", searchValue)
        router.push(`?${params.toString()}`)
    }

    return (
        <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="İsim veya e-posta ara..."
                    value={searchValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                    className="pl-9 w-[200px] sm:w-[250px] bg-background"
                />
            </div>
            <Button type="submit" variant="secondary" size="sm">Ara</Button>
        </form>
    )
}

// --------------------------------------------------------
// 4. DELETE BUTTON (Silme Butonu)
// --------------------------------------------------------
export function DeleteTextButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm("Bu içeriği silmek istediğinize emin misiniz?")) return
        setIsDeleting(true)

        try {
            const result = await deleteTextAction(id)
            if (result.error) throw new Error(result.error)
            toast.success("Anı silindi")
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || "Silme işlemi başarısız")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
        >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
