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
import { Search, Loader2, Shield, Trash2, Edit } from "lucide-react"
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