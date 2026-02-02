"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export default function DashboardMessage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const message = searchParams.get("message")
    const toastShownRef = useRef(false)

    useEffect(() => {
        if (message && !toastShownRef.current) {
            toast.success("Bilgi", {
                description: message,
                duration: 6000,
            })
            toastShownRef.current = true

            // Mesajı gösterdikten sonra URL'den temizle
            router.replace(pathname)
        }
    }, [message, pathname, router])

    return null
}
