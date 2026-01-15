"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { addCategory } from "./actions"
import { Plus, Loader2, Sparkles } from "lucide-react"

// Popüler gradient renkleri
const GRADIENT_OPTIONS = [
    { value: "from-yellow-500 to-orange-500", label: "Sarı-Turuncu" },
    { value: "from-blue-500 to-indigo-500", label: "Mavi-Mor" },
    { value: "from-green-500 to-emerald-500", label: "Yeşil" },
    { value: "from-purple-500 to-pink-500", label: "Mor-Pembe" },
    { value: "from-pink-500 to-rose-500", label: "Pembe-Gül" },
    { value: "from-cyan-500 to-blue-500", label: "Cyan-Mavi" },
    { value: "from-amber-500 to-yellow-500", label: "Amber-Sarı" },
    { value: "from-red-500 to-orange-500", label: "Kırmızı-Turuncu" },
    { value: "from-teal-500 to-cyan-500", label: "Teal-Cyan" },
    { value: "from-slate-500 to-gray-500", label: "Gri" },
    { value: "from-violet-500 to-purple-500", label: "Violet-Mor" },
    { value: "from-rose-500 to-pink-500", label: "Gül-Pembe" },
    { value: "from-orange-600 to-red-600", label: "Koyu Turuncu-Kırmızı" },
    { value: "from-slate-700 to-slate-900", label: "Koyu Gri" },
    { value: "from-emerald-700 to-teal-700", label: "Koyu Yeşil" },
    { value: "from-indigo-600 to-purple-800", label: "Koyu Mor" },
]

export default function CategoryForm() {
    const [formData, setFormData] = useState({
        id: "",
        title: "",
        emoji: "",
        description: "",
        color: "from-purple-500 to-pink-500",
        sort_order: 0
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        // Validation
        if (!formData.id.trim()) {
            setError("ID zorunludur (örn: most_funny)")
            return
        }
        if (!/^[a-z_]+$/.test(formData.id)) {
            setError("ID sadece küçük harf ve alt çizgi içerebilir")
            return
        }
        if (!formData.title.trim()) {
            setError("Başlık zorunludur")
            return
        }
        if (!formData.emoji.trim()) {
            setError("Emoji zorunludur")
            return
        }
        if (!formData.description.trim()) {
            setError("Açıklama zorunludur")
            return
        }

        setIsLoading(true)

        try {
            const result = await addCategory(formData)
            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setFormData({
                    id: "",
                    title: "",
                    emoji: "",
                    description: "",
                    color: "from-purple-500 to-pink-500",
                    sort_order: 0
                })
                router.refresh()
                setTimeout(() => setSuccess(false), 3000)
            }
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ID */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                        placeholder="ornek_kategori"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20"
                    />
                    <p className="text-xs text-slate-500 mt-1">Sadece küçük harf ve alt çizgi</p>
                </div>

                {/* Başlık */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Başlık <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="En Havalı"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>

                {/* Emoji */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Emoji <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.emoji}
                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                        placeholder="😎"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>

                {/* Açıklama */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Açıklama <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Sınıfın en havalı kişisi"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>

                {/* Sıra */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Sıra Numarası
                    </label>
                    <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>
            </div>

            {/* Renk Seçimi */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Renk Gradyanı
                </label>
                <div className="flex flex-wrap gap-2">
                    {GRADIENT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: option.value })}
                            className={`h-8 w-12 rounded-lg bg-gradient-to-r ${option.value} transition-all ${formData.color === option.value
                                    ? 'ring-2 ring-offset-2 ring-purple-500 scale-110'
                                    : 'hover:scale-105'
                                }`}
                            title={option.label}
                        />
                    ))}
                </div>
            </div>

            {/* Önizleme */}
            {formData.title && formData.emoji && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 mb-2">Önizleme:</p>
                    <div className="flex items-center gap-3">
                        <div className={`text-3xl p-2 rounded-xl bg-gradient-to-br ${formData.color} shadow-md`}>
                            {formData.emoji}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{formData.title}</h3>
                            <p className="text-sm text-slate-500">{formData.description || "Açıklama..."}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Hata / Başarı */}
            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Kategori başarıyla eklendi!
                </div>
            )}

            {/* Submit */}
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Ekleniyor...
                    </>
                ) : (
                    <>
                        <Plus className="mr-2 h-5 w-5" />
                        Kategori Ekle
                    </>
                )}
            </Button>
        </form>
    )
}
