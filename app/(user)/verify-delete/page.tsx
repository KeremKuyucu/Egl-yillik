import VerifyDeleteView from "@/components/settings/verify-delete-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function VerifyDeletePage({
    searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
    const { token } = await searchParams

    if (!token) {
        return (
            <div className="flex flex-1 w-full flex-col items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md border-2 border-red-200 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-black/40 dark:border-red-900/30">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
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
        <div className="flex flex-1 w-full flex-col items-center justify-center px-4 py-12">
            <VerifyDeleteView token={token} />
        </div>
    )
}
