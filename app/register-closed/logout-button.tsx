"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success("Çıkış yapıldı")
        router.push("/login")
        router.refresh()
    }

    return (
        <Button
            onClick={handleLogout}
            className="w-full h-11 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/20 border-0"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
        </Button>
    )
}
