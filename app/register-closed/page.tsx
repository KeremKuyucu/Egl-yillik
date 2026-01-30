import { Button } from "@/components/ui/button"
import { Card, CardTitle, CardDescription, CardHeader, CardContent } from "@/components/ui/card"
import { Lock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import LogoutButton from "./logout-button"

export default async function RegisterClosedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
            <div className="w-full max-w-md">
                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardHeader className="space-y-3 text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Kayıt Dönemi Sona Erdi
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                            Bu dönem için yeni profil oluşturma işlemleri kapatılmıştır.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 px-6 space-y-4">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 text-center">
                            Eğer bir yanlışlık olduğunu düşünüyorsanız lütfen okul yönetimi ile iletişime geçiniz.
                        </div>

                        {user ? (
                            <LogoutButton />
                        ) : (
                            <Link href="/login" prefetch={false} className="block">
                                <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0">
                                    Giriş Yap
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
