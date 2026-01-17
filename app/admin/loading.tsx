export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col items-center justify-center">
            <div className="relative">
                <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-slate-800 dark:border-slate-200 animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold text-slate-800 dark:text-slate-200 animate-pulse">
                    ADMIN
                </div>
            </div>
            <p className="mt-4 text-slate-500 font-medium animate-pulse">Panel Yükleniyor...</p>
        </div>
    )
}
