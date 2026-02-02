"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { suggestCategory } from "./actions"
import { Loader2, CheckCircle2, FolderPlus, Sparkles } from "lucide-react"

// Popüler gradient renkleri
const GRADIENT_OPTIONS = [
    { value: "from-yellow-500 to-orange-500", label: "Sarı-Turuncu" },
    { value: "from-blue-500 to-indigo-500", label: "Mavi-Mor" },
    { value: "from-green-500 to-emerald-500", label: "Yeşil" },
    { value: "from-purple-500 to-pink-500", label: "Mor-Pembe" },
    { value: "from-pink-500 to-rose-500", label: "Pembe-Gül" },
    { value: "from-cyan-500 to-blue-500", label: "Cyan-Mavi" },
    { value: "from-red-500 to-orange-500", label: "Kırmızı-Turuncu" },
    { value: "from-teal-500 to-cyan-500", label: "Teal-Cyan" },
    { value: "from-violet-500 to-purple-500", label: "Violet-Mor" },
    { value: "from-rose-500 to-pink-500", label: "Gül-Pembe" },
]

interface AddCustomClientProps {
    userClass: string
    userName: string
}

export default function AddCustomClient({ }: AddCustomClientProps) {
    // Kategori Önerisi State
    const [categoryTitle, setCategoryTitle] = useState("")
    const [categoryEmoji, setCategoryEmoji] = useState("")
    const [categoryDescription, setCategoryDescription] = useState("")
    const [categoryColor, setCategoryColor] = useState("from-purple-500 to-pink-500")

    // Ortak State
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const router = useRouter()

    // Emoji sayısını doğru şekilde saymak için yardımcı fonksiyon
    const getEmojiCount = (str: string) => {
        // Segmenter API ile grapheme cluster sayısını al (emoji'leri doğru sayar)
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
            return Array.from(segmenter.segment(str)).length
        }
        // Fallback: spread operator ile unicode karakterlerini say
        return [...str].length
    }

    // Emoji input handler - sadece 1 emoji'ye izin ver
    const handleEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const emojiCount = getEmojiCount(value)

        // Eğer 1 veya daha az emoji varsa kabul et
        if (emojiCount <= 1) {
            setCategoryEmoji(value)
        }
        // Eğer 1'den fazla emoji varsa, sadece ilk emoji'yi al
        else if (emojiCount > 1) {
            if (typeof Intl !== 'undefined' && Intl.Segmenter) {
                const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
                const segments = Array.from(segmenter.segment(value))
                setCategoryEmoji(segments[0].segment)
            } else {
                setCategoryEmoji([...value][0])
            }
        }
    }

    const handleSubmitCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!categoryTitle.trim()) {
            setError("Kategori başlığı zorunludur")
            return
        }
        if (categoryTitle.trim().length < 3) {
            setError("Başlık en az 3 karakter olmalı")
            return
        }
        if (!categoryEmoji.trim()) {
            setError("Emoji zorunludur")
            return
        }
        if (!categoryDescription.trim()) {
            setError("Açıklama zorunludur")
            return
        }
        if (categoryDescription.trim().length < 10) {
            setError("Açıklama en az 10 karakter olmalı")
            return
        }

        setIsLoading(true)

        try {
            const result = await suggestCategory({
                title: categoryTitle.trim(),
                emoji: categoryEmoji.trim(),
                description: categoryDescription.trim(),
                color: categoryColor
            })

            if (result && result.error) {
                setError(result.error)
            } else if (result) {
                setSuccess("Kategori öneriniz gönderildi! Admin onayından sonra eklenecek.")
                setCategoryTitle("")
                setCategoryEmoji("")
                setCategoryDescription("")
                router.refresh()
            }
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Form Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/30 to-orange-50/30 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <FolderPlus className="h-5 w-5 text-purple-600" />
                        Yeni Kategori Öner
                    </h2>

                    <form onSubmit={handleSubmitCategory} className="space-y-5">
                        {/* Başlık ve Emoji */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Başlık <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={categoryTitle}
                                    onChange={(e) => setCategoryTitle(e.target.value)}
                                    placeholder="Örn: En Dalgacı"
                                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    maxLength={50}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Emoji <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={categoryEmoji}
                                    onChange={handleEmojiChange}
                                    placeholder="🎉"
                                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        {/* Açıklama */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Açıklama <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={categoryDescription}
                                onChange={(e) => setCategoryDescription(e.target.value)}
                                placeholder="Örn: Sınıfın en şakacı ve dalgacı kişisi"
                                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                maxLength={100}
                            />
                        </div>

                        {/* Renk Seçimi */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Renk
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {GRADIENT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setCategoryColor(option.value)}
                                        className={`h-8 w-10 rounded-lg bg-gradient-to-r ${option.value} transition-all ${categoryColor === option.value
                                            ? 'ring-2 ring-offset-2 ring-purple-500 scale-110'
                                            : 'hover:scale-105'
                                            }`}
                                        title={option.label}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Önizleme */}
                        {categoryTitle && categoryEmoji && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 mb-2">Önizleme:</p>
                                <div className="flex items-center gap-3">
                                    <div className={`text-3xl p-2 rounded-xl bg-gradient-to-br ${categoryColor} shadow-md`}>
                                        {categoryEmoji}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{categoryTitle}</h3>
                                        <p className="text-sm text-slate-500">{categoryDescription || "Açıklama..."}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || !!success}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Gönderiliyor...</>
                            ) : success ? (
                                <><CheckCircle2 className="mr-2 h-5 w-5" />Gönderildi!</>
                            ) : (
                                <><Sparkles className="mr-2 h-5 w-5" />Öneri Gönder</>
                            )}
                        </Button>

                        <p className="text-xs text-center text-slate-500">
                            Öneriniz admin tarafından incelenecek ve uygun görülürse eklenecektir.
                        </p>
                    </form>

                    {/* Hata Mesajı */}
                    {error && (
                        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Başarı Mesajı */}
                    {success && (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span>{success}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
