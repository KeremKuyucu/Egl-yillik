"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RotateCcw, AlertTriangle } from "lucide-react"
import { logClientError } from "@/app/actions/error-log"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Global hata:", error)
        logClientError({
            message: error.message,
            digest: error.digest,
            stack: error.stack,
            source: "global",
            url: window.location.href,
            user_agent: navigator.userAgent,
        })
    }, [error])

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1021] flex items-center justify-center px-6">

            {/* Arka plan dekoratif globlar */}
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-red-500/20 blur-[120px] rounded-full"></div>
            <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full"></div>

            <div className="relative w-full max-w-2xl">

                {/* Hata Kartı */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-red-100 dark:border-red-500/30 shadow-2xl shadow-red-500/10 bg-white/70 dark:bg-white/5 backdrop-blur-md">

                    {/* Gradient layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-red-50/40 dark:from-[#0f172a] dark:to-[#1e1020]"></div>

                    <div className="relative z-10 p-10 text-center">

                        {/* İkon */}
                        <div className="flex justify-center mb-6">
                            <div className="p-5 rounded-2xl bg-red-500/10 dark:bg-red-500/20 backdrop-blur-md border border-red-200 dark:border-red-500/30 shadow-lg shadow-red-500/10">
                                <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400" strokeWidth={1.5} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                            Bir şeyler ters gitti
                        </h2>

                        <p className="mt-3 text-slate-600 dark:text-slate-400">
                            Beklenmeyen bir hata oluştu. Tekrar deneyebilir veya ana sayfaya dönebilirsin.
                        </p>

                        {/* Hata detayı */}
                        {error.digest && (
                            <div className="mt-4 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-red-100 dark:border-red-500/20 px-4 py-2 inline-block">
                                <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                                    Hata kodu: {error.digest}
                                </span>
                            </div>
                        )}

                        {/* Butonlar */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">

                            <button
                                onClick={reset}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-white font-medium shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                            >
                                <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
                                Tekrar Dene
                            </button>

                            <Link
                                href="/home"
                                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 px-6 py-3 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:scale-105 transition-all duration-300"
                            >
                                <Home size={18} />
                                Ana Sayfa
                            </Link>

                        </div>

                        {/* Yardımcı alan */}
                        <div className="mt-10 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/10 p-4">
                            <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                <AlertTriangle size={16} />
                                Sorun devam ederse yöneticiye bildir.
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    )
}
