import { Metadata } from "next"
import TextAccessLogClient from "./client"

export const metadata: Metadata = {
    title: "Metin Erişim Logları | Admin Paneli",
    description: "Adminlerin metin içeriklerine erişim kayıtları.",
}

export default function TextAccessLogPage() {
    return (
        <div className="space-y-6">
            <TextAccessLogClient />
        </div>
    )
}
