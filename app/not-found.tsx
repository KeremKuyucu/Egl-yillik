import Link from "next/link"
import { Home, ArrowLeft, Search } from "lucide-react"
import { BackButton } from "@/components/common/BackButton"

export default function NotFound() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-[#0b1021] flex items-center justify-center px-6">

            {/* Arka plan dekoratif globlar */}
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-500/30 blur-[120px] rounded-full"></div>
            <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full"></div>

            <div className="relative w-full max-w-2xl">

                {/* 404 Kart */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-100 dark:border-indigo-500/30 shadow-2xl shadow-indigo-500/10 bg-white/70 dark:bg-white/5 backdrop-blur-md">

                    {/* Gradient layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-indigo-50/40 dark:from-[#0f172a] dark:to-[#1e1b4b]"></div>

                    <div className="relative z-10 p-10 text-center">

                        {/* 404 büyük sayı */}
                        <h1 className="font-serif text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 drop-shadow-md">
                            404
                        </h1>

                        <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
                            Bu sayfa burada değil
                        </h2>

                        <p className="mt-3 text-slate-600 dark:text-slate-400">
                            Aradığın içerik kaldırılmış, taşınmış ya da hiç var olmamış olabilir.
                        </p>

                        {/* Butonlar */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">

                            <Link
                                href="/"
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-white font-medium shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all duration-300"
                            >
                                <Home size={18} />
                                Ana Sayfa
                            </Link>

                            <BackButton />

                        </div>

                        {/* Küçük yardımcı alan */}
                        <div className="mt-10 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/10 p-4">
                            <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                <Search size={16} />
                                URL’yi kontrol etmeyi dene veya ana sayfadan devam et.
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    )
}
