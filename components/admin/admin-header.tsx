import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Sparkles, LayoutDashboard, LogOut } from "lucide-react"
import { getLevelInfo } from "@/lib/constants"
import { ModeToggle } from "@/components/mode-toggle"

interface AdminHeaderProps {
    currentProfile: any
    signOut?: () => Promise<void>
}

export default function AdminHeader({ currentProfile, signOut }: AdminHeaderProps) {
    return (
        <header className="border-b border-indigo-100/50 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-900/20">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent font-serif leading-none">
                            {currentProfile ? `${getLevelInfo(currentProfile.level).label} Paneli` : "Yönetim Paneli"}
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                            Merkezi Yönetim
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/dashboard" prefetch={false}>
                        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="hidden sm:inline">Öğrenci Görünümü</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="sm:hidden">
                            <LayoutDashboard className="h-4 w-4" />
                        </Button>
                    </Link>

                    <ModeToggle />

                    {signOut && (
                        <form action={signOut}>
                            <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </header>
    )
}
