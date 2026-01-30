"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyRound, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Mail } from "lucide-react"
import { toast } from "sonner"
export default function ChangePassword({ isGoogleUser }: { isGoogleUser?: boolean }) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isLinkSent, setIsLinkSent] = useState(false)

    const supabase = createClient()

    const handleResetLink = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser
            if (!user?.email) throw new Error("Email adresi bulunamadı.")

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
            })

            if (resetError) throw resetError
            setIsLinkSent(true)
            toast.success("Şifre sıfırlama bağlantısı gönderildi.")
        } catch (err: any) {
            setError(err.message || "Bağlantı gönderilirken bir hata oluştu.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
        // Client-side Supabase client üzerinden kullanıcıyı doğrula
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user?.email) {
            throw new Error("Kullanıcı oturumu doğrulanamadı. Lütfen tekrar giriş yapın.")
        }

        // Mevcut şifre ile re-authentication (Güvenlik katmanı)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        })

        if (signInError) throw new Error("Mevcut şifreniz yanlış.")

        // Şifre güncelleme
        const { error: updateError } = await supabase.auth.updateUser({ 
            password: newPassword 
        })

        if (updateError) throw updateError

        setIsSuccess(true)
        toast.success("Şifreniz başarıyla güncellendi.")
    } catch (err: any) {
        setError(err.message)
    } finally {
        setIsLoading(false)
    }
}

    if (isGoogleUser) {
        return (
            <Card className="border-2 border-indigo-100 dark:border-indigo-900/20 shadow-xl overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Şifre Belirle</CardTitle>
                            <CardDescription>Hesabında tanımlı bir şifre bulunmuyor. Şifre belirlemek için e-posta gönder.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                    {isLinkSent ? (
                        <div className="space-y-4 animate-in fade-in zoom-in-95">
                            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-blue-800 dark:text-blue-400">Bağlantı Gönderildi</h3>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                    E-posta adresini kontrol et. Gelen bağlantıya tıklayarak yeni şifreni belirleyebilirsin.
                                    <br />
                                    <span className="text-[10px] text-amber-600 font-medium italic mt-2 block italic">
                                        * Mail gelmediyse spam klasörünü de kontrol etmeyi unutma.
                                    </span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-sm text-indigo-700 dark:text-indigo-300">
                                Şifre belirleyerek e-posta ve şifrenle de giriş yapabilirsin.
                            </div>
                            <Button
                                onClick={handleResetLink}
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-lg shadow-indigo-500/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2 h-4 w-4" />}
                                Şifre Sıfırlama E-postası Gönder
                            </Button>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </CardContent>
            </Card>
        )
    }

    if (isSuccess) {
        return (
            <Card className="border-2 border-green-100 dark:border-green-900/30 shadow-xl bg-green-50/10 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <ShieldCheck className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-400">Şifre Değiştirildi</h3>
                        <p className="text-sm text-slate-500">Hesabınızın güvenliği için yeni şifreniz başarıyla kaydedildi.</p>
                    </div>
                    <Button
                        onClick={() => setIsSuccess(false)}
                        variant="outline"
                        className="mt-4 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30"
                    >
                        Yeniden Değiştir
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-2 border-indigo-100 dark:border-indigo-900/20 shadow-xl overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-slate-900/50">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Şifremi Değiştir</CardTitle>
                        <CardDescription>Hesap güvenliğin için güçlü bir şifre seç.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Mevcut Şifre</Label>
                        <Input
                            id="current-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-white/50 dark:bg-slate-900/50"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Yeni Şifre</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-white/50 dark:bg-slate-900/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Yeni Şifre (Tekrar)</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-white/50 dark:bg-slate-900/50"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg border-0 h-11"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Güncelleniyor...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Şifremi Güncelle
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
