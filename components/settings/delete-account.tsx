"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { deleteAccountPassword } from "@/app/actions/auth" // yine aynı fonksiyonu kullanıyoruz, şifre olmadan çağrılabilir hale getir

export default function DeleteAccount() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)

    const handleDelete = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await deleteAccountPassword()
            if (result?.error) throw new Error(result.error)

            toast.success("Hesabın silindi.")
            setOpen(false)
        } catch (err: any) {
            setError(err?.message || "Bir hata oluştu.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-2 border-red-200 dark:border-red-900/30 shadow-xl overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                        <Trash2 className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-red-700 dark:text-red-400">Hesabı Sil</CardTitle>
                        <CardDescription className="text-red-600/70 dark:text-red-400/70">
                            Bu işlem hesabını devre dışı bırakır (soft delete). Verilerin sistemde kalabilir.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                <AlertDialog
                    open={open}
                    onOpenChange={(val) => {
                        setOpen(val)
                        if (!val) setError(null)
                    }}
                >
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 h-11"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hesabımı Sil
                        </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                                Silmeyi Onayla
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-left">
                                Bu işlemi onaylıyor musun? Hesabın kalıcı olarak silinecek.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Hayır</AlertDialogCancel>
                            <Button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Siliniyor...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Evet, Sil
                                    </>
                                )}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}