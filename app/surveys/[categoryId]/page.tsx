import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getCategoryById, FALLBACK_CATEGORIES, type SurveyCategory, type CustomOption } from "@/lib/survey-categories"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Footer from "@/components/footer"
import SurveyVoteClient from "./client"
import { ArrowLeft, Vote, Users, Sparkles } from "lucide-react"

interface SurveyCategoryPageProps {
    params: Promise<{ categoryId: string }>
}

export default async function SurveyCategoryPage({ params }: SurveyCategoryPageProps) {
    const { categoryId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Kategoriyi Supabase'den çek
    const { data: dbCategory } = await supabase
        .from("survey_categories")
        .select("*")
        .eq("id", categoryId)
        .eq("is_active", true)
        .single()

    // Supabase'den kategori bulunamadıysa fallback'e bak
    const category: SurveyCategory | undefined = dbCategory || getCategoryById(categoryId, FALLBACK_CATEGORIES)
    if (!category) notFound()

    // Kullanıcı profili
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    if (!userProfile) redirect("/login")

    // SADECE sınıf arkadaşlarını al (kendisi hariç)
    const { data: classmates } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, class, school_number")
        .eq("class", userProfile.class)
        .neq("id", user.id)
        .order("first_name")

    // Bu kategorideki sınıfa özel özel seçenekleri al
    const { data: customOptions } = await supabase
        .from("survey_custom_options")
        .select(`
            id,
            category_id,
            option_text,
            created_by,
            class,
            vote_count,
            created_at,
            creator:created_by (
                first_name,
                last_name
            )
        `)
        .eq("category_id", categoryId)
        .eq("class", userProfile.class)
        .order("vote_count", { ascending: false })

    // Kullanıcının bu kategoride daha önce oy verip vermediğini kontrol et
    const { data: existingVote } = await supabase
        .from("survey_votes")
        .select("voted_for_id, custom_option_id")
        .eq("voter_id", user.id)
        .eq("category_id", categoryId)
        .single()

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-foreground transition-colors duration-300">
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
            </div>

            <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                    <Link href="/surveys">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Anketler</span>
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 bg-gradient-to-br ${category.color} rounded-lg text-white`}>
                            <Vote className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold font-serif bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            {category.title}
                        </span>
                    </div>
                    <ModeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

                            {/* Özel Seçenek İpucu */}
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                                <Sparkles className="h-4 w-4" />
                                <span>Listede aradığını bulamadın mı? Kendi seçeneğini ekleyebilirsin!</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Oylama - Sınıf arkadaşları + Özel seçenekler */}
                <SurveyVoteClient
                    categoryId={categoryId}
                    classmates={classmates || []}
                    customOptions={(customOptions as unknown as CustomOption[]) || []}
                    userClass={userProfile.class}
                    existingVoteId={existingVote?.voted_for_id}
                    existingCustomOptionId={existingVote?.custom_option_id}
                />
            </main>
            <Footer />
        </div>
    )
}
