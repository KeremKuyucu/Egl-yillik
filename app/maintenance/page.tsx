import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Construction, Lock } from "lucide-react"

export default function MaintenancePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-950">
            <div className="relative mb-8">
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-200 opacity-75 dark:bg-amber-900"></div>
                <div className="relative rounded-full bg-amber-100 p-8 dark:bg-amber-900/30">
                    <Construction className="h-16 w-16 text-amber-600 dark:text-amber-500" />
                </div>
            </div>

            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
                Bakım Modu
            </h1>

            <p className="mb-8 max-w-md text-lg text-slate-600 dark:text-slate-400">
                Sistem şu anda güncellemeler nedeniyle geçici olarak kapalıdır.
                Lütfen daha sonra tekrar deneyiniz.
            </p>

            <div className="flex gap-4">
                <Link href="/login">
                    <Button variant="outline" className="gap-2">
                        <Lock className="h-4 w-4" />
                        Yönetici Girişi
                    </Button>
                </Link>
            </div>
        </div>
    )
}
