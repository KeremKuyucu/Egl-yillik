import VerifyDeleteView from "@/components/settings/verify-delete-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function VerifyDeletePage({
    searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
    const { token } = await searchParams

    if (!token) {
        return (
            <div className="container flex items-center justify-center py-20">
                <Card className="w-full max-w-md border-2 border-red-200 dark:border-red-900/30 shadow-xl bg-white/80 dark:bg-black/40 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl text-red-700 dark:text-red-400">Bağlantı Geçersiz</CardTitle>
                        <CardDescription>
                            Gerekli doğrulama kodu bulunamadı. İstek süresi dolmuş veya geçersiz bir bağlantı kullanılmıştır. Lütfen yeni bir istekte bulun.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 pt-4">
                        <Link href="/home" className="w-full">
                            <Button className="w-full" variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Ana Sayfaya Dön
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container flex items-center justify-center py-20">
            <VerifyDeleteView token={token} />
        </div>
    )
}
