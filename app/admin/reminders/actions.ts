"use server"

import { checkSuperAdmin } from '@/lib/auth'

export async function sendBulkUsersReminders(userIds: string[]) {
    const auth = await checkSuperAdmin()
    if (!auth.success) return { error: auth.error }

    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        const response = await fetch(`${appUrl}/api/reminders/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({
                userIds,
                source: 'admin'
            })
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('[Admin Reminders] API error:', result)
            return { error: result.error || 'API hatası' }
        }

        return {
            success: true,
            results: result.results,
            stats: result.stats
        }

    } catch (error) {
        console.error('[Admin Reminders] Unexpected error:', error)
        return { error: 'Beklenmeyen bir hata oluştu' }
    }
}
