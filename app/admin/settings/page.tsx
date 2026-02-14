import type { Metadata } from "next"
import AdminSettingsClient from "./client"

export const metadata: Metadata = {
    title: "Ayarlar | Admin",
    robots: { index: false, follow: false },
}

export default function AdminSettingsPage() {
    return <AdminSettingsClient />
}
