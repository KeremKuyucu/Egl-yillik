"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { updateCategory } from "./actions"
import { type SurveyCategory } from "@/lib/survey-categories"
import { X, Save, Loader2, Trash2, AlertTriangle, Vote } from "lucide-react"

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

interface CategoryEditModalProps {
    category: SurveyCategory
    isOpen: boolean
    onClose: () => void
}

export default function CategoryEditModal({ category, isOpen, onClose }: CategoryEditModalProps) {
    const [formData, setFormData] = useState({
        title: category.title,
        emoji: category.emoji,
        description: category.description,
        color: category.color,
        sort_order: category.sort_order || 0
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    // Client-side mounting check for portal
    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // ESC tuşu ile kapatma
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    // Form data ve oy sayısını güncelle
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: category.title,
                emoji: category.emoji,
                description: category.description,
                color: category.color,
                sort_order: category.sort_order || 0
            })
            setError(null)
            setSuccess(null)
        }
    }, [category, isOpen])

    if (!isOpen || !mounted) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

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
            const result = await updateCategory(category.id, formData)
            if (result.error) {
                setError(result.error)
            } else {
                router.refresh()
                onClose()
            }
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{formData.emoji}</span>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Kategori Düzenle
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* ID (read-only) */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            ID (değiştirilemez)
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400 font-mono">
                            {category.id}
                        </div>
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
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>

                    {/* Açıklama */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Açıklama <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
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
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 mb-2">Önizleme:</p>
                        <div className="flex items-center gap-3">
                            <div className={`text-3xl p-2 rounded-xl bg-gradient-to-br ${formData.color} shadow-md`}>
                                {formData.emoji}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{formData.title}</h3>
                                <p className="text-sm text-slate-500">{formData.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Hata */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Başarı */}
                    {success && (
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
                            {success}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Kaydet
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )

    // Portal kullanarak body'e render et
    return createPortal(modalContent, document.body)
}
