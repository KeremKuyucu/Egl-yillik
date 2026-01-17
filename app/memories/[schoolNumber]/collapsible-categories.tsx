"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CategoryItem {
    category: {
        id: string
        title: string
        emoji: string
        color: string
    }
    count: number
}

interface CollapsibleCategoriesProps {
    categories: CategoryItem[]
}

export default function CollapsibleCategories({ categories }: CollapsibleCategoriesProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tüm Kategoriler ({categories.length})
                </span>
                {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
            </button>

            {isOpen && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {categories.map((item) => (
                        <div
                            key={item.category.id}
                            className={`relative rounded-xl p-3 border transition-all ${item.count > 0
                                ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{item.category.emoji}</span>
                                {item.count > 0 && (
                                    <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold">
                                        {item.count}
                                    </span>
                                )}
                            </div>
                            <p className={`text-xs font-medium truncate ${item.count > 0
                                ? 'text-purple-700 dark:text-purple-300'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                {item.category.title}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
