"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toggleCategoryStatus, deleteCategory } from "./actions"
import { type SurveyCategory } from "@/lib/survey-categories"
import { Eye, EyeOff, Trash2, Loader2, Pencil } from "lucide-react"
import CategoryEditModal from "./category-edit-modal"

interface CategoryActionsProps {
    category: SurveyCategory
}

export default function CategoryActions({ category }: CategoryActionsProps) {
    const [isTogglingStatus, setIsTogglingStatus] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const router = useRouter()

    const handleToggleStatus = async () => {
        setIsTogglingStatus(true)
        try {
            await toggleCategoryStatus(category.id, !category.is_active)
            router.refresh()
        } catch (error) {
            console.error("Toggle status error:", error)
        } finally {
            setIsTogglingStatus(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteCategory(category.id)
            if (result.error) {
                alert(result.error)
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error("Delete error:", error)
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Düzenle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                {/* Aktif/Pasif Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                    className={`gap-1 ${category.is_active
                        ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    {isTogglingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : category.is_active ? (
                        <>
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs">Aktif</span>
                        </>
                    ) : (
                        <>
                            <EyeOff className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs">Pasif</span>
                        </>
                    )}
                </Button>

                {/* Sil */}
                {showDeleteConfirm ? (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-xs h-8"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                "Sil"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="text-xs h-8"
                        >
                            İptal
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Edit Modal */}
            <CategoryEditModal
                category={category}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
            />
        </>
    )
}
