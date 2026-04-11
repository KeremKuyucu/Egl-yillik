"use client"

import { useState } from "react"
import { X, ZoomIn } from "lucide-react"

interface ProfilePhoto {
    id: string
    storage_path: string
    file_name: string
    file_size: number
    caption: string | null
    created_at: string
}

interface ProfilePhotoGalleryProps {
    photos: ProfilePhoto[]
    storageBaseUrl: string
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProfilePhotoGallery({ photos, storageBaseUrl }: ProfilePhotoGalleryProps) {
    const [lightboxPhoto, setLightboxPhoto] = useState<ProfilePhoto | null>(null)

    return (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/30 shadow-md hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-white dark:bg-slate-900/50"
                        onClick={() => setLightboxPhoto(photo)}
                    >
                        <img
                            src={`${storageBaseUrl}/${photo.storage_path}`}
                            alt={photo.caption || photo.file_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                {photo.caption && (
                                    <p className="text-white text-xs font-medium truncate mb-1">
                                        {photo.caption}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-white/70 text-[10px]">
                                        {formatFileSize(photo.file_size)}
                                    </span>
                                    <ZoomIn className="w-4 h-4 text-white/70" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
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
                                    {new Date(lightboxPhoto.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                    <span className="mx-1">•</span>
                                    {formatFileSize(lightboxPhoto.file_size)}
                                </p>
                            </div>
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
        </>
    )
}
