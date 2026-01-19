"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { UserCheck, Loader2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CompleteProfilePage() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [schoolNumber, setSchoolNumber] = useState("")
    const [classRoom, setClassRoom] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return;
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // Metadata'dan isim çekmeyi dene (Google Login vb. için)
            const metadata = user.user_metadata
            if (metadata) {
                if (metadata.full_name) {
                    const names = metadata.full_name.split(' ')
                    setFirstName(metadata.given_name || names[0] || "")
                    setLastName(metadata.family_name || names.slice(1).join(' ') || "")
                } else {
                    setFirstName(metadata.first_name || "")
                    setLastName(metadata.last_name || "")
                }

                // Okul no ve sınıfı da çek (Normal kayıt sonrası gelenler için)
                if (metadata.school_number) setSchoolNumber(metadata.school_number)
                if (metadata.class) setClassRoom(metadata.class)
            }

            // Zaten profili var mı kontrol et
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", user.id)
                .single()

            if (profile) {
                router.push("/dashboard")
            } else {
                setIsFetching(false)
            }
        }

        fetchUserData()
    }, [router, supabase, mounted])

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (schoolNumber.length !== 3 || !/^\d{3}$/.test(schoolNumber)) {
            setError("Okul numarası 3 haneli olmalı.")
            setIsLoading(false)
            return
        }

        if (!classRoom) {
            setError("Lütfen sınıfınızı seçin.")
            setIsLoading(false)
            return
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Oturum bulunamadı.")

            // Okul numarası kullanımda mı kontrol et
            const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("school_number", schoolNumber)
                .single()

            if (existingProfile && existingProfile.id !== user.id) {
                throw new Error("Bu okul numarası zaten başka bir hesap tarafından kullanılıyor.")
            }

            const { error: profileError } = await supabase.from("profiles").insert({
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                school_number: schoolNumber,
                class: classRoom,
            })

            if (profileError) throw profileError

            router.push("/dashboard")
            router.refresh()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Bir hata oluştu.")
            setIsLoading(false)
        }
    }

    if (!mounted) {
        return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950" />
    }

    if (isFetching) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-blue-950/20 p-4">
            <div className="w-full max-w-md">
                <Card className="border-2 border-blue-200 dark:border-blue-800/50 shadow-xl">
                    <CardHeader className="text-center border-b pb-4">
                        <CardTitle className="text-xl font-bold">Profilini Tamamla</CardTitle>
                        <CardDescription>
                            Devam etmeden önce okul bilgilerini eklemelisin.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 px-4 sm:px-6">
                        <form onSubmit={handleComplete}>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="first-name" className="text-xs font-semibold">Ad</Label>
                                        <Input
                                            id="first-name"
                                            placeholder="Adınız"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="last-name" className="text-xs font-semibold">Soyad</Label>
                                        <Input
                                            id="last-name"
                                            placeholder="Soyadınız"
                                            required
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="school-number" className="text-xs font-semibold">Okul No</Label>
                                        <Input
                                            id="school-number"
                                            placeholder="123"
                                            required
                                            maxLength={3}
                                            value={schoolNumber}
                                            onChange={(e) => setSchoolNumber(e.target.value.replace(/\D/g, ""))}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="class" className="text-xs font-semibold">Sınıf</Label>
                                        <Select value={classRoom} onValueChange={setClassRoom} required>
                                            <SelectTrigger id="class">
                                                <SelectValue placeholder="Seç" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["12A", "12B", "12C", "12D", "12E", "12F"].map((cls) => (
                                                    <SelectItem key={cls} value={cls}>
                                                        {cls.replace("12", "12-")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-start gap-2">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg border-0 mt-2"
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
                    <CardFooter className="justify-center text-xs text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50 border-t p-3">
                        Bilgilerin mezuniyet yıllığında görünecektir.
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
