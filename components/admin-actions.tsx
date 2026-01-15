"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Search, Loader2, Shield, Trash2, Edit, Database } from "lucide-react"
import { ROLES, getLevelInfo, ROLE_DETAILS, AVAILABLE_LEVELS } from "@/lib/constants"
import { updateUserLevel, updateUserProfile } from "@/lib/actions"
import { deleteTextAction } from "@/app/actions"
import { EditUserForm } from "@/components/edit-user-form"
// DÜZELTME: sonner'dan direkt toast import edilir
import { toast } from "sonner"

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
}

interface EditUserButtonProps {
    user: UserProfile
    currentUserLevel: number
}

export function EditUserButton({ user, currentUserLevel }: EditUserButtonProps) {
    const [open, setOpen] = useState(false)

    // Form işlemleri artık EditUserForm içinde yapılıyor.
    // Biz sadece Modal'ı açıp kapatıyoruz.
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

                {/* Form bileşenini buraya koyuyoruz */}
                <EditUserForm
                    user={user}
                    onSuccess={() => setOpen(false)} // İşlem bitince modal kapansın
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
}

export function MetadataButton({ userId }: MetadataButtonProps) {
    const [open, setOpen] = useState(false)
    const [metadata, setMetadata] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchMetadata = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/admin/user-metadata?userId=${userId}`)
            const data = await response.json()

            if (data.error) {
                setError(data.error)
            } else {
                setMetadata(data)
            }
        } catch (e) {
            setError("Meta veri alınamadı")
        } finally {
            setLoading(false)
        }
    }

    const handleOpen = () => {
        setOpen(true)
        fetchMetadata()
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
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-purple-600" />
                        Kullanıcı Meta Verileri
                    </DialogTitle>
                    <DialogDescription>
                        Auth ve profil meta verileri
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {metadata && !loading && (
                        <div className="space-y-4">
                            {/* User ID */}
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 mb-1">User ID</p>
                                <p className="text-sm font-mono text-slate-900 dark:text-slate-100 break-all">{metadata.id}</p>
                            </div>

                            {/* Email */}
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
                                <p className="text-sm text-slate-900 dark:text-slate-100">{metadata.email || "—"}</p>
                            </div>

                            {/* Created At */}
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 mb-1">Kayıt Tarihi</p>
                                <p className="text-sm text-slate-900 dark:text-slate-100">
                                    {metadata.created_at ? new Date(metadata.created_at).toLocaleString('tr-TR') : "—"}
                                </p>
                            </div>

                            {/* Last Sign In */}
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 mb-1">Son Giriş</p>
                                <p className="text-sm text-slate-900 dark:text-slate-100">
                                    {metadata.last_sign_in_at ? new Date(metadata.last_sign_in_at).toLocaleString('tr-TR') : "—"}
                                </p>
                            </div>

                            {/* User Metadata */}
                            {metadata.user_metadata && Object.keys(metadata.user_metadata).length > 0 && (
                                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">User Metadata</p>
                                    <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(metadata.user_metadata, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* App Metadata */}
                            {metadata.app_metadata && Object.keys(metadata.app_metadata).length > 0 && (
                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">App Metadata</p>
                                    <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(metadata.app_metadata, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Raw JSON */}
                            <details className="group">
                                <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                    Ham JSON Verisi (Genişlet)
                                </summary>
                                <div className="mt-2 p-3 rounded-lg bg-slate-900 dark:bg-black border border-slate-700">
                                    <pre className="text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(metadata, null, 2)}
                                    </pre>
                                </div>
                            </details>
                        </div>
                    )}
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