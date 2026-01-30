import { getAnnouncementSettings } from "@/lib/settings"
import { Megaphone } from "lucide-react"

export default async function AnnouncementBanner() {
    const { enabled, message } = await getAnnouncementSettings()

    if (!enabled || !message) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-900 dark:to-cyan-900 text-white px-4 py-3 relative shadow-md z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-medium animate-in slide-in-from-top-full duration-500">
                <Megaphone className="h-4 w-4 animate-bounce" />
                <span className="text-center">{message}</span>
            </div>
        </div>
    )
}
