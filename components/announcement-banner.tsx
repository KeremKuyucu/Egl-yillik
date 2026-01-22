import { getSettingsAction } from "@/app/admin/settings/actions"
import { Megaphone } from "lucide-react"

export default async function AnnouncementBanner() {
    const result = await getSettingsAction()

    if (!result.success || !result.data) return null

    const { announcement_enabled, announcement_message } = result.data

    if (announcement_enabled !== 'true' || !announcement_message) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-900 dark:to-cyan-900 text-white px-4 py-3 relative shadow-md z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-medium animate-in slide-in-from-top-full duration-500">
                <Megaphone className="h-4 w-4 animate-bounce" />
                <span className="text-center">{announcement_message}</span>
            </div>
        </div>
    )
}
