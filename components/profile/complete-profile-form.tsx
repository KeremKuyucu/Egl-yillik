"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { UserCheck, Loader2, AlertCircle, LogOut, GraduationCap } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { completeProfile } from "@/app/actions/profile"
import { CLASSES } from "@/lib/constants"

interface CompleteProfileFormProps {
    initialData: {
        firstName: string
        lastName: string
        schoolNumber: string
        classRoom: string
    }
}

export default function CompleteProfileForm({ initialData }: CompleteProfileFormProps) {
    const [firstName, setFirstName] = useState(initialData.firstName)
    const [lastName, setLastName] = useState(initialData.lastName)
    const [schoolNumber, setSchoolNumber] = useState(initialData.schoolNumber)
    const [classRoom, setClassRoom] = useState(initialData.classRoom)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const result = await completeProfile({
                firstName,
                lastName,
                schoolNumber,
                classRoom,
            })

            if (result.error) {
                setError(result.error)
                setIsLoading(false)
                return
            }

            toast.success("Profiliniz başarıyla oluşturuldu!")
            router.push("/home")
            router.refresh()
        } catch {
            setError("Bir hata oluştu.")
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success("Çıkış yapıldı")
        router.push("/login")
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
            <div className="w-full max-w-md">
                {/* Logout Button */}
                <div className="flex justify-end mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                    </Button>
                </div>

                <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardHeader className="space-y-3 text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Profilini Tamamla
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                            Devam etmeden önce okul bilgilerini eklemelisin
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 px-6">
                        <form onSubmit={handleComplete}>
                            <div className="flex flex-col gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">Ad</Label>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        placeholder="Adınız"
                                        required
                                        className="h-10 bg-white/50 dark:bg-slate-950/50"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Soyad</Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Soyadınız"
                                        required
                                        className="h-10 bg-white/50 dark:bg-slate-950/50"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="schoolNumber">Okul No</Label>
                                    <Input
                                        id="schoolNumber"
                                        type="text"
                                        placeholder="123"
                                        required
                                        maxLength={3}
                                        className="h-10 bg-white/50 dark:bg-slate-950/50"
                                        value={schoolNumber}
                                        onChange={(e) => setSchoolNumber(e.target.value.replace(/\D/g, ""))}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="class">Sınıf</Label>
                                    <Select value={classRoom} onValueChange={setClassRoom}>
                                        <SelectTrigger className="h-10 bg-white/50 dark:bg-slate-950/50">
                                            <SelectValue placeholder="Sınıfınızı seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CLASSES.map((cls) => (
                                                <SelectItem key={cls} value={cls}>
                                                    {cls.replace("12", "12-")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-11 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 border-0"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Profilimi Tamamla
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>

                    <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4 justify-center">
                        <p className="text-xs text-center text-muted-foreground">
                            Bilgilerin mezuniyet yıllığında görünecektir.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
