import type React from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20 p-4">
            {/* Background - Mobile Optimized */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-10 -left-10 w-64 h-64 sm:w-96 sm:h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 sm:w-96 sm:h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl sm:blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-3 mb-8 text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img
                            src="/image.png"
                            alt="EGL Logo"
                            className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-xl"
                        />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            EGL Yıllık
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            2026 Mezuniyeti
                        </p>
                    </div>
                </div>

                {children}
            </div>
        </div>
    )
}
