"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getColorFromName, type CustomOption } from "@/lib/survey-categories"
import { submitSurveyVote, addCustomOption } from "./actions"
import { Check, Loader2, Vote, AlertCircle, Sparkles, Search, Plus, User, Star, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Profile {
    id: string
    first_name: string
    last_name: string
    class: string
    school_number: string
}

interface SurveyVoteClientProps {
    categoryId: string
    classmates: Profile[]
    customOptions: CustomOption[]
    userClass: string
    existingVoteId?: string
    existingCustomOptionId?: string
}

const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase()
}

const getFullName = (firstName: string, lastName: string) => {
    return [firstName, lastName].filter(n => n?.trim()).join(' ')
}

export default function SurveyVoteClient({
    categoryId,
    classmates,
    customOptions: initialCustomOptions,
    userClass,
    existingVoteId,
    existingCustomOptionId
}: SurveyVoteClientProps) {
    // Seçim tipi: 'person' veya 'custom'
    const [selectionType, setSelectionType] = useState<'person' | 'custom'>(
        existingCustomOptionId ? 'custom' : 'person'
    )
    const [selectedPersonId, setSelectedPersonId] = useState(existingVoteId || "")
    const [selectedCustomOptionId, setSelectedCustomOptionId] = useState(existingCustomOptionId || "")
    const [customOptions, setCustomOptions] = useState<CustomOption[]>(initialCustomOptions)

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Yeni seçenek ekleme
    const [showAddOption, setShowAddOption] = useState(false)
    const [newOptionText, setNewOptionText] = useState("")
    const [isAddingOption, setIsAddingOption] = useState(false)

    // Collapse state
    const [showCustomOptions, setShowCustomOptions] = useState(customOptions.length > 0 || existingCustomOptionId ? true : false)

    const router = useRouter()

    const filteredClassmates = classmates.filter(p =>
        getFullName(p.first_name, p.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.school_number.includes(searchQuery)
    )

    const handleSelectPerson = (id: string) => {
        setSelectionType('person')
        setSelectedPersonId(id)
        setSelectedCustomOptionId("")
    }

    const handleSelectCustomOption = (id: string) => {
        setSelectionType('custom')
        setSelectedCustomOptionId(id)
        setSelectedPersonId("")
    }

    const handleAddCustomOption = async () => {
        if (!newOptionText.trim()) {
            setError("Seçenek metni boş olamaz")
            return
        }

        if (newOptionText.trim().length < 3) {
            setError("Seçenek en az 3 karakter olmalı")
            return
        }

        if (newOptionText.trim().length > 100) {
            setError("Seçenek en fazla 100 karakter olabilir")
            return
        }

        setIsAddingOption(true)
        setError(null)

        try {
            const result = await addCustomOption(categoryId, newOptionText.trim())
            if (result.error) {
                setError(result.error)
                setIsAddingOption(false)
                return
            }

            // Yeni seçeneği listeye ekle ve seç
            if (result.option) {
                setCustomOptions(prev => [...prev, result.option as CustomOption])
                setSelectionType('custom')
                setSelectedCustomOptionId(result.option.id)
                setSelectedPersonId("")
            }

            setNewOptionText("")
            setShowAddOption(false)
        } catch {
            setError("Seçenek eklenirken hata oluştu")
        } finally {
            setIsAddingOption(false)
        }
    }

    const handleSubmit = async () => {
        if (selectionType === 'person' && !selectedPersonId) {
            setError("Lütfen bir kişi seçin")
            return
        }
        if (selectionType === 'custom' && !selectedCustomOptionId) {
            setError("Lütfen bir seçenek seçin")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const result = await submitSurveyVote(
                categoryId,
                selectionType === 'person' ? selectedPersonId : null,
                selectionType === 'custom' ? selectedCustomOptionId : null
            )
            if (result.error) {
                setError(result.error)
                setIsLoading(false)
                return
            }
            setSuccess(true)
            setTimeout(() => { router.push("/surveys"); router.refresh() }, 1500)
        } catch {
            setError("Bir hata oluştu")
            setIsLoading(false)
        }
    }

    if (success) return (
        <div className="max-w-2xl mx-auto">
            <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-8 text-center animate-in fade-in zoom-in">
                <Sparkles className="h-8 w-8 mx-auto mb-4 text-emerald-600" />
                <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Oyun Kaydedildi! 🎉</h2>
                <p className="text-emerald-600 dark:text-emerald-400">Anketlere yönlendiriliyorsun...</p>
            </div>
        </div>
    )

    const PersonCard = ({ profile }: { profile: Profile }) => (
        <button
            key={profile.id}
            onClick={() => handleSelectPerson(profile.id)}
            className={cn(
                "relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left group",
                selectionType === 'person' && selectedPersonId === profile.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-lg"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-300 hover:shadow-md"
            )}
        >
            <Link href={`/profile/${profile.school_number}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${getColorFromName(profile.first_name)} hover:ring-2 hover:ring-purple-400 transition-all`}>
                    {getInitials(profile.first_name, profile.last_name)}
                </div>
            </Link>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {getFullName(profile.first_name, profile.last_name)}
                </p>
                <p className="text-xs text-slate-500">#{profile.school_number}</p>
            </div>
            {selectionType === 'person' && selectedPersonId === profile.id && (
                <div className="absolute top-2 right-2 p-1 bg-purple-500 rounded-full text-white">
                    <Check className="h-3 w-3" />
                </div>
            )}
        </button>
    )

    const CustomOptionCard = ({ option }: { option: CustomOption }) => (
        <button
            key={option.id}
            onClick={() => handleSelectCustomOption(option.id)}
            className={cn(
                "relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left group",
                selectionType === 'custom' && selectedCustomOptionId === option.id
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/20 shadow-lg"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-amber-300 hover:shadow-md"
            )}
        >
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-sm">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {option.option_text}
                </p>
                <p className="text-xs text-slate-500">
                    {option.vote_count} oy
                    {option.creator && ` • ${(option.creator as { first_name: string }).first_name} tarafından eklendi`}
                </p>
            </div>
            {selectionType === 'custom' && selectedCustomOptionId === option.id && (
                <div className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full text-white">
                    <Check className="h-3 w-3" />
                </div>
            )}
        </button>
    )

    const hasSelection = (selectionType === 'person' && selectedPersonId) || (selectionType === 'custom' && selectedCustomOptionId)
    const isChangingVote = existingVoteId || existingCustomOptionId

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {isChangingVote && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Daha Önce Oy Verdiniz</h4>
                        <p className="text-xs text-amber-600/90 mt-1">Oyunuzu değiştirebilirsiniz.</p>
                    </div>
                </div>
            )}

            {/* Arama */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="İsim veya okul numarası ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
            </div>

            {/* Sınıf Arkadaşları */}
            {filteredClassmates.length > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <User className="h-4 w-4 text-purple-500" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {userClass} sınıfından {filteredClassmates.length} kişi
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredClassmates.map(p => <PersonCard key={p.id} profile={p} />)}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Kişi bulunamadı</p>
                    <p className="text-sm mt-1">Arama kriterlerinizi değiştirin</p>
                </div>
            )}

            {/* Özel Seçenekler Bölümü */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <button
                    onClick={() => setShowCustomOptions(!showCustomOptions)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg text-white">
                            <Star className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-900 dark:text-white">Özel Seçenekler</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {customOptions.length > 0
                                    ? `${customOptions.length} özel seçenek mevcut`
                                    : "Kendi seçeneğini ekle!"}
                            </p>
                        </div>
                    </div>
                    {showCustomOptions ? (
                        <ChevronUp className="h-5 w-5 text-amber-600" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-amber-600" />
                    )}
                </button>

                {showCustomOptions && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Mevcut Özel Seçenekler */}
                        {customOptions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {customOptions.map(option => (
                                    <CustomOptionCard key={option.id} option={option} />
                                ))}
                            </div>
                        )}

                        {/* Yeni Seçenek Ekleme */}
                        {showAddOption ? (
                            <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Yeni Seçenek Ekle
                                </p>
                                <input
                                    type="text"
                                    placeholder="Örn: En çok selfie çeken, Hep geç kalan..."
                                    value={newOptionText}
                                    onChange={(e) => setNewOptionText(e.target.value)}
                                    maxLength={100}
                                    className="w-full h-12 px-4 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleAddCustomOption}
                                        disabled={isAddingOption || !newOptionText.trim()}
                                        className="flex-1 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                    >
                                        {isAddingOption ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Ekleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Ekle ve Seç
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setShowAddOption(false); setNewOptionText("") }}
                                        className="h-10"
                                    >
                                        İptal
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Bu seçenek sadece {userClass} sınıfı arkadaşların tarafından görülecek.
                                </p>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setShowAddOption(true)}
                                className="w-full h-12 border-dashed border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Yeni Seçenek Ekle
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Hata Mesajı */}
            {error && (
                <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <div className="sticky bottom-4 pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !hasSelection}
                    className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl disabled:opacity-50 transition-all"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Kaydediliyor...
                        </>
                    ) : (
                        <>
                            <Vote className="mr-2 h-5 w-5" />
                            {isChangingVote ? "Oyumu Güncelle" : "Oyumu Kaydet"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
