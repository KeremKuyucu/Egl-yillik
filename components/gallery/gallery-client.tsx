"use client"

import { useState, useRef, useCallback } from "react"
import { uploadPhotoAction, deletePhotoAction } from "@/app/actions/gallery"
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
    Upload,
    X,
    ImagePlus,
    Trash2,
    Loader2,
    CheckCircle,
    Camera,
    ZoomIn,
    User,
    Lock,
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
    is_unlocked: boolean
    profiles?: {
        first_name: string
        last_name: string
        school_number: string
        class: string
    }
}

interface GalleryClientProps {
    photos: GalleryPhoto[]
    currentUserId: string
    storageBaseUrl: string
    userPhotoCount: number
    messagingEnabled: boolean
}

// ─── WebP Dönüşüm Fonksiyonu ──────────────────────────────
async function convertToWebP(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
    return new Promise((resolve, reject) => {
        // Zaten webp ise ve boyut küçükse direkt döndür
        if (file.type === "image/webp" && file.size < 500_000) {
            resolve(file)
            return
        }

        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)

            let { width, height } = img

            // Boyut küçültme
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext("2d")
            if (!ctx) {
                reject(new Error("Canvas context oluşturulamadı"))
                return
            }

            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("WebP dönüşümü başarısız"))
                        return
                    }

                    const webpName = file.name.replace(/\.[^.]+$/, ".webp")
                    const webpFile = new File([blob], webpName, { type: "image/webp" })
                    resolve(webpFile)
                },
                "image/webp",
                quality
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("Resim yüklenemedi"))
        }

        img.src = url
    })
}

// ─── Boyut Formatlama ──────────────────────────────────────
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Ana Bileşen ───────────────────────────────────────────
export default function GalleryClient({
    photos: initialPhotos,
    currentUserId,
    storageBaseUrl,
    userPhotoCount: initialCount,
    messagingEnabled,
}: GalleryClientProps) {
    const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos)
    const [uploading, setUploading] = useState(false)
    const [converting, setConverting] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [convertedFile, setConvertedFile] = useState<File | null>(null)
    const [originalSize, setOriginalSize] = useState<number>(0)
    const [caption, setCaption] = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const currentUserPhotos = photos.filter(p => p.user_id === currentUserId)
    const currentUserPhotoCount = currentUserPhotos.length
    const currentUserSize = currentUserPhotos.reduce((acc, p) => acc + (p.file_size || 0), 0)

    // Dosya seçimi + WebP dönüşümü
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Lütfen bir resim dosyası seçin")
            return
        }

        if (file.size > 20 * 1024 * 1024) {
            toast.error("Dosya boyutu 20MB'ı geçemez")
            return
        }

        setOriginalSize(file.size)
        setConverting(true)

        try {
            const webpFile = await convertToWebP(file)
            setConvertedFile(webpFile)

            // Önizleme oluştur
            const previewUrl = URL.createObjectURL(webpFile)
            setPreview(previewUrl)
        } catch {
            toast.error("Resim işlenirken bir hata oluştu")
        } finally {
            setConverting(false)
        }

        // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
        e.target.value = ""
    }, [])

    // Yükleme
    const handleUpload = useCallback(async () => {
        if (!convertedFile) return

        setUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", convertedFile)
            if (caption.trim()) {
                formData.append("caption", caption.trim())
            }

            const result = await uploadPhotoAction(formData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Fotoğraf başarıyla yüklendi!")
                // Temizle
                setPreview(null)
                setConvertedFile(null)
                setCaption("")
                setOriginalSize(0)
                // Sayfa yenilenecek (revalidatePath)
                window.location.reload()
            }
        } catch {
            toast.error("Beklenmeyen bir hata oluştu")
        } finally {
            setUploading(false)
        }
    }, [convertedFile, caption, currentUserSize])

    // Önizlemeyi iptal et
    const handleCancel = useCallback(() => {
        if (preview) URL.revokeObjectURL(preview)
        setPreview(null)
        setConvertedFile(null)
        setCaption("")
        setOriginalSize(0)
    }, [preview])

    // Fotoğraf silme
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

    const canUpload = messagingEnabled

    return (
        <div className="space-y-8">
            {/* ── Yükleme Alanı ─────────────────────────────── */}
            {messagingEnabled && (
                <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 shadow-2xl bg-white dark:bg-transparent">
                    {/* Dekoratif arka plan */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81] transition-colors duration-500" />
                    <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />

                    <div className="relative z-10 p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                                <Camera className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif">
                                    Fotoğraf Yükle
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {currentUserPhotoCount} fotoğraf • {formatFileSize(currentUserSize)} / 10 MB kullanıldı
                                </p>
                            </div>
                        </div>

                        {!preview ? (
                            /* Dosya seçim alanı */
                            <button
                                type="button"
                                onClick={() => canUpload && fileInputRef.current?.click()}
                                disabled={!canUpload || converting}
                                className="w-full group border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-400/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {converting ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                            WebP&apos;ye dönüştürülüyor...
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                                            <ImagePlus className="w-8 h-8 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                                {canUpload
                                                    ? "Fotoğraf seçmek için tıkla"
                                                    : "Fotoğraf veya boyut limitine ulaştın"}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                JPG, PNG veya WebP • Otomatik WebP&apos;ye dönüştürülür
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ) : (
                            /* Önizleme + Yükleme */
                            <div className="space-y-4">
                                <div className="relative rounded-2xl overflow-hidden border border-indigo-100 dark:border-indigo-500/20 shadow-lg">
                                    <img
                                        src={preview}
                                        alt="Önizleme"
                                        className="w-full max-h-80 object-contain bg-slate-50 dark:bg-slate-900/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <Input
                                    placeholder="Açıklama ekle (isteğe bağlı)"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    maxLength={200}
                                    className="rounded-xl border-indigo-100 dark:border-indigo-500/20 focus:ring-indigo-500"
                                />

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="flex-1 rounded-xl"
                                        disabled={uploading}
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Yükleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Yükle
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </div>
            )}

            {/* ── Fotoğraf Galerisi ──────────────────────────── */}
            {photos.length === 0 ? (
                <div className="text-center py-16">
                    <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 mb-4">
                        <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Henüz fotoğraf yüklenmemiş
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        İlk fotoğrafı yükleyen sen ol!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {photos.map((photo) => {
                        const isLocked = !photo.is_unlocked
                        const canView = !isLocked || photo.user_id === currentUserId
                        const canDelete = photo.user_id === currentUserId && messagingEnabled

                        return (
                            <div
                                key={photo.id}
                                className={`group relative rounded-2xl overflow-hidden border shadow-md hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900/50 ${isLocked && !canView
                                    ? "border-amber-200 dark:border-amber-500/30"
                                    : "border-slate-200 dark:border-slate-700/50 hover:scale-[1.02]"
                                    }`}
                                onClick={() => canView && setLightboxPhoto(photo)}
                            >
                                <div className="aspect-square overflow-hidden relative">
                                    <img
                                        src={`${storageBaseUrl}/${photo.storage_path}`}
                                        alt={photo.caption || photo.file_name}
                                        className={`w-full h-full object-cover transition-transform duration-500 ${isLocked && !canView
                                            ? "blur-xl scale-110"
                                            : "group-hover:scale-110"
                                            }`}
                                        loading="lazy"
                                    />

                                    {/* Kilitli overlay */}
                                    {isLocked && !canView && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/60 to-amber-800/40 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <div className="p-3 rounded-full bg-amber-500/20 mb-2">
                                                <Lock className="w-6 h-6 text-amber-300" />
                                            </div>
                                            <p className="text-amber-200 text-xs font-medium">Mezuniyette Açılacak</p>
                                        </div>
                                    )}
                                </div>

                                {/* Hover overlay */}
                                {canView && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            {photo.caption && (
                                                <p className="text-white text-xs font-medium truncate mb-1">
                                                    {photo.caption}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-white/70 text-[10px] flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    <span className="truncate max-w-[90px]">
                                                        {photo.profiles
                                                            ? `${photo.profiles.first_name} ${photo.profiles.last_name}`
                                                            : "Anonim"}
                                                    </span>
                                                    <span className="mx-1 opacity-50">•</span>
                                                    <span>{formatFileSize(photo.file_size)}</span>
                                                </span>
                                                <ZoomIn className="w-4 h-4 text-white/70 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Silme butonu */}
                                {canDelete && (
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
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Lightbox Modal ─────────────────────────────── */}
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

                        {/* Bilgi çubuğu */}
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
                                    {new Date(lightboxPhoto.created_at).toLocaleDateString("tr-TR")}
                                    <span className="mx-1">•</span>
                                    {formatFileSize(lightboxPhoto.file_size)}
                                </p>
                            </div>

                            {lightboxPhoto.user_id === currentUserId && messagingEnabled && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => {
                                        setDeletingId(lightboxPhoto.id)
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Sil
                                </Button>
                            )}
                        </div>

                        {/* Kapat */}
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

            {/* ── Silme Onay Diyaloğu ────────────────────────── */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fotoğrafı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu fotoğrafı silmek istediğinden emin misin? Bu işlem geri alınamaz.
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
