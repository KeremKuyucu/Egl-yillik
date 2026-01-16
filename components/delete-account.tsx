"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2, Loader2, AlertTriangle, ShieldX } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function DeleteAccount() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDeleteAccount = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Oturum bulunamadı.")

            // Hesabı silme işlemi
            // Not: Supabase client üzerinden bir kullanıcının kendisini silmesi zordur 
            // (Genelde bir RPC veya Admin API gerekir). Ancak user istediği için auth.user silme mantığını ekliyoruz.
            // Gerçek dünyada bu genellikle bir edge function veya admin yetkili server action üzerinden yapılır.

            const { error } = await supabase.rpc('delete_user_self')

            if (error) {
                // Eğer RPC yoksa alternatif (basitçe çıkış yaptırıp yönlendirebiliriz 
                // ama veritabanından silinmez. Kullanıcının talebi veriyi silmek olduğu için hata dönüyoruz.)
                throw error
            }

            await supabase.auth.signOut()
            toast.success("Hesabınız ve tüm verileriniz başarıyla silindi.")
            router.push("/login")
        } catch (err: any) {
            toast.error("Hesap silinirken bir hata oluştu: " + (err.message || "Bilinmiyor"))
            console.error("Delete Error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-2 border-red-100 dark:border-red-900/30 bg-red-50/5 dark:bg-red-950/5 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-transparent border-b border-red-100/50 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-600 dark:text-red-400">
                        <Trash2 className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-red-700 dark:text-red-400">Hesabı Sil</CardTitle>
                        <CardDescription className="text-red-600/60 dark:text-red-400/60">Bu işlem geri alınamaz ve tüm verilerin silinir.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 mb-6">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 shrink-0">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                        <p className="font-bold mb-1">Dikkat!</p>
                        <p>Hesabını sildiğinde yazdığın tüm anılar, verdiğin oylar ve profil bilgilerin kalıcı olarak temizlenecektir.</p>
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full h-11 font-bold shadow-lg shadow-red-500/20">
                            <ShieldX className="mr-2 h-4 w-4" />
                            Hesabımı Kalıcı Olarak Sil
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-red-500/20">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-red-600">Emin misin?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base space-y-3">
                                <p>Bu işlem <span className="font-black text-red-600 underline">GERİ ALINAMAZ</span>.</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                    Hesabınızı sildiğinizde; yazdığınız <strong>tüm anılar</strong> ve başkaları tarafından size yazılmış olan <strong>tüm anılar</strong> kalıcı olarak silinecektir.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="font-bold">Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Evet, Hesabımı Sil"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
