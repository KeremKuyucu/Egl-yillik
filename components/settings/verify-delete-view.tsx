"use client"

import { useState } from "react"
import { deleteAccount } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function VerifyDeleteView({ token }: { token: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const handleConfirm = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await deleteAccount(token)
            if (result.error) {
                throw new Error(result.error)
            }
            setSuccess(true)
        } catch (e: any) {
            setError(e.message || "Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md border-2 border-green-200 dark:border-green-900/30 animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl text-green-700 dark:text-green-400">Hesap Silindi</CardTitle>
                    <CardDescription>
                        Hesabınız ve tüm verileriniz başarıyla silindi.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-4">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        Sizi tekrar aramızda görmeyi umuyoruz.
                    </p>
                    <Link href="/login" className="w-full">
                        <Button className="w-full" variant="outline">Giriş Sayfasına Dön</Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md border-2 border-red-200 dark:border-red-900/30 shadow-xl">
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-red-700 dark:text-red-400">Son Onay</CardTitle>
                <CardDescription>
                    Hesabınızı kalıcı olarak silmek üzeresiniz. Bu işlem <strong>geri alınamaz</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Siliniyor...
                        </>
                    ) : (
                        <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Evet, Hesabımı Sil
                        </>
                    )}
                </Button>

                <Link href="/settings" className="block">
                    <Button variant="ghost" className="w-full" disabled={isLoading}>
                        Vazgeç ve Geri Dön
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
