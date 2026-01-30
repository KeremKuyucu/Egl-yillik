"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveFutureMeAction } from "@/app/actions/texts"
import { Loader2, Save, AlertCircle, Sparkles, Clock } from "lucide-react"
import { toast } from "sonner"

interface FutureMeFormProps {
    initialContent?: string
}

export default function FutureMeForm({ initialContent = "" }: FutureMeFormProps) {
    const [content, setContent] = useState(initialContent)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const result = await saveFutureMeAction(content)
            if (result.error) {
                setError(result.error)
                toast.error(result.error)
            } else {
                toast.success("Geleceğe notun kaydedildi!")
                router.refresh()
            }
        } catch (err) {
            setError("Bir hata oluştu")
            toast.error("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 flex gap-3 text-sm text-indigo-900 dark:text-indigo-200">
                    <Clock className="h-5 w-5 text-indigo-500 shrink-0" />
                    <p className="leading-relaxed">
                        Yazdığın notu okuyan yıllar sonraki haline ne demek istersin?
                    </p>
                </div>

                <div className="relative">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Sevgili gelecekteki ben..."
                        className="min-h-[400px] resize-y bg-white/50 dark:bg-slate-900/50 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500/20 p-6 text-lg leading-relaxed shadow-sm rounded-xl"
                    />
                    <Sparkles className="absolute top-4 right-4 h-5 w-5 text-indigo-400/50 pointer-events-none" />
                </div>

                <div className="flex justify-end items-center gap-4">
                    <span className="text-xs text-slate-400 font-medium">
                        {content.length} karakter
                    </span>
                    <Button
                        type="submit"
                        disabled={isLoading || content.trim().length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] h-12 rounded-xl shadow-lg shadow-indigo-500/20"
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
            </div>
        </form>
    )
}
