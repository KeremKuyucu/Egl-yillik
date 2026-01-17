import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Vote, ChevronRight, Award } from "lucide-react"

interface SurveyCardProps {
    userId: string
}

export default async function SurveyCard({ userId }: SurveyCardProps) {
    const supabase = await createClient()

    // Kategorileri ve oyları paralel çek
    const [categoriesResult, userVotesResult] = await Promise.all([
        supabase
            .from("survey_categories")
            .select("id, title, emoji, description, color")
            .eq("is_active", true),
        supabase
            .from("survey_votes")
            .select("category_id")
            .eq("voter_id", userId)
    ])

    const categories = categoriesResult.data || []
    const userVotes = userVotesResult.data
    const votedCategoryIds = userVotes?.map(v => v.category_id) || []
    const unvotedCategories = categories.filter(c => !votedCategoryIds.includes(c.id))

    if (unvotedCategories.length === 0) return null

    const featuredSurvey = unvotedCategories[Math.floor(Math.random() * unvotedCategories.length)]

    return (
        <div className="relative rounded-2xl border-2 border-indigo-300/60 dark:border-indigo-900/40 overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full -ml-12 -mb-12"></div>

            <div className="relative p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-md">
                        <Vote className="h-5 w-5" />
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Yeni Anket
                    </span>
                </div>
                <span className="text-4xl mb-3 block drop-shadow-md">{featuredSurvey.emoji}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {featuredSurvey.title}
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-5">
                    Sence bu kişi kim?
                </p>

                <Link href={`/surveys/${featuredSurvey.id}`} prefetch={false} className="block">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-[1.02] transition-transform">
                        Seçimini Yap <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}

// Loading skeleton
export function SurveyCardSkeleton() {
    return (
        <div className="relative rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-900 animate-pulse">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3"></div>
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded mb-5"></div>
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
        </div>
    )
}
