// lib/survey-categories.ts
// Anket kategorileri - tüm uygulamada kullanılacak sabit liste

export interface SurveyCategory {
    id: string
    title: string
    emoji: string
    description: string
    color: string // Tailwind gradient class
}

export const SURVEY_CATEGORIES: SurveyCategory[] = [
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
    },
    {
        id: "most_athletic",
        title: "En Sporcu",
        emoji: "⚽",
        description: "Spor konusunda en yetenekli",
        color: "from-cyan-500 to-blue-500"
    },
    {
        id: "most_stylish",
        title: "En Şık",
        emoji: "✨",
        description: "Giyim konusunda en dikkat çekici",
        color: "from-amber-500 to-yellow-500"
    },
    {
        id: "class_comedian",
        title: "Sınıf Komedyeni",
        emoji: "🎭",
        description: "Dersleri eğlenceli hale getiren",
        color: "from-red-500 to-orange-500"
    },
    {
        id: "most_talkative",
        title: "En Konuşkan",
        emoji: "💬",
        description: "Sohbetin vazgeçilmezi",
        color: "from-teal-500 to-cyan-500"
    },
    {
        id: "most_quiet",
        title: "En Sessiz Güç",
        emoji: "🤫",
        description: "Sessiz ama etkili",
        color: "from-slate-500 to-gray-500"
    },
    {
        id: "future_ceo",
        title: "Gelecekte CEO",
        emoji: "💼",
        description: "Liderlik potansiyeli en yüksek",
        color: "from-violet-500 to-purple-500"
    },
    {
        id: "most_likely_to_be_famous",
        title: "Gelecekte Ünlü",
        emoji: "🌟",
        description: "Ünlü olma ihtimali en yüksek",
        color: "from-rose-500 to-pink-500"
    },
    {
        id: "most_adventurous",
        title: "En Maceracı",
        emoji: "🧗",
        description: "Her türlü çılgınlığa hazır olan",
        color: "from-orange-600 to-red-600"
    },
    {
        id: "tech_guru",
        title: "Teknoloji Gurusu",
        emoji: "💻",
        description: "Tüm teknik sorunları çözen",
        color: "from-slate-700 to-slate-900"
    },
    {
        id: "bookworm",
        title: "Kitap Kurdu",
        emoji: "📖",
        description: "Elinden kitap düşmeyen",
        color: "from-emerald-700 to-teal-700"
    },
    {
        id: "best_gamer",
        title: "En İyi Oyuncu",
        emoji: "🎮",
        description: "Oyunlarda rakip tanımayan",
        color: "from-indigo-600 to-purple-800"
    },
    {
        id: "sleeping_beauty",
        title: "En Uykucu",
        emoji: "😴",
        description: "Her fırsatta uyuklayan",
        color: "from-blue-200 to-blue-400"
    },
    {
        id: "social_media_star",
        title: "Sosyal Medya Starı",
        emoji: "📸",
        description: "Paylaşımları en çok ilgi gören",
        color: "from-fuchsia-500 to-purple-600"
    },
    {
        id: "most_optimistic",
        title: "En Pozitif",
        emoji: "☀️",
        description: "Her zaman bardağın dolu tarafını gören",
        color: "from-yellow-300 to-yellow-500"
    },
    {
        id: "master_chef",
        title: "Mutfak Ustası",
        emoji: "🍳",
        description: "En lezzetli atıştırmalıkları getiren",
        color: "from-orange-400 to-red-500"
    },
    {
        id: "animal_lover",
        title: "Hayvan Dostu",
        emoji: "🐾",
        description: "Tüm canlıları canı gönülden seven",
        color: "from-green-400 to-lime-500"
    },
    {
        id: "most_mysterious",
        title: "En Gizemli",
        emoji: "🕵️",
        description: "Hakkında en az şey bilinen",
        color: "from-gray-600 to-black"
    }
]

// ID'ye göre kategori bul
export function getCategoryById(id: string): SurveyCategory | undefined {
    return SURVEY_CATEGORIES.find(cat => cat.id === id)
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
