import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
    try {
        // 1. Güvenlik Kontrolü (CRON_SECRET)
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.warn('[CRON Reminders] Unauthorized access attempt')
            return new Response('Unauthorized', { status: 401 })
        }

        const supabase = createAdminClient()

        // 2. Ayarları Çek
        const { data: settings, error: settingsError } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', ['reminder_auto_enabled', 'reminder_auto_interval', 'reminder_last_run'])

        if (settingsError) {
            console.error('[CRON Reminders] Settings fetch error:', settingsError)
            return NextResponse.json({
                error: 'Ayarlar yüklenemedi',
                details: settingsError.message
            }, { status: 500 })
        }

        if (!settings || settings.length === 0) {
            console.warn('[CRON Reminders] No settings found')
            return NextResponse.json({
                error: 'Ayarlar bulunamadı'
            }, { status: 500 })
        }

        const enabled = settings.find(s => s.key === 'reminder_auto_enabled')?.value === 'true'
        const intervalDays = parseInt(settings.find(s => s.key === 'reminder_auto_interval')?.value || '3', 10)
        const lastRun = settings.find(s => s.key === 'reminder_last_run')?.value

        if (!enabled) {
            return NextResponse.json({
                success: true,
                message: 'Otomatik hatırlatıcı kapalı',
                enabled: false
            })
        }

        // 3. Çalışma Zamanı Kontrolü
        if (lastRun) {
            const lastRunDate = new Date(lastRun)
            const nextRunDate = new Date(lastRunDate)
            nextRunDate.setDate(nextRunDate.getDate() + intervalDays)

            if (new Date() < nextRunDate) {
                return NextResponse.json({
                    success: true,
                    message: 'Henüz çalışma zamanı gelmedi',
                    lastRun: lastRunDate.toISOString(),
                    nextRun: nextRunDate.toISOString(),
                    intervalDays
                })
            }
        }

        // 4. Merkezi API'ye istek at
        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        const response = await fetch(`${appUrl}/api/reminders/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({ source: 'cron' })
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('[CRON Reminders] API error:', result)
            return NextResponse.json(result, { status: response.status })
        }

        // 5. Son çalışma zamanını güncelle
        await supabase
            .from('site_settings')
            .update({ value: new Date().toISOString() })
            .eq('key', 'reminder_last_run')

        console.log(`[CRON Reminders] Completed: ${result.stats?.sent}/${result.stats?.total} sent`)

        return NextResponse.json({
            success: true,
            message: 'Otomatik hatırlatma tamamlandı',
            stats: result.stats
        })

    } catch (error) {
        console.error('[CRON Reminders] Unexpected error:', error)
        return NextResponse.json({
            error: 'Beklenmeyen bir hata oluştu',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
