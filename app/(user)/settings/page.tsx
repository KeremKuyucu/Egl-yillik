"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Loader2, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"
import ChangePassword from "@/components/change-password"
import DeleteAccount from "@/components/delete-account"
import { Badge } from "@/components/ui/badge"
import { Mail } from "lucide-react"

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [userObj, setUserObj] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
            } else {
                setUserObj(user)
                setIsLoading(false)
            }
        }
        checkUser()
    }, [router, supabase])

    const isLinkedToGoogle = userObj?.identities?.some((i: any) => i.provider === "google")
    const hasPassword = userObj?.identities?.some((i: any) => i.provider === "email")

    if (!mounted || isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">

            {/* Header/Action Bar */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-indigo-100 dark:border-indigo-900/50">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hesap Ayarları</h1>
            </div>

            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Güvenlik</h2>
                        {isLinkedToGoogle && (
                            <Badge className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900 border-2 gap-1.5 shadow-sm">
                                <img src="https://www.google.com/favicon.ico" className="w-3 h-3" alt="Google" />
                                Google ile Bağlı
                            </Badge>
                        )}
                    </div>
                    <p className="text-slate-500 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {userObj?.email}
                    </p>
                </div>

                <ChangePassword isGoogleUser={!hasPassword} />

                <DeleteAccount />

                <Card className="border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <KeyRound className="h-3.5 w-3.5" />
                            İpucu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Güvenliğin için şifrenin en az 8 karakterden oluşmasını, büyük-küçük harf, rakam ve özel karakter içermesini öneririz. Şifreni değiştirdikten sonra tüm aktif oturumların devam edecektir.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
