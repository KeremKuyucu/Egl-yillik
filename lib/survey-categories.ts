// lib/survey-categories.ts
// Anket kategorileri - artık Supabase'den çekiliyor

export interface SurveyCategory {
    id: string
    title: string
    emoji: string
    description: string
    color: string // Tailwind gradient class
    sort_order?: number
    is_active?: boolean
}



// Avatar renkleri (profil için)
export const AVATAR_COLORS = [
    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    "bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
    "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
]

// İsme göre sabit renk üreten yardımcı fonksiyon
export function getColorFromName(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Fallback kategoriler (Supabase'den veri çekilemezse kullanılır)
export const FALLBACK_CATEGORIES: SurveyCategory[] = [
    {
        id: "most_funny",
        title: "En Komik",
        emoji: "😂",
        description: "Sınıfı en çok güldüren kişi",
        color: "from-yellow-500 to-orange-500"
    },
    {
        id: "most_hardworking",
        title: "En Çalışkan",
        emoji: "📚",
        description: "En azimli ve çalışkan öğrenci",
        color: "from-blue-500 to-indigo-500"
    },
    {
        id: "most_helpful",
        title: "En Yardımsever",
        emoji: "🤝",
        description: "Her zaman yardıma koşan",
        color: "from-green-500 to-emerald-500"
    },
    {
        id: "best_friend",
        title: "En İyi Arkadaş",
        emoji: "💜",
        description: "Herkesin güvendiği dost",
        color: "from-purple-500 to-pink-500"
    },
    {
        id: "most_creative",
        title: "En Yaratıcı",
        emoji: "🎨",
        description: "Fikirler konusunda en özgün",
        color: "from-pink-500 to-rose-500"
    }
]

// Legacy compat: getCategoryById for existing code
export function getCategoryById(id: string, categories?: SurveyCategory[]): SurveyCategory | undefined {
    const cats = categories || FALLBACK_CATEGORIES
    return cats.find(cat => cat.id === id)
}
