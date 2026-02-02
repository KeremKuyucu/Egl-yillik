import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
    const nowIso = new Date().toISOString()
    console.log('[CRON Reminders] start', { nowIso })

    try {
        const authHeader = req.headers.get('authorization')
        const ok = authHeader === `Bearer ${process.env.CRON_SECRET}`
        console.log('[CRON Reminders] auth', { ok })

        if (!ok) {
            console.warn('[CRON Reminders] Unauthorized')
            return new Response('Unauthorized', { status: 401 })
        }

        const supabase = createAdminClient()

        const { data: settings, error: settingsError } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', ['reminder_auto_enabled', 'reminder_auto_interval', 'reminder_last_run'])

        console.log('[CRON Reminders] settings loaded', {
            ok: !settingsError,
            count: settings?.length ?? 0,
        })

        if (settingsError) {
            console.error('[CRON Reminders] Settings fetch error:', settingsError)
            return NextResponse.json({ error: 'Ayarlar yüklenemedi', details: settingsError.message }, { status: 500 })
        }

        if (!settings || settings.length === 0) {
            console.warn('[CRON Reminders] No settings found')
            return NextResponse.json({ error: 'Ayarlar bulunamadı' }, { status: 500 })
        }

        const enabled = settings.find(s => s.key === 'reminder_auto_enabled')?.value === 'true'
        const intervalDays = parseInt(settings.find(s => s.key === 'reminder_auto_interval')?.value || '3', 10)
        const lastRun = settings.find(s => s.key === 'reminder_last_run')?.value

        console.log('[CRON Reminders] config', { enabled, intervalDays, lastRun })

        if (!enabled) {
            return NextResponse.json({ success: true, message: 'Otomatik hatırlatıcı kapalı', enabled: false })
        }

        if (lastRun) {
            const lastRunDate = new Date(lastRun)
            const nextRunDate = new Date(lastRunDate)
            nextRunDate.setDate(nextRunDate.getDate() + intervalDays)

            const shouldRun = new Date() >= nextRunDate
            console.log('[CRON Reminders] schedule', {
                shouldRun,
                lastRun: lastRunDate.toISOString(),
                nextRun: nextRunDate.toISOString(),
            })

            if (!shouldRun) {
                return NextResponse.json({
                    success: true,
                    message: 'Henüz çalışma zamanı gelmedi',
                    lastRun: lastRunDate.toISOString(),
                    nextRun: nextRunDate.toISOString(),
                    intervalDays,
                })
            }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        if (!appUrl) {
            console.error('[CRON Reminders] NEXT_PUBLIC_APP_URL missing')
            return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL missing' }, { status: 500 })
        }

        console.log('[CRON Reminders] calling central API', { url: `${appUrl}/api/reminders/send` })

        const response = await fetch(`${appUrl}/api/reminders/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({ source: 'cron' }),
        })

        const result = await response.json().catch(() => ({}))
        console.log('[CRON Reminders] central API response', { status: response.status, ok: response.ok })

        if (!response.ok) {
            console.error('[CRON Reminders] API error:', result)
            return NextResponse.json(result, { status: response.status })
        }

        const updateRes = await supabase
            .from('site_settings')
            .update({ value: new Date().toISOString() })
            .eq('key', 'reminder_last_run')

        console.log('[CRON Reminders] updated reminder_last_run', { error: updateRes.error?.message })

        console.log('[CRON Reminders] completed', { sent: result?.stats?.sent, total: result?.stats?.total })

        return NextResponse.json({ success: true, message: 'Otomatik hatırlatma tamamlandı', stats: result.stats })
    } catch (error) {
        console.error('[CRON Reminders] Unexpected error:', error)
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        )
    }
}
