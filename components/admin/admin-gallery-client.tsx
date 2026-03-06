"use client"

import { useState, useCallback } from "react"
import { deletePhotoAction } from "@/app/actions/gallery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
    X,
    Trash2,
    Camera,
    ZoomIn,
    User,
    Search,
    ImageIcon,
} from "lucide-react"

// ─── Tip Tanımlamaları ─────────────────────────────────────
interface GalleryPhoto {
    id: string
    user_id: string
    storage_path: string
    file_name: string
    file_size: number
    caption: string | null
    created_at: string
    profiles?: {
        first_name: string
        last_name: string
        school_number: string
        class: string
        user_year: number
    }
}

interface AdminGalleryClientProps {
    photos: GalleryPhoto[]
    storageBaseUrl: string
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminGalleryClient({
    photos: initialPhotos,
    storageBaseUrl,
}: AdminGalleryClientProps) {
    const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Arama filtresi
    const filteredPhotos = photos.filter((photo) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const name = photo.profiles
            ? `${photo.profiles.first_name} ${photo.profiles.last_name}`.toLowerCase()
            : ""
        const cls = photo.profiles?.class?.toLowerCase() || ""
        const caption = photo.caption?.toLowerCase() || ""
        return name.includes(q) || cls.includes(q) || caption.includes(q)
    })

    // Admin fotoğraf silme
    const handleDelete = useCallback(async () => {
        if (!deletingId) return

        const result = await deletePhotoAction(deletingId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Fotoğraf silindi")
            setPhotos((prev) => prev.filter((p) => p.id !== deletingId))
            if (lightboxPhoto?.id === deletingId) setLightboxPhoto(null)
        }
        setDeletingId(null)
    }, [deletingId, lightboxPhoto])

    // Toplam boyut
    const totalSize = photos.reduce((sum, p) => sum + p.file_size, 0)

    return (
        <div className="space-y-6">
            {/* İstatistikler */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <ImageIcon className="w-4 h-4" />
                        Toplam Fotoğraf
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {photos.length}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <User className="w-4 h-4" />
                        Yükleyen Kişi
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {new Set(photos.map((p) => p.user_id)).size}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 p-4 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <Camera className="w-4 h-4" />
                        Toplam Boyut
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {formatFileSize(totalSize)}
                    </p>
                </div>
            </div>

            {/* Arama */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="İsim, sınıf veya açıklama ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                />
            </div>

            {/* Fotoğraf Grid */}
            {filteredPhotos.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">
                        {searchQuery ? "Aramayla eşleşen fotoğraf bulunamadı" : "Henüz fotoğraf yüklenmemiş"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white dark:bg-slate-900/50"
                            onClick={() => setLightboxPhoto(photo)}
                        >
                            <div className="aspect-square overflow-hidden">
                                <img
                                    src={`${storageBaseUrl}/${photo.storage_path}`}
                                    alt={photo.caption || photo.file_name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                />
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-xs font-medium truncate">
                                        {photo.profiles
                                            ? `${photo.profiles.first_name} ${photo.profiles.last_name}`
                                            : "Bilinmeyen"}
                                    </p>
                                    <p className="text-white/60 text-[10px]">
                                        {photo.profiles?.class} • {formatFileSize(photo.file_size)}
                                    </p>
                                </div>
                            </div>

                            {/* Silme butonu */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingId(photo.id)
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 shadow-lg"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={`${storageBaseUrl}/${lightboxPhoto.storage_path}`}
                            alt={lightboxPhoto.caption || lightboxPhoto.file_name}
                            className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
                        />

                        <div className="mt-3 flex items-center justify-between px-2">
                            <div className="text-white/80 text-sm">
                                {lightboxPhoto.caption && (
                                    <p className="font-medium mb-0.5">{lightboxPhoto.caption}</p>
                                )}
                                <p className="text-xs text-white/50 flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    {lightboxPhoto.profiles
                                        ? `${lightboxPhoto.profiles.first_name} ${lightboxPhoto.profiles.last_name} (${lightboxPhoto.profiles.class})`
                                        : "Bilinmeyen"}
                                    <span className="mx-1">•</span>
                                    {formatFileSize(lightboxPhoto.file_size)}
                                    <span className="mx-1">•</span>
                                    {new Date(lightboxPhoto.created_at).toLocaleDateString("tr-TR")}
                                </p>
                            </div>

                            <Button
                                variant="destructive"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setDeletingId(lightboxPhoto.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Sil
                            </Button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setLightboxPhoto(null)}
                            className="absolute -top-2 -right-2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Silme Onay */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fotoğrafı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu fotoğrafı kalıcı olarak silmek istediğinden emin misin?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
