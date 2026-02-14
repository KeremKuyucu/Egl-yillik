import VoteAccessLogClient from "./client"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Oy Erişim Logları | Admin",
    robots: {
        index: false,
        follow: false,
    },
}

export default async function VoteAccessLogPage() {
    return (
        <div className="space-y-6">
            <VoteAccessLogClient />
        </div>
    )
}
