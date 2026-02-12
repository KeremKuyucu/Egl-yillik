import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ghost, ArrowRight } from "lucide-react"

type Props = {
    recipientId?: string
}

export default function AnonymousInlineCta({ recipientId }: Props) {
    const href = recipientId
        ? `/anonymous?recipientId=${encodeURIComponent(recipientId)}`
        : "/anonymous"

    return (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100/60 dark:border-indigo-900/40 bg-white/55 dark:bg-slate-900/45 backdrop-blur-xl shadow-lg ring-1 ring-white/10">
            {/* Soft gradient glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/40 dark:from-indigo-950/25 dark:via-purple-950/15 dark:to-pink-950/20" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <Ghost className="h-5 w-5 text-white" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            İstersen anonim mesaj da yazabilirsin
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            İsmin görünmez. Uygunsuz içerikler silinir.
                        </p>
                    </div>
                </div>

                <Link href={href} prefetch={false} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto gap-2">
                        Anonim yaz
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
