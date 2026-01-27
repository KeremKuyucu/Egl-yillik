import { createAdminClient } from "@/lib/supabase/admin"
import { processBulkReminders } from "@/app/admin/reminders/actions"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    // 1. Güvenlik Kontrolü (CRON_SECRET)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabase = createAdminClient()

    // 2. Ayarları Çek
    const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['reminder_auto_enabled', 'reminder_auto_interval', 'reminder_last_run'])

    if (settingsError || !settings) {
        return NextResponse.json({ error: 'Ayarlar yüklenemedi' }, { status: 500 })
    }

    const enabled = settings.find(s => s.key === 'reminder_auto_enabled')?.value === 'true'
    const intervalDays = parseInt(settings.find(s => s.key === 'reminder_auto_interval')?.value || '3')
    const lastRun = settings.find(s => s.key === 'reminder_last_run')?.value

    if (!enabled) {
        return NextResponse.json({ message: 'Otomatik hatırlatıcı kapalı' })
    }

    // 3. Çalışma Zamanı Kontrolü
    if (lastRun) {
        const lastRunDate = new Date(lastRun)
        const nextRunDate = new Date(lastRunDate)
        nextRunDate.setDate(nextRunDate.getDate() + intervalDays)

        if (new Date() < nextRunDate) {
            return NextResponse.json({
                message: 'Henüz çalışma zamanı gelmedi',
                nextRun: nextRunDate.toISOString()
            })
        }
    }

    // 4. Hedef Kullanıcıları Belirle (Eksik işi olanlar)
    const { data: usersData, error: rpcError } = await supabase
        .rpc('get_bulk_user_stats')

    if (rpcError || !usersData) {
        return NextResponse.json({ error: 'Kullanıcı verileri alınamadı' }, { status: 500 })
    }

    // Eksik işi olan ve opted-out olmayan kullanıcıları filtrele
    const targets = (usersData as any[]).filter(u =>
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

        return NextResponse.json({ message: 'Hatırlatılacak kullanıcı bulunamadı' })
    }

    // 5. Gönderimi Başlat
    const results = await processBulkReminders(targets as any)

    // Son çalışma zamanını güncelle
    await supabase
        .from('site_settings')
        .update({ value: new Date().toISOString() })
        .eq('key', 'reminder_last_run')

    const successCount = Object.values(results).filter(r => r.success).length

    return NextResponse.json({
        message: 'Otomatik hatırlatma tamamlandı',
        total: targets.length,
        sent: successCount
    })
}
