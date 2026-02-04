import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile, getCurrentUser } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AddCustomClient from "./client"
import {
    ArrowLeft,
    Sparkles,
    Lightbulb,
    FolderPlus
} from "lucide-react"

export default async function AddCustomPage() {
    
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
  
    if (!user || !profile) return null;

    const supabase = await createClient()

    // Kullanıcının bekleyen önerilerini çek
    const { data: myPendingSuggestions } = await supabase
        .from("user_category_suggestions")
        .select("*")
        .eq("suggested_by", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Action Bar */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-4">
                    <Link href="/surveys" prefetch={false}>
                        <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Anketler</span>
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white shadow-sm">
                            <FolderPlus className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                            Kategori Öner
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Info Card */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg backdrop-blur-xl p-6 mb-8">
                    <div className="absolute -right-8 -bottom-8 text-amber-200/30 dark:text-amber-900/30">
                        <Lightbulb className="h-32 w-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                                    Yeni Kategori Öner!
                                </h2>
                                <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                                    <p>Aklında güzel bir anket başlığı mı var?</p>
                                    <p>Hemen önerini yap, admin onaylarsa tüm okulda oylansın!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bekleyen Önerilerim */}
                {myPendingSuggestions && myPendingSuggestions.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg backdrop-blur-xl p-6 mb-8">
                        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            Bekleyen Önerilerim ({myPendingSuggestions.length})
                        </h3>
                        <div className="space-y-2">
                            {myPendingSuggestions.map((suggestion: any) => (
                                <div key={suggestion.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-blue-100 dark:border-blue-900">
                                    <span className="text-2xl">{suggestion.emoji}</span>
                                    <div>
                                        <p className="font-medium text-blue-900 dark:text-blue-100">{suggestion.title}</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">Onay bekleniyor...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <AddCustomClient
                    userClass={profile.class}
                    userName={`${profile.first_name} ${profile.last_name}`}
                />
            </div>
        </div>
    )
}
