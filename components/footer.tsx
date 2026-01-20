// components/footer.tsx
import React from 'react';
import Link from 'next/link';
import { Heart, Github } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="mt-20 border-t border-indigo-100/50 dark:border-indigo-900/30 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-950/50 backdrop-blur-xl">
            <div className="container mx-auto px-4 sm:px-6 py-10">
                {/* Ana İçerik */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                    {/* Sol - Logo ve Açıklama */}
                    <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-left">
                        <div className="flex items-center gap-2.5">
                            <img src="/image.png" className="h-8 w-8" alt="Logo" />
                            <div>
                                <h3 className="text-lg font-bold font-serif bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">
                                    EGL Yıllık
                                </h3>
                                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                    Class of 2026
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
                            Anılarınızı yazın, arkadaşlarınızla paylaşın. Her kelime bir hatıra.
                        </p>
                    </div>

                    {/* Sağ - Geliştirici Kartı */}
                    <Link
                        href="https://github.com/keremkuyucu"
                        target="_blank"
                        rel="noopener noreferrer"
                        prefetch={false}
                        className="group flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="text-right">
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-1">
                                Geliştirici
                            </p>
                            <p className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">
                                Kerem Kuyucu
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-110 transition-all duration-300">
                            <Github className="h-4 w-4 fill-white" suppressHydrationWarning />
                        </div>
                    </Link>
                </div>

                {/* Alt Çizgi */}
                <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Telif */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                            © 2026 EGL Yıllık. Tüm hakları saklıdır.
                        </p>

                        {/* Linkler */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <Link
                                href="https://github.com/keremkuyucu/egl-yillik"
                                target="_blank"
                                rel="noopener noreferrer"
                                prefetch={false}
                                className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Github className="h-3 w-3" suppressHydrationWarning />
                                Kaynak Kodu
                            </Link>
                            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                            <span className="flex items-center gap-1.5">
                                <Heart className="h-3 w-3 text-red-500" suppressHydrationWarning />
                                Sevgiyle Yapıldı
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;