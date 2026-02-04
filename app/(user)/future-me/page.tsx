import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import FutureMeForm from "@/components/future/future-me-form" // Assuming I just created this
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle, Hourglass } from "lucide-react"
import { isMessagingEnabled } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function FutureMePage() {
    const user  = await getCurrentUser()
    if (!user) return null

    // Sistem kontrolü
    const messagingEnabled = await isMessagingEnabled()

    // NOTE: Even if messaging is disabled, maybe we want to allow VIEWING the letter? 
    // currently saveFutureMeAction checks isMessagingEnabled.
    // If disabled, we should probably disable the form or show a message.
    // existing code in new/page.tsx shows a full page block.
    // For "Future Me", maybe viewing created text is fine even if editing is disabled?
    // But let's stick to the pattern: if disabled, show disabled page.

    if (!messagingEnabled) {
        return (
            <div className="container mx-auto px-4 py-16 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center shadow-xl">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Yazım Kapalı</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Yeni anı yazma ve düzenleme işlemleri şu an için sistem yöneticisi tarafından durdurulmuştur.
                    </p>
                    <Link href="/home">
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                            Ana Sayfaya Dön
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const supabase = await createClient()

    // Kullanıcının kendisine yazdığı mesajı getir
    const { data: existingText } = await supabase
        .from("texts")
        .select("content")
        .eq("author_id", user.id)
        .eq("recipient_id", user.id)
        .maybeSingle()

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-2">
                    <Hourglass className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                    Geleceğe <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Mektup</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Kendine, gelecekteki benliğine bir mesaj bırak.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                <FutureMeForm initialContent={existingText?.content || ""} />
            </div>
        </div>
    )
}
