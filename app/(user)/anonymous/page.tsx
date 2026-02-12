import { createClient } from "@/lib/supabase/server"
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/data"
import AnonymousTextForm from "@/components/texts/anonymous-text-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { EyeOff, Sparkles, Heart, X, AlertTriangle, Ghost } from "lucide-react"
import { isMessagingEnabled } from "@/lib/settings"

interface Profile {
    id: string
    first_name: string
    last_name: string
    class: string
}

export default async function AnonymousTextPage({
    searchParams,
}: {
    searchParams: Promise<{ recipientId?: string }>
}) {
    const { recipientId } = await searchParams

    const user = await getCurrentUser()
    const userProfile = await getCurrentProfile()

    if (!user || !userProfile) {
        return null
    }

    // Sistem kontrolü
    const messagingEnabled = await isMessagingEnabled()
    if (!messagingEnabled) {
        return (
            <div className="container mx-auto px-4 py-16 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center shadow-xl">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Mesaj Yazma Kapalı</h1>
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

    // Diğer tüm profiller (kendisi hariç)
    const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .eq("user_year", userProfile.user_year)
        .order("class", { ascending: true })
        .order("first_name", { ascending: true })

    // Kullanıcının daha önce anonim yazdığı kişiler
    const { data: existingAnon, error: anonErr } = await supabase
        .from("anonymous_texts")
        .select("recipient_id")
        .eq("text_owner", user.id)
        .eq("is_active", true)

    if (anonErr) console.error(anonErr)

    const writtenRecipientIds = existingAnon?.map((t) => t.recipient_id) ?? []

    // Sınıflandırma (daha önce yazılmışları filtrele)
    const classmates =
        allProfiles?.filter(
            (p: Profile) =>
                p.class === userProfile.class && !writtenRecipientIds.includes(p.id)
        ) ?? []

    const others =
        allProfiles?.filter(
            (p: Profile) =>
                p.class !== userProfile.class && !writtenRecipientIds.includes(p.id)
        ) ?? []

    // Alıcı kontrolü
    const isValidRecipient = recipientId
        ? [...classmates, ...others].some((p) => p.id === recipientId)
        : false
    const safeRecipientId = isValidRecipient ? recipientId : undefined

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-violet-100/50 dark:border-violet-900/30">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                        <EyeOff className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                            Anonim Mesaj
                        </span>
                    </div>
                </div>

                <Link href="/home" prefetch={false}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2 transition-colors"
                    >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline font-medium">İptal</span>
                    </Button>
                </Link>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Hero Section */}
                <div className="text-center space-y-4 mb-8">
                    <div className="inline-flex items-center justify-center mb-2">
                        <div className="relative p-4 bg-white dark:bg-slate-800 shadow-xl rounded-full border border-violet-100 dark:border-violet-800">
                            <Ghost className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                            <Heart className="absolute -top-1 -right-1 h-4 w-4 text-pink-500 animate-bounce" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Anonim Bir{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                                Mesaj Bırak
                            </span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg">
                            Kimliğin gizli kalır. Arkadaşına isimsiz bir not bırak. 👻
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="border-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-50/50 via-purple-50/50 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-purple-950/30 border-b border-violet-100/50 dark:border-violet-900/30 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 animate-pulse" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                Anonim Yazım Rehberi
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 pl-6">
                            Lütfen{" "}
                            <span className="font-semibold text-violet-600 dark:text-violet-400">
                                saygılı
                            </span>
                            ,{" "}
                            <span className="font-semibold text-purple-600 dark:text-purple-400">
                                yapıcı
                            </span>{" "}
                            ve{" "}
                            <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                                samimi
                            </span>{" "}
                            bir dil kullanın. Anonim olmak sorumsuzluk değildir.
                        </p>
                    </div>

                    <CardContent className="p-6">
                        <AnonymousTextForm
                            classmates={classmates}
                            others={others}
                            userClass={userProfile.class}
                            preSelectedId={safeRecipientId}
                        />
                    </CardContent>
                </Card>

                {/* Tip */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                    <EyeOff className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-violet-900 dark:text-violet-200/80 leading-relaxed font-medium">
                        <strong className="text-violet-700 dark:text-violet-300">
                            Gizlilik:
                        </strong>{" "}
                        Gerçek kimliğin hiçbir zaman bilinmez. Bir takma ad
                        girebilir veya tamamen anonim kalabilirsin. Uygunsuz bir metin adminler tarafından silinecek ve yıllığa alınmayacaktır.
                    </p>
                </div>
            </div>
        </div>
    )
}
