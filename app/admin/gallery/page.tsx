import { createClient } from "@/lib/supabase/server"
import AdminGalleryClient from "@/components/admin/admin-gallery-client"
import { Camera } from "lucide-react"

export const dynamic = "force-dynamic"

const BUCKET_NAME = "gallery"

export default async function AdminGalleryPage() {
    const supabase = await createClient()

    // Admin RPC ile tüm fotoğrafları çek
    const { data: photos, error } = await supabase.rpc("get_admin_gallery_photos")

    if (error) {
        console.error("Admin gallery fetch error:", error)
    }

    const storageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/30">
                    <Camera className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-serif">
                        Galeri Yönetimi
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Tüm fotoğrafları görüntüle ve yönet
                    </p>
                </div>
            </div>

            <AdminGalleryClient
                photos={(photos as any) || []}
                storageBaseUrl={storageBaseUrl}
            />
        </div>
    )
}
