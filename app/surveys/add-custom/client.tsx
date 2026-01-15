"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type SurveyCategory } from "@/lib/survey-categories"
import { addCustomOption } from "./actions"
import { Loader2, CheckCircle2, Send } from "lucide-react"

interface AddCustomOptionFormProps {
    categories: SurveyCategory[]
    userClass: string
}

export default function AddCustomOptionForm({ categories, userClass }: AddCustomOptionFormProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [optionName, setOptionName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (!selectedCategory) {
            setError("Lütfen bir kategori seçin")
            return
        }
        if (!optionName.trim()) {
            setError("Lütfen bir isim girin")
            return
        }
        if (optionName.trim().length < 2) {
            setError("İsim en az 2 karakter olmalı")
            return
        }

        setIsLoading(true)

        try {
            const result = await addCustomOption({
                categoryId: selectedCategory,
                optionName: optionName.trim(),
                classFilter: userClass
            })

            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                setOptionName("")
                // 2 saniye sonra ilgili kategoriye yönlendir
                setTimeout(() => {
                    router.push(`/surveys/${selectedCategory}`)
                }, 1500)
            }
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kategori Seçimi */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Kategori Seç <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedCategory(category.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${selectedCategory === category.id
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{category.emoji}</span>
                                <span className={`text-sm font-medium truncate ${selectedCategory === category.id
                                        ? 'text-purple-700 dark:text-purple-300'
                                        : 'text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {category.title}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* İsim Girişi */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Kişi İsmi <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={optionName}
                    onChange={(e) => setOptionName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1.5">
                    Sınıfınıza: <span className="font-medium text-purple-600 dark:text-purple-400">{userClass}</span> için eklenecek
                </p>
            </div>

            {/* Hata Mesajı */}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Başarı Mesajı */}
            {success && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Seçenek başarıyla eklendi! Yönlendiriliyorsunuz...</span>
                </div>
            )}

            {/* Gönder Butonu */}
            <Button
                type="submit"
                disabled={isLoading || success}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Ekleniyor...
                    </>
                ) : success ? (
                    <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Eklendi!
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-5 w-5" />
                        Seçenek Ekle
                    </>
                )}
            </Button>
        </form>
    )
}
