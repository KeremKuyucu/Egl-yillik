'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type FeedbackType = 'bug' | 'suggestion' | 'complaint' | 'other'

interface SubmitFeedbackResult {
    success: boolean
    error?: string
}

export async function submitFeedback(
    type: FeedbackType,
    message: string,
    pageUrl?: string,
    userAgent?: string
): Promise<SubmitFeedbackResult> {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return { success: false, error: 'Giriş yapmalısınız' }
        }

        if (!message || message.trim().length < 10) {
            return { success: false, error: 'Mesaj en az 10 karakter olmalıdır' }
        }

        if (message.length > 2000) {
            return { success: false, error: 'Mesaj en fazla 2000 karakter olabilir' }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('feedback')
            .insert({
                user_id: user.id,
                type,
                message: message.trim(),
                page_url: pageUrl || null,
                user_agent: userAgent || null
            })

        if (error) {
            console.error('Feedback insert error:', error)
            return { success: false, error: 'Geri bildirim gönderilemedi' }
        }

        return { success: true }
    } catch (error) {
        console.error('Feedback error:', error)
        return { success: false, error: 'Bir hata oluştu' }
    }
}
