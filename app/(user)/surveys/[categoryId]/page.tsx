import { createClient } from "@/lib/supabase/server"
import { getAuthContext } from "@/lib/auth"
import { notFound } from "next/navigation"
import { type SurveyCategory } from "@/lib/survey-categories"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import SurveyVoteClient from "./client"
import { ArrowLeft, Vote, Users, AlertTriangle } from "lucide-react"
import { isVotingEnabled } from "@/lib/settings"

interface SurveyCategoryPageProps {
    params: Promise<{ categoryId: string }>
}

export default async function SurveyCategoryPage({ params }: SurveyCategoryPageProps) {
    const { categoryId } = await params

    // JWT'den user ve profile bilgilerini al (middleware zaten auth kontrolü yapıyor)
    const { user, profile: userProfile } = await getAuthContext()

    // TypeScript için null check
    if (!user || !userProfile) {
        return null
    }

    // Sistem kontrolü
    const votingEnabled = await isVotingEnabled()
    if (!votingEnabled) {
        return (
            <div className="container mx-auto px-4 py-16 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center shadow-xl">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oylama Kapalı</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Anketlere katılım şu an için durdurulmuştur. Lütfen daha sonra tekrar deneyiniz.
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

    // Kategoriyi Supabase'den çek
    const { data: category } = await supabase
        .from("survey_categories")
        .select("*")
        .eq("id", categoryId)
        .eq("is_active", true)
        .single()

    if (!category) notFound()

    // SADECE sınıf arkadaşlarını al (kendisi hariç)
    const { data: classmates } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, class, school_number, user_year")
        .eq("class", userProfile.class)
        .eq("user_year", userProfile.user_year)
        .neq("id", user.id)
        .order("first_name")

    // Kullanıcının bu kategoride daha önce oy verip vermediğini kontrol et
    const { data: existingVote } = await supabase
        .from("survey_votes")
        .select("voted_for_id")
        .eq("voter_id", user.id)
        .eq("category_id", categoryId)
        .single()

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Action Bar / Sub Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-4">
                    <Link href="/surveys" prefetch={false}>
                        <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Tüm Anketler</span>
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 bg-gradient-to-br ${category.color} rounded-lg text-white shadow-sm`}>
                            <Vote className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                            {category.title}
                        </span>
                    </div>
                </div>
            </div>

            {/* Kategori Başlığı */}
            <div className="max-w-2xl mx-auto mb-8">
                <div className="relative overflow-hidden rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-orange-50/50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 pointer-events-none" />
                    <div className="relative z-10">
                        <div className={`inline-flex text-6xl p-4 rounded-2xl bg-gradient-to-br ${category.color} shadow-xl mb-4`}>
                            {category.emoji}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white mb-2">
                            {category.title}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-3">{category.description}</p>

                        {/* Sınıf Bilgisi */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                            <Users className="h-4 w-4" />
                            Sadece {userProfile.class} sınıfı için
                        </div>
                    </div>
                </div>
            </div>

            {/* Oylama - Sınıf arkadaşları */}
            <SurveyVoteClient
                categoryId={categoryId}
                classmates={classmates || []}
                userClass={userProfile.class}
                existingVoteId={existingVote?.voted_for_id}
            />
        </div>
    )
}
