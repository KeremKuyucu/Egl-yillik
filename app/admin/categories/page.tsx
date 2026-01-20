import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { FALLBACK_CATEGORIES, type SurveyCategory } from "@/lib/survey-categories"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Plus,
    Settings,
    Trash2,
    Edit,
    Eye,
    EyeOff,
    GripVertical
} from "lucide-react"
import CategoryForm from "./category-form"
import CategoryActions from "./category-actions"

export default async function AdminCategoriesPage() {
    await requireAdmin()

    const supabase = await createClient()

    // Tüm kategorileri çek (aktif ve pasif)
    const { data: dbCategories } = await supabase
        .from("survey_categories")
        .select("*")
        .order("sort_order", { ascending: true })

    const categories: SurveyCategory[] = dbCategories || []

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white shadow-lg shadow-purple-500/20">
                    <Settings className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kategori Yönetimi</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Anket kategorilerini ekleyin, düzenleyin veya listesini yönetin
                    </p>
                </div>
            </div>

            {/* Yeni Kategori Ekle */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-purple-600" />
                    Yeni Kategori Ekle
                </h2>
                <CategoryForm />
            </div>

            {/* Mevcut Kategoriler */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Mevcut Kategoriler ({categories.length})
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Kategorileri düzenleyebilir veya pasife alabilirsiniz
                    </p>
                </div>

                {categories.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {categories.map((category, index) => (
                            <div
                                key={category.id}
                                className={`p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!category.is_active ? 'opacity-50' : ''
                                    }`}
                            >
                                {/* Sıra */}
                                <div className="flex items-center gap-2 text-slate-400">
                                    <GripVertical className="h-5 w-5" />
                                    <span className="text-sm font-medium w-6">{category.sort_order || index + 1}</span>
                                </div>

                                {/* Emoji & Renk */}
                                <div className={`text-3xl p-2 rounded-xl bg-gradient-to-br ${category.color} shadow-md`}>
                                    {category.emoji}
                                </div>

                                {/* Bilgiler */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                            {category.title}
                                        </h3>
                                        {!category.is_active && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                Pasif
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {category.description}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        ID: {category.id}
                                    </p>
                                </div>

                                {/* Aksiyonlar */}
                                <CategoryActions category={category} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Henüz kategori eklenmemiş</p>
                        <p className="text-sm mt-1">Yukarıdaki formu kullanarak yeni kategori ekleyin</p>
                    </div>
                )}
            </div>
        </div>
    )
}
