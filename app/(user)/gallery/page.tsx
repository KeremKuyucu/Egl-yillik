import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/data"
import GalleryClient from "@/components/gallery/gallery-client"
import { Camera } from "lucide-react"
import { isGalleryEnabled, getSystemClosedMessage } from "@/lib/settings"

export const dynamic = "force-dynamic"

const MAX_PHOTOS_PER_USER = 20
const BUCKET_NAME = "gallery"

export default async function GalleryPage() {
    const [supabase, user, galleryEnabled, closedMessage] = await Promise.all([
        createClient(),
        getCurrentUser(),
        isGalleryEnabled(),
        getSystemClosedMessage('gallery'),
    ])

    if (!user) redirect("/login")

    // RPC ile fotoğrafları çek (kilit kontrolü DB tarafında)
    const { data: photos, error } = await supabase.rpc("get_gallery_photos")

    if (error) {
        console.error("Gallery fetch error:", error)
    }

    // Kullanıcının kaç fotoğrafı var
    const userPhotoCount = (photos || []).filter(
        (p: { user_id: string }) => p.user_id === user.id
    ).length

    // Storage base URL
    const storageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30">
                    <Camera className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-indigo-100 dark:to-indigo-200 tracking-tight font-serif">
                        Fotoğraf Galerisi
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Anılarınızı fotoğraflarla ölümsüzleştirin
                    </p>
                </div>
            </div>

            {!galleryEnabled && (
                <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200">
                    <p className="font-medium text-center">
                        {closedMessage}
                    </p>
                </div>
            )}

            <GalleryClient
                photos={(photos as any) || []}
                currentUserId={user.id}
                storageBaseUrl={storageBaseUrl}
                maxPhotos={MAX_PHOTOS_PER_USER}
                userPhotoCount={userPhotoCount}
                messagingEnabled={galleryEnabled}
            />
        </div>
    )
}
