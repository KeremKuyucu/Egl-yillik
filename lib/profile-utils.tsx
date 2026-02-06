import { Pen, Feather, Crown, Trophy, BookOpen } from "lucide-react"

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
    if (count >= 35) return {
        label: "Mezuniyet İkonu",
        color: "bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-lg shadow-rose-500/40 ring-1 ring-white/20",
        icon: <Crown className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }
    if (count >= 25) return {
        label: "Yıllık Efsanesi",
        color: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-lg shadow-violet-500/40 ring-1 ring-white/20",
        icon: <Trophy className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }
    if (count >= 15) return {
        label: "Sınıfın Hafızası",
        color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40 ring-1 ring-white/20",
        icon: <BookOpen className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }
    if (count >= 5) return {
        label: "Anı Koleksiyoncusu",
        color: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/40 ring-1 ring-white/20",
        icon: <Feather className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }
    return {
        label: "Çaylak Yazar",
        color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 shadow-md ring-1 ring-white/20",
        icon: <Pen className="h-3 w-3 mr-1.5" strokeWidth={2.5} suppressHydrationWarning />
    }
}
