import {
    Crown,
    Trophy,
    BookOpen,
    Feather,
    Pen,
    Sparkles,
    Star,
    Gem,
    Medal,
    Flame,
    Zap,
    Award,
    Shield
} from "lucide-react"

export const getDetailedGreeting = (userName: string) => {
    const timeString = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false })
    const hour = parseInt(timeString, 10)

    const timeMap = [
        { start: 0, end: 3, text: "Yıllığı mı Düzenliyorsun, Test mi Çözüyorsun?", icon: "🦉" },
        { start: 3, end: 6, text: "Bu Saatte Sadece Orijinal Sorular ve Biz Ayaktayız", icon: "🕯️" },
        { start: 6, end: 8, text: "İlk Dersin Yoklamasını Kaçırma!", icon: "🏃" },
        { start: 8, end: 12, text: "Hayırlı Sabahlar, Kantinde Simit Sırası Var mı?", icon: "🥯" },
        { start: 12, end: 13, text: "Öğle Arası: Yemek mi, Voleybol Maçı mı?", icon: "🏐" },
        { start: 13, end: 16, text: "Son Derslerin Çekilmeyen Ağırlığı Üzerinde mi?", icon: "😴" },
        { start: 16, end: 19, text: "Okul Bitti, Dershane/Etüt Mesaisi Başlar", icon: "📚" },
        { start: 19, end: 22, text: "İyi Akşamlar, Deneme Netleri Ne Alemde?", icon: "✍️" },
        { start: 22, end: 24, text: "İyi Geceler, Yarın Okulda Görüşürüz", icon: "🏫" }
    ];

    const match = timeMap.find(t => hour >= t.start && hour < t.end)
    const greeting = match ? match.text : "Merhaba"
    const icon = match ? match.icon : "👋"

    return {
        full: `${greeting}, ${userName}`,
        short: greeting,
        icon: icon
    }
}

export const getBadge = (count: number) => {
    // 50+
    if (count >= 50) return {
        label: "Efsane Yazar",
        color: "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-0 shadow-lg shadow-fuchsia-500/40 ring-1 ring-white/20",
        icon: <Gem className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 40+
    if (count >= 40) return {
        label: "Altın Kalem",
        color: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 shadow-lg shadow-yellow-500/40 ring-1 ring-white/20",
        icon: <Medal className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 35+ (senin mevcut)
    if (count >= 35) return {
        label: "Mezuniyet İkonu",
        color: "bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-lg shadow-rose-500/40 ring-1 ring-white/20",
        icon: <Crown className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 30+
    if (count >= 30) return {
        label: "Sınıfın Efsanesi",
        color: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg shadow-emerald-500/40 ring-1 ring-white/20",
        icon: <Award className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 25+ (senin mevcut)
    if (count >= 25) return {
        label: "Yıllık Efsanesi",
        color: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-lg shadow-violet-500/40 ring-1 ring-white/20",
        icon: <Trophy className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 22+
    if (count >= 22) return {
        label: "Editör Ruhlu",
        color: "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-0 shadow-lg shadow-sky-500/40 ring-1 ring-white/20",
        icon: <Shield className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 19+
    if (count >= 19) return {
        label: "Hikâye Ustası",
        color: "bg-gradient-to-r from-pink-500 to-rose-600 text-white border-0 shadow-lg shadow-pink-500/40 ring-1 ring-white/20",
        icon: <Flame className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 15+ (senin mevcut)
    if (count >= 15) return {
        label: "Sınıfın Hafızası",
        color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40 ring-1 ring-white/20",
        icon: <BookOpen className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 12+
    if (count >= 12) return {
        label: "Düzenli Yazar",
        color: "bg-gradient-to-r from-lime-500 to-green-600 text-white border-0 shadow-lg shadow-lime-500/40 ring-1 ring-white/20",
        icon: <Zap className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 8+
    if (count >= 8) return {
        label: "Parlayan Kalem",
        color: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white border-0 shadow-lg shadow-cyan-500/40 ring-1 ring-white/20",
        icon: <Sparkles className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 5+ (senin mevcut)
    if (count >= 5) return {
        label: "Anı Koleksiyoncusu",
        color: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/40 ring-1 ring-white/20",
        icon: <Feather className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 3+
    if (count >= 3) return {
        label: "Isınma Turu",
        color: "bg-gradient-to-r from-slate-400 to-slate-600 text-white border-0 shadow-md ring-1 ring-white/20",
        icon: <Star className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }

    // 0+
    return {
        label: "Çaylak Yazar",
        color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md ring-1 ring-white/20",
        icon: <Pen className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }
}