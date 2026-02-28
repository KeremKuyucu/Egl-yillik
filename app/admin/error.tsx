"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RotateCcw, ShieldAlert } from "lucide-react"
import { logClientError } from "@/app/actions/error-log"

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Admin sayfa hatası:", error)
        logClientError({
            message: error.message,
            digest: error.digest,
            stack: error.stack,
            source: "admin",
            url: window.location.href,
            user_agent: navigator.userAgent,
        })
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] py-16">
            <div className="w-full max-w-xl">

                {/* Hata Kartı */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-red-100 dark:border-red-500/30 shadow-2xl shadow-red-500/10 bg-white/70 dark:bg-white/5 backdrop-blur-md">

                    {/* Gradient layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-red-50/40 dark:from-[#0f172a] dark:to-[#1e1020]"></div>

                    {/* Dekoratif glob */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-red-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="relative z-10 p-10 text-center">

                        {/* İkon - Admin spesifik */}
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-2xl bg-red-500/10 dark:bg-red-500/20 backdrop-blur-md border border-red-200 dark:border-red-500/30 shadow-lg shadow-red-500/10">
                                <ShieldAlert className="h-10 w-10 text-red-500 dark:text-red-400" strokeWidth={1.5} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                            Panel Hatası
                        </h2>

                        <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                            Admin panelinde beklenmeyen bir hata oluştu. İşlemlerin etkilenmemiş olması gerekiyor.
                        </p>

                        {error.digest && (
                            <div className="mt-4 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-red-100 dark:border-red-500/20 px-4 py-2 inline-block">
                                <span className="text-xs text-slate-500 font-mono">
                                    Referans: {error.digest}
                                </span>
                            </div>
                        )}

                        {/* Hata mesajı (admin görebilir) */}
                        {error.message && (
                            <div className="mt-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 text-left">
                                <p className="text-xs text-slate-500 dark:text-slate-500 font-mono break-all">
                                    {error.message}
                                </p>
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
                                href="/admin"
                                className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 px-6 py-3 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:scale-105 transition-all duration-300"
                            >
                                <Home size={18} />
                                Admin Panel
                            </Link>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
