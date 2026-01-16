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
import { getLevelInfo, AVAILABLE_LEVELS } from "@/lib/constants"
import { updateUserLevel } from "@/lib/actions"
import { deleteTextAction } from "@/app/actions"
import { EditUserForm } from "@/components/edit-user-form"
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
                onValueChange={(val) => updateFilter("class", val)}
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
                onValueChange={(val) => updateFilter("role", val)}
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
// 1. LEVEL SELECTOR (Kullanıcı Seviyesi Değiştirme)
// --------------------------------------------------------
function getRoleName(level: number): string {
    return getLevelInfo(level).label;
}

interface LevelSelectorProps {
    userId: string
    currentLevel: number
    maxLevel: number
}

export function LevelSelector({ userId, currentLevel, maxLevel }: LevelSelectorProps) {
    const [isPending, startTransition] = useTransition()
    const [selectedLevel, setSelectedLevel] = useState<string>(currentLevel.toString())
    const router = useRouter()

    const availableLevels = AVAILABLE_LEVELS.map(level => ({
        ...level,
        disabled: level.value >= maxLevel
    }))

    const handleLevelChange = async () => {
        startTransition(async () => {
            const newLevel = parseInt(selectedLevel)
            const result = await updateUserLevel(userId, newLevel)

            if (result.success) {
                toast.success("Kullanıcı yetkisi güncellendi")
                router.refresh()
            } else {
                toast.error(result.error || "Hata oluştu")
                setSelectedLevel(currentLevel.toString())
            }
        })
    }

    const hasChanged = parseInt(selectedLevel) !== currentLevel

    return (
        <div className="flex items-center gap-2">
            <Select
                value={selectedLevel}
                onValueChange={setSelectedLevel}
                disabled={isPending}
            >
                <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {availableLevels.map((level) => (
                        <SelectItem
                            key={level.value}
                            value={level.value.toString()}
                            disabled={level.disabled}
                        >
                            {level.label}
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
                                Bu kullanıcının yetkisini <strong>{getRoleName(parseInt(selectedLevel))}</strong> olarak güncellemek istiyor musunuz?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedLevel(currentLevel.toString())}>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLevelChange}>Onayla</AlertDialogAction>
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
    level: number
    [key: string]: any
}

interface EditUserButtonProps {
    user: UserProfile
    currentUserLevel: number
}

export function EditUserButton({ user, currentUserLevel }: EditUserButtonProps) {
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
                    onChange={(e) => setSearchValue(e.target.value)}
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

// --------------------------------------------------------
// 5. METADATA BUTTON (Kullanıcı Meta Verisi Görüntüleme)
// --------------------------------------------------------
interface MetadataButtonProps {
    userId: string
    profileData?: any // Yeni: Profil verilerini de alıyoruz
}

export function MetadataButton({ userId, profileData }: MetadataButtonProps) {
    const [open, setOpen] = useState(false)
    const [authMetadata, setAuthMetadata] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Sadece Auth verilerini (email, loglar vs.) çekiyoruz çünkü profil verisi zaten elimizde
    const fetchAuthMetadata = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/admin/user-metadata?userId=${userId}`)
            const data = await response.json()

            if (data.error) {
                setError(data.error)
            } else {
                setAuthMetadata(data)
            }
        } catch (e) {
            setError("Auth verisi alınamadı")
        } finally {
            setLoading(false)
        }
    }

    const handleOpen = () => {
        setOpen(true)
        if (!authMetadata) {
            fetchAuthMetadata()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpen}
                    className="h-8 text-xs px-2 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30"
                >
                    <Database className="h-3 w-3 mr-1" />
                    Meta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-purple-600" />
                        Gelişmiş Veri Görüntüleyici
                    </DialogTitle>
                    <DialogDescription>
                        Kullanıcıya ait veritabanı (Profiles) ve kimlik doğrulama (Auth) verileri.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* BÖLÜM 1: PROFIL VERİLERİ (Public) */}
                    {profileData && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                <UserCog className="h-4 w-4 text-pink-500" />
                                Profil Verileri (public.profiles)
                            </h3>
                            <div className="p-3 rounded-lg bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30">
                                <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(profileData, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* BÖLÜM 2: AUTH VERİLERİ (Private/Admin) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                <Shield className="h-4 w-4 text-purple-500" />
                                Auth Verileri (auth.users)
                            </h3>
                            {loading && <Loader2 className="h-3 w-3 animate-spin text-purple-500" />}
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
                                {error}
                            </div>
                        )}

                        {!loading && authMetadata && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Email */}
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-medium text-slate-500 mb-0.5">Email</p>
                                        <p className="text-xs text-slate-900 dark:text-slate-100 break-all">{authMetadata.email || "—"}</p>
                                    </div>
                                    {/* Last Sign In */}
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-medium text-slate-500 mb-0.5">Son Oturum</p>
                                        <p className="text-xs text-slate-900 dark:text-slate-100">
                                            {authMetadata.last_sign_in_at ? new Date(authMetadata.last_sign_in_at).toLocaleString('tr-TR') : "—"}
                                        </p>
                                    </div>
                                    {/* Created At */}
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-medium text-slate-500 mb-0.5">Oluşturulma</p>
                                        <p className="text-xs text-slate-900 dark:text-slate-100">
                                            {authMetadata.created_at ? new Date(authMetadata.created_at).toLocaleString('tr-TR') : "—"}
                                        </p>
                                    </div>
                                    {/* Providers */}
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[10px] font-medium text-slate-500 mb-0.5">Sağlayıcılar</p>
                                        <p className="text-xs text-slate-900 dark:text-slate-100">
                                            {authMetadata.app_metadata?.providers?.join(", ") || "email"}
                                        </p>
                                    </div>
                                </div>

                                <details className="group">
                                    <summary className="cursor-pointer text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors py-1">
                                        Ham Auth JSON (Genişlet)
                                    </summary>
                                    <div className="mt-2 p-3 rounded-lg bg-slate-900 dark:bg-black border border-slate-700">
                                        <pre className="text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(authMetadata, null, 2)}
                                        </pre>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Kapat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

