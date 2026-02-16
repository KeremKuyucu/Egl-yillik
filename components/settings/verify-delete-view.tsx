"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { deleteAccount, getDeleteAccountPreview } from "@/app/actions/auth"

type Preview = {
    id: string
    email: string | null
    profile: {
        first_name: string
        last_name: string
        school_number: string
        class: string
        user_year: number
    } | null
}

export default function VerifyDeleteView({ token }: { token: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const [preview, setPreview] = useState<Preview | null>(null)
    const [previewLoading, setPreviewLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

            ; (async () => {
                setPreviewLoading(true)
                const res = await getDeleteAccountPreview(token)
                if (cancelled) return

                if ("error" in res && res.error) {
                    setError(res.error)
                    setPreview(null)
                } else {
                    // @ts-ignore
                    setPreview(res.account)
                }
                setPreviewLoading(false)
            })()

        return () => { cancelled = true }
    }, [token])

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
                {!error && <div className="rounded-md border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 p-3 text-sm">
                    {previewLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Hesap bilgileri yükleniyor...
                        </div>
                    ) : preview ? (
                        <div className="space-y-1">
                            <div className="font-medium text-red-700 dark:text-red-300">Silinecek hesap</div>
                            <div><b>Email:</b> {preview.email ?? "—"}</div>
                            <div><b>ID:</b> <span className="font-mono text-xs">{preview.id}</span></div>
                            {preview.profile && (
                                <>
                                    <div><b>Ad Soyad:</b> {preview.profile.first_name} {preview.profile.last_name}</div>
                                    <div><b>No:</b> {preview.profile.school_number}</div>
                                    <div><b>Sınıf:</b> {preview.profile.class}</div>
                                    <div><b>Yıl:</b> {preview.profile.user_year}</div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-red-600">Hesap bilgileri alınamadı.</div>
                    )}
                </div>}
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                {!error && <Button
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
                </Button>}

                <Link href="/settings" className="block">
                    <Button variant="ghost" className="w-full" disabled={isLoading}>
                        Vazgeç ve Geri Dön
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
