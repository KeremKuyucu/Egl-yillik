"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, BellOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { toggleEmailReminders, getEmailPreference } from "@/app/actions/email-preferences"
import { toast } from "sonner"
import Link from "next/link"

export default function UnsubscribePage() {
    const [isOptedOut, setIsOptedOut] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            const { isOptedOut: preference } = await getEmailPreference()
            setIsOptedOut(preference)
            setIsLoading(false)

            if (preference) {
                setIsSuccess(true)
            }
        }
        checkUser()
    }, [router])

    const handleUnsubscribe = async () => {
        setIsUpdating(true)
        const res = await toggleEmailReminders(true)

        if (res.error) {
            toast.error(res.error)
        } else {
            setIsSuccess(true)
            setIsOptedOut(true)
            toast.success("E-posta listesinden başarıyla çıkıldı")
        }
        setIsUpdating(false)
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="container max-w-lg mx-auto px-4 py-12 min-h-[70vh] flex flex-col justify-center">
            <Card className="border-2 border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
                {!isSuccess ? (
                    <>
                        <CardHeader className="text-center bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-8">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                                <BellOff className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">Abonelikten Çık</CardTitle>
                            <CardDescription className="text-slate-500 mt-2">
                                Hatırlatma maillerini almak istemediğinize emin misiniz?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <p className="text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                                Bu işlemi onayladığınızda, yıllık hazırlık sürecindeki eksik yazılarınız veya anketleriniz hakkında artık otomatik e-posta almayacaksınız.
                            </p>

                            <div className="flex flex-col gap-3 pt-4">
                                <Button
                                    onClick={handleUnsubscribe}
                                    disabled={isUpdating}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg shadow-red-500/20"
                                >
                                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Listeden Çıkar Beni
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.back()}
                                    className="w-full text-slate-500 hover:text-slate-700"
                                >
                                    Vazgeç ve Geri Dön
                                </Button>
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <CardContent className="p-12 text-center space-y-6">
                        <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">İşlem Başarılı!</h2>
                            <p className="text-slate-500">E-posta listesinden başarıyla çıkarıldınız.</p>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                            Fikrinizi değiştirirseniz Ayarlar sayfasından istediğiniz zaman tekrar aktif edebilirsiniz.
                        </p>
                        <div className="pt-6">
                            <Link href="/home" passHref>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12">
                                    Panele Git
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                )}
            </Card>

            {!isSuccess && (
                <p className="text-center text-slate-400 text-sm mt-8">
                    Bu ayarı istediğiniz zaman <Link href="/settings" className="text-indigo-500 hover:underline font-medium">Ayarlar</Link> sayfasından değiştirebilirsiniz.
                </p>
            )}
        </div>
    )
}
