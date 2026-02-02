"use server"

import { Resend } from 'resend'
import { checkSuperAdmin } from '@/lib/auth'
import { getDeadline } from '@/lib/settings'
import { createClient } from "@/lib/supabase/server"
import type { ClassStats, SurveyStats, EmailResult, BulkStatsRPCResponse } from '@/types/reminder'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReminderEmail(
    userId: string,
    email: string,
    userName: string,
    stats: ClassStats,
    surveyStats?: SurveyStats
): Promise<EmailResult> {
    // Merkezi super admin kontrolü
    const auth = await checkSuperAdmin()
    if (!auth.success) return { error: auth.error }

    if (!email) {
        return { error: 'Email not found for user' }
    }

    // Validasyon - stats objesinin tüm alanları var mı?
    if (!stats || typeof stats.remaining_classmates !== 'number') {
        return { error: 'Invalid stats object' }
    }

    // Son teslim tarihini veritabanından çek
    const deadlineData = await getDeadline()
    const deadline = deadlineData.display
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const unsubscribeUrl = `${appUrl}/settings/unsubscribe`

    // ✅ Artık RPC'den direkt geldiği için yeniden hesaplamaya gerek yok
    const remainingClassmates = stats.remaining_classmates

    // Durum hesaplamaları
    const isTextComplete = remainingClassmates === 0
    const isSurveyComplete = surveyStats ? surveyStats.remaining === 0 : true
    const isFullyComplete = isTextComplete && isSurveyComplete

    // Progress bar renkleri
    const textProgressColor = isTextComplete ? '#059669' :
        stats.completion_percentage >= 50 ? '#d97706' : '#dc2626'

    const surveyProgressColor = isSurveyComplete ? '#8b5cf6' :
        surveyStats && surveyStats.percentage >= 50 ? '#a855f7' : '#c084fc'

    // Email konusu
    let subject = ''
    if (isFullyComplete) {
        subject = '✅ Tebrikler! Tüm Görevlerini Tamamladın'
    } else if (!isTextComplete && !isSurveyComplete) {
        subject = `⏰ Hatırlatma: ${remainingClassmates} Yazı ve ${surveyStats?.remaining || 0} Anket Bekliyor`
    } else if (!isTextComplete) {
        subject = `⏰ Hatırlatma: ${remainingClassmates} Arkadaşına Yazı Yazman Gerekiyor`
    } else {
        subject = `🗳️ Hatırlatma: ${surveyStats?.remaining || 0} Anket Daha Doldurman Gerekiyor`
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'EGL Yıllık <egl@keremkk.com.tr>',
            to: [email],
            subject,
            text: `
📚 EGL Yıllık
${stats.class} Sınıfı • 2025-2026

Merhaba ${userName}! 👋

${isFullyComplete ? `
🎉 Süpersin!
Hem yazılarını hem de anketlerini tamamladın!
Yıllık çalışmamıza katkın için teşekkürler 💜
` : `
Yıllık için yapman gereken bazı şeyler kalmış görünüyor.
Aşağıda durumunu özetledik 📋
`}

${isTextComplete ? '✅' : '✍️'} Yıllık Yazıları ${isTextComplete ? '- Tamamlandı!' : ''}
• Yazılan: ${stats.messages_sent_to_classmates} yazı
• Kalan: ${remainingClassmates > 0 ? `${remainingClassmates} kişi` : 'Yok!'}
• İlerleme: %${stats.completion_percentage}

${surveyStats ? `
${isSurveyComplete ? '🏆' : '🗳️'} Sınıf Anketleri ${isSurveyComplete ? '- Tamamlandı!' : ''}
• Tamamlanan: ${surveyStats.completed} anket
• Kalan: ${surveyStats.remaining > 0 ? `${surveyStats.remaining} anket` : 'Yok!'}
• İlerleme: %${surveyStats.percentage}
` : ''}

${!isFullyComplete ? `
⏰ Son Teslim Tarihi
${deadline}
` : ''}

Bağlantılar:
${!isTextComplete ? `• Yazı Yaz: ${appUrl}/texts\n` : ''}${!isSurveyComplete ? `• Anketlere Git: ${appUrl}/surveys\n` : ''}${isFullyComplete ? `• Yıllığı Görüntüle: ${appUrl}/home\n` : ''}

${!isFullyComplete ? `
💜 Her yazı bir anının, her oy bir arkadaşlığın hatırası.
Yıllığımızı birlikte özel kılalım!
` : ''}

--
Bu email EGL Yıllık sistemi tarafından otomatik olarak gönderilmiştir.
Abonelikten çıkmak için: ${unsubscribeUrl}
© 2026 EGL Yıllık • Tüm hakları saklıdır.
            `,
            html: `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; max-width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 32px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">📚 EGL Yıllık</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${stats.class} Sınıfı • 2025-2026</p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px;">Merhaba ${userName}! 👋</h2>
                            
                            ${isFullyComplete ? `
                            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                                <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                                <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 20px;">Süpersin!</h3>
                                <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 14px; line-height: 1.6;">
                                    Hem yazılarını hem de anketlerini tamamladın!<br>
                                    Yıllık çalışmamıza katkın için teşekkürler 💜
                                </p>
                            </div>
                            ` : `
                            <p style="color: #64748b; margin: 0 0 24px 0; line-height: 1.6;">
                                Yıllık için yapman gereken bazı şeyler kalmış görünüyor.<br>
                                Aşağıda durumunu özetledik 📋
                            </p>
                            `}

                            <!-- Yazı İstatistiği -->
                            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 16px; border-left: 4px solid ${textProgressColor};">
                                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                    <span style="font-size: 24px; margin-right: 12px;">${isTextComplete ? '✅' : '✍️'}</span>
                                    <h3 style="color: #1e293b; margin: 0; font-size: 16px; font-weight: 600;">
                                        Yıllık Yazıları ${isTextComplete ? '- Tamamlandı!' : ''}
                                    </h3>
                                </div>
                                
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                                    <tr>
                                        <td width="50%" style="padding: 8px; background: #ffffff; border-radius: 8px;">
                                            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Yazılan</div>
                                            <div style="color: #059669; font-size: 18px; font-weight: 700;">✓ ${stats.messages_sent_to_classmates} yazı</div>
                                        </td>
                                        <td width="50%" style="padding: 8px; background: #ffffff; border-radius: 8px;">
                                            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Kalan</div>
                                            <div style="color: ${remainingClassmates > 0 ? '#dc2626' : '#059669'}; font-size: 18px; font-weight: 700;">
                                                ${remainingClassmates > 0 ? `${remainingClassmates} kişi` : 'Yok!'}
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Progress Bar -->
                                <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div style="background: ${textProgressColor}; height: 100%; width: ${stats.completion_percentage}%; transition: width 0.3s;"></div>
                                </div>
                                <p style="color: #64748b; font-size: 12px; text-align: right; margin: 4px 0 0 0;">%${stats.completion_percentage}</p>
                            </div>

                            ${surveyStats ? `
                            <!-- Anket İstatistiği -->
                            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 16px; border-left: 4px solid ${surveyProgressColor};">
                                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                    <span style="font-size: 24px; margin-right: 12px;">${isSurveyComplete ? '🏆' : '🗳️'}</span>
                                    <h3 style="color: #1e293b; margin: 0; font-size: 16px; font-weight: 600;">
                                        Sınıf Anketleri ${isSurveyComplete ? '- Tamamlandı!' : ''}
                                    </h3>
                                </div>
                                
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                                    <tr>
                                        <td width="50%" style="padding: 8px; background: #ffffff; border-radius: 8px;">
                                            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Tamamlanan</div>
                                            <div style="color: #8b5cf6; font-size: 18px; font-weight: 700;">✓ ${surveyStats.completed} anket</div>
                                        </td>
                                        <td width="50%" style="padding: 8px; background: #ffffff; border-radius: 8px;">
                                            <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Kalan</div>
                                            <div style="color: ${surveyStats.remaining > 0 ? '#dc2626' : '#8b5cf6'}; font-size: 18px; font-weight: 700;">
                                                ${surveyStats.remaining > 0 ? `${surveyStats.remaining} anket` : 'Yok!'}
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Progress Bar -->
                                <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div style="background: ${surveyProgressColor}; height: 100%; width: ${surveyStats.percentage}%; transition: width 0.3s;"></div>
                                </div>
                                <p style="color: #64748b; font-size: 12px; text-align: right; margin: 4px 0 0 0;">%${surveyStats.percentage}</p>
                            </div>
                            ` : ''}

                            ${!isFullyComplete ? `
                            <!-- Deadline Warning -->
                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                                <div style="font-size: 32px; margin-bottom: 8px;">⏰</div>
                                <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 4px;">Son Teslim Tarihi</div>
                                <div style="color: #ffffff; font-size: 24px; font-weight: 700;">${deadline}</div>
                            </div>
                            ` : ''}

                            <!-- CTA Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    ${!isTextComplete ? `
                                    <td style="padding: 8px;">
                                        <a href="${appUrl}/texts" style="display: block; background: #059669; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                            ✍️ Yazı Yaz
                                        </a>
                                        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; word-break: break-all; text-align: center;">
                                            ${appUrl}/texts
                                        </p>
                                    </td>
                                    ` : ''}
                                    ${!isSurveyComplete ? `
                                    <td style="padding: 8px;">
                                        <a href="${appUrl}/surveys" style="display: block; background: #8b5cf6; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                            🗳️ Anketlere Git
                                        </a>
                                        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; word-break: break-all; text-align: center;">
                                            ${appUrl}/surveys
                                        </p>
                                    </td>
                                    ` : ''}
                                    ${isFullyComplete ? `
                                    <td style="padding: 8px;">
                                        <a href="${appUrl}/home" style="display: block; background: #8b5cf6; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                            📚 Yıllığı Görüntüle
                                        </a>
                                        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; word-break: break-all; text-align: center;">
                                            ${appUrl}/home
                                        </p>
                                    </td>
                                    ` : ''}
                                </tr>
                            </table>

                            ${!isFullyComplete ? `
                            <div style="background: #faf5ff; border-radius: 12px; padding: 16px; margin-top: 24px; text-align: center;">
                                <p style="color: #7c3aed; margin: 0; font-size: 14px; line-height: 1.6;">
                                    💜 Her yazı bir anının, her oy bir arkadaşlığın hatırası.<br>
                                    Yıllığımızı birlikte özel kılalım!
                                </p>
                            </div>
                            ` : ''}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
                                Bu email EGL Yıllık sistemi tarafından otomatik olarak gönderilmiştir.
                            </p>
                            <p style="color: #64748b; font-size: 11px; margin: 0 0 8px 0;">
                                Artık bu mailleri almak istemiyorsanız <a href="${unsubscribeUrl}" style="color: #4f46e5; text-decoration: underline;">abonelikten çıkabilirsiniz</a>.
                            </p>
                            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                                © 2026 EGL Yıllık • Tüm hakları saklıdır.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        })
        if (error) {
            console.error("Resend Error:", error)
            return { error: error.message }
        }

        return { success: true, data }
    } catch (e: any) {
        console.error("Email Exception:", e)
        return { error: e.message }
    }
}

export async function processBulkReminders(targets: BulkStatsRPCResponse[]) {
    const results: Record<string, { success: boolean, error?: string }> = {}

    // 4. Gönderim döngüsü (Rate limit koruması için sıralı veya chunk'lı)
    const CHUNK_SIZE = 5
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
        const chunk = targets.slice(i, i + CHUNK_SIZE)

        await Promise.all(chunk.map(async (user) => {
            if (!user.email) {
                results[user.user_id] = { success: false, error: 'Email adresi yok' }
                return
            }

            const stats: ClassStats = {
                user_id: user.user_id,
                class: user.class,
                total_classmates: user.total_classmates,
                messages_sent_to_classmates: user.messages_sent_to_classmates,
                remaining_classmates: user.remaining_classmates,
                completion_percentage: user.text_completion_percentage
            }

            const surveyStats: SurveyStats = {
                total: user.total_survey_categories,
                completed: user.completed_surveys,
                remaining: user.remaining_surveys,
                percentage: user.survey_completion_percentage
            }

            const userName = `${user.first_name} ${user.last_name}`.trim()

            const res = await sendReminderEmail(user.user_id, user.email, userName, stats, surveyStats)

            results[user.user_id] = {
                success: !!res.success,
                error: res.error
            }
        }))

        if (i + CHUNK_SIZE < targets.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }

    return results
}

export async function sendBulkUsersReminders(userIds: string[]) {
    // 1. Yetki kontrolü
    const auth = await checkSuperAdmin()
    if (!auth.success) return { error: auth.error }

    // 2. Verileri taze çek
    const supabase = await createClient()
    const { data: usersData, error: rpcError } = await supabase
        .rpc('get_bulk_user_stats') as { data: BulkStatsRPCResponse[] | null, error: any }

    if (rpcError || !usersData) {
        console.error("Bulk Stats Error:", rpcError)
        return { error: 'Kullanıcı verileri alınırken hata oluştu.' }
    }

    // 3. Seçili kullanıcıları filtrele (Opted-out olanları skip et)
    const targets = usersData.filter(u => userIds.includes(u.user_id) && !u.is_opted_out)

    // 4. Gönderimi başlat
    const results = await processBulkReminders(targets)

    return { success: true, results }
}