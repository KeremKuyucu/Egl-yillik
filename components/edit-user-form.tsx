// components/edit-user-form.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { updateUserProfile } from "@/lib/actions"

interface UserProfile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
}

interface EditUserFormProps {
    user: UserProfile
    onSuccess?: () => void // Modal kapatmak veya yönlendirmek için
}

export function EditUserForm({ user, onSuccess }: EditUserFormProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [formData, setFormData] = useState({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        school_number: user.school_number || "",
        class: user.class || "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const result = await updateUserProfile(user.id, formData)

            if (result.success) {
                toast.success("Profil başarıyla güncellendi")
                router.refresh()
                if (onSuccess) {
                    onSuccess()
                }
            } else {
                toast.error(result.error || "Güncelleme başarısız")
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first_name">Ad</Label>
                    <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last_name">Soyad</Label>
                    <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                        disabled={isPending}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="school_number">Okul Numarası</Label>
                    <Input
                        id="school_number"
                        value={formData.school_number}
                        onChange={(e) => setFormData({ ...formData, school_number: e.target.value })}
                        required
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="class">Sınıf</Label>
                    <Input
                        id="class"
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                        required
                        disabled={isPending}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Değişiklikleri Kaydet
                </Button>
            </div>
        </form>
    )
}