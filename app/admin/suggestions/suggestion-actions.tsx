"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { approveSuggestion, rejectSuggestion, deleteSuggestion } from "./actions"
import { Loader2, CheckCircle2, XCircle, Trash2, Edit, X } from "lucide-react"

interface Suggestion {
    id: string
    title: string
    emoji: string
    description: string
    color: string
    status: string
}

interface SuggestionActionsProps {
    suggestion: Suggestion
}

export default function SuggestionActions({ suggestion }: SuggestionActionsProps) {
    const [isApproving, setIsApproving] = useState(false)
    const [isRejecting, setIsRejecting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showEditForm, setShowEditForm] = useState(false)
    const [showRejectForm, setShowRejectForm] = useState(false)

    // Düzenleme alanları
    const [editTitle, setEditTitle] = useState(suggestion.title)
    const [editEmoji, setEditEmoji] = useState(suggestion.emoji)
    const [editDescription, setEditDescription] = useState(suggestion.description)

    // Red nedeni
    const [rejectNote, setRejectNote] = useState("")

    const router = useRouter()

    const handleApprove = async (edited: boolean = false) => {
        setIsApproving(true)
        try {
            const result = await approveSuggestion({
                suggestionId: suggestion.id,
                title: edited ? editTitle : suggestion.title,
                emoji: edited ? editEmoji : suggestion.emoji,
                description: edited ? editDescription : suggestion.description,
                color: suggestion.color
            })

            if (result.error) {
                alert(result.error)
            } else {
                router.refresh()
            }
        } catch (e) {
            alert("Bir hata oluştu")
        } finally {
            setIsApproving(false)
            setShowEditForm(false)
        }
    }

    const handleReject = async () => {
        setIsRejecting(true)
        try {
            const result = await rejectSuggestion(suggestion.id, rejectNote)
            if (result.error) {
                alert(result.error)
            } else {
                router.refresh()
            }
        } catch (e) {
            alert("Bir hata oluştu")
        } finally {
            setIsRejecting(false)
            setShowRejectForm(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Bu öneriyi silmek istediğinize emin misiniz?")) return

        setIsDeleting(true)
        try {
            const result = await deleteSuggestion(suggestion.id)
            if (result.error) {
                alert(result.error)
            } else {
                router.refresh()
            }
        } catch (e) {
            alert("Bir hata oluştu")
        } finally {
            setIsDeleting(false)
        }
    }

    // Düzenleme Formu
    if (showEditForm) {
        return (
            <div className="w-full sm:w-auto sm:min-w-[300px] p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm">Düzenle ve Onayla</h4>
                    <button onClick={() => setShowEditForm(false)} className="text-purple-400 hover:text-purple-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <input
                        type="text"
                        value={editEmoji}
                        onChange={(e) => setEditEmoji(e.target.value)}
                        className="col-span-1 h-9 px-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-900 text-center text-lg"
                        maxLength={4}
                    />
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="col-span-3 h-9 px-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-900 text-sm"
                        placeholder="Başlık"
                    />
                </div>
                <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-900 text-sm"
                    placeholder="Açıklama"
                />
                <Button
                    size="sm"
                    onClick={() => handleApprove(true)}
                    disabled={isApproving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Düzenleyip Onayla</>}
                </Button>
            </div>
        )
    }

    // Red Formu
    if (showRejectForm) {
        return (
            <div className="w-full sm:w-auto sm:min-w-[280px] p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-800 dark:text-red-200 text-sm">Red Nedeni (Opsiyonel)</h4>
                    <button onClick={() => setShowRejectForm(false)} className="text-red-400 hover:text-red-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <input
                    type="text"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-red-200 dark:border-red-700 bg-white dark:bg-slate-900 text-sm"
                    placeholder="Neden reddedildi? (kullanıcı görecek)"
                />
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="w-full"
                >
                    {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" /> Reddet</>}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 shrink-0">
            {/* Direkt Onayla */}
            <Button
                size="sm"
                onClick={() => handleApprove(false)}
                disabled={isApproving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Onayla</>}
            </Button>

            {/* Düzenle ve Onayla */}
            <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditForm(true)}
                className="border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400"
            >
                <Edit className="h-4 w-4" />
            </Button>

            {/* Reddet */}
            <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
            >
                <XCircle className="h-4 w-4" />
            </Button>

            {/* Sil */}
            <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    )
}
