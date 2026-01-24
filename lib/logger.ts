import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export interface LogData {
    message: string
    stack?: string
    pageUrl?: string
    severity?: 'error' | 'warning' | 'critical'
}

/**
 * Server-side logger that writes directly to the error_logs table.
 * Use this in Server Actions and Server Components.
 */
export async function serverLogger(data: LogData) {
    try {
        const supabase = await createClient()
        const user = await getCurrentUser()

        const { error } = await supabase
            .from('error_logs')
            .insert({
                user_id: user?.id || null,
                error_message: `[SERVER] ${data.message}`,
                stack_trace: data.stack || null,
                page_url: data.pageUrl || null,
                severity: data.severity || 'error'
            })

        if (error) {
            console.error('Failed to save server log:', error)
        }
    } catch (e) {
        console.error('Critical failure in serverLogger:', e)
    }
}
