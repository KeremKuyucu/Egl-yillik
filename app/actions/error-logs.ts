'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export interface ErrorLogData {
    message: string
    stack?: string
    pageUrl?: string
    userAgent?: string
    severity?: 'error' | 'warning' | 'critical'
}

export async function reportErrorAction(data: ErrorLogData) {
    try {
        const supabase = await createClient()
        const user = await getCurrentUser()

        const { error } = await supabase
            .from('error_logs')
            .insert({
                user_id: user?.id || null,
                error_message: data.message,
                stack_trace: data.stack || null,
                page_url: data.pageUrl || null,
                user_agent: data.userAgent || null,
                severity: data.severity || 'error'
            })

        if (error) {
            // Hata raporlarken oluşan hatayı konsola bas ama sonsuz döngüye girmemeye dikkat et
            console.error('Error reporting failed:', error)
            return { success: false }
        }

        return { success: true }
    } catch (error) {
        console.error('Error action failed:', error)
        return { success: false }
    }
}
