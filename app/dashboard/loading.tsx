import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse">
                        <img src="/image.png" className="h-10 w-10" alt="Logo" />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Yükleniyor...</span>
                </div>
            </div>
        </div>
    )
}
