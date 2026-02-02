import { createAdminClient } from "@/lib/supabase/admin"
import { processBulkReminders } from "@/app/admin/reminders/actions"
import { NextResponse } from "next/server"
import type { BulkStatsRPCResponse } from "@/types/reminder"

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 dakika timeout (email gönderimi uzun sürebilir)

export async function GET(req: Request) {
    const startTime = Date.now()

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

        // 4. Hedef Kullanıcıları Belirle (Eksik işi olanlar)
        const { data: usersData, error: rpcError } = await supabase
            .rpc('get_bulk_user_stats') as { data: BulkStatsRPCResponse[] | null, error: any }

        if (rpcError) {
            console.error('[CRON Reminders] RPC error:', rpcError)
            return NextResponse.json({
                error: 'Kullanıcı verileri alınamadı',
                details: rpcError.message
            }, { status: 500 })
        }

        if (!usersData || usersData.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Sistemde kullanıcı bulunamadı',
                total: 0
            })
        }

        // Eksik işi olan ve opted-out olmayan kullanıcıları filtrele
        const targets = usersData.filter(u =>
            ((u.remaining_classmates > 0) || (u.remaining_surveys > 0)) &&
            u.email &&
            !u.is_opted_out
        )

        if (targets.length === 0) {
            // Çalışma zamanını güncelle (boş olsa bile periyodu sıfırlayalım)
            await supabase
                .from('site_settings')
                .update({ value: new Date().toISOString() })
                .eq('key', 'reminder_last_run')

            return NextResponse.json({
                success: true,
                message: 'Hatırlatılacak kullanıcı bulunamadı',
                totalUsers: usersData.length,
                eligibleUsers: 0
            })
        }

        console.log(`[CRON Reminders] Starting bulk send to ${targets.length} users`)

        // 5. Gönderimi Başlat
        const results = await processBulkReminders(targets)

        // Son çalışma zamanını güncelle
        await supabase
            .from('site_settings')
            .update({ value: new Date().toISOString() })
            .eq('key', 'reminder_last_run')

        const successCount = Object.values(results).filter(r => r.success).length
        const errorCount = Object.values(results).filter(r => !r.success).length
        const duration = Date.now() - startTime

        console.log(`[CRON Reminders] Completed: ${successCount}/${targets.length} sent in ${duration}ms`)

        return NextResponse.json({
            success: true,
            message: 'Otomatik hatırlatma tamamlandı',
            stats: {
                total: targets.length,
                sent: successCount,
                failed: errorCount,
                durationMs: duration
            }
        })
    } catch (error) {
        console.error('[CRON Reminders] Unexpected error:', error)
        return NextResponse.json({
            error: 'Beklenmeyen bir hata oluştu',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
