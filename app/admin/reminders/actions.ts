"use server"

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SurveyStats {
    total: number
    completed: number
    remaining: number
    percentage: number
}

export async function sendReminderEmail(
    userId: string,
    email: string,
    userName: string,
    stats: any,
    surveyStats?: SurveyStats
) {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase.from('profiles').select('level').eq('id', user.id).single();
    if (!profile || profile.level < ROLES.SUPER_ADMIN) {
        return { error: 'Unauthorized' };
    }

    if (!email) {
        return { error: 'Email not found for user' };
    }

    // Son teslim tarihi
    const deadline = '9 Şubat 2026';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yillik.example.com';

    // Durum hesaplamaları
    const isTextComplete = stats.remaining_classmates === 0;
    const isSurveyComplete = surveyStats ? surveyStats.remaining === 0 : true;
    const isFullyComplete = isTextComplete && isSurveyComplete;

    const textProgressColor = isTextComplete ? '#059669' : stats.completion_percentage >= 50 ? '#d97706' : '#dc2626';
    const surveyProgressColor = isSurveyComplete ? '#8b5cf6' : surveyStats && surveyStats.percentage >= 50 ? '#a855f7' : '#c084fc';

    // Email konusu
    let subject = '';
    if (isFullyComplete) {
        subject = '✅ Tebrikler! Tüm Görevlerini Tamamladın';
    } else if (!isTextComplete && !isSurveyComplete) {
        subject = `⏰ Hatırlatma: ${stats.remaining_classmates} Yazı ve ${surveyStats?.remaining || 0} Anket Bekliyor`;
    } else if (!isTextComplete) {
        subject = `⏰ Hatırlatma: ${stats.remaining_classmates} Arkadaşına Yazı Yazman Gerekiyor`;
    } else {
        subject = `🗳️ Hatırlatma: ${surveyStats?.remaining || 0} Anket Daha Doldurman Gerekiyor`;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'EGL Yıllık <info@keremkk.com.tr>',
            to: [email],
            subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
                                    
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                                                📚 EGL Yıllık
                                            </h1>
                                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                                                ${stats.class} Sınıfı • 2025-2026
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                            
                                            <!-- Greeting -->
                                            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">
                                                Merhaba ${userName}! 👋
                                            </h2>

                                            ${isFullyComplete ? `
                                                <!-- Full Success State -->
                                                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                                                    <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                                                    <h3 style="margin: 0 0 8px 0; color: #059669; font-size: 20px; font-weight: 600;">
                                                        Süpersin!
                                                    </h3>
                                                    <p style="margin: 0; color: #047857; font-size: 14px;">
                                                        Hem yazılarını hem de anketlerini tamamladın!<br/>
                                                        Yıllık çalışmamıza katkın için teşekkürler 💜
                                                    </p>
                                                </div>
                                            ` : `
                                                <!-- Reminder State -->
                                                <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                                    Yıllık için yapman gereken bazı şeyler kalmış görünüyor. 
                                                    Aşağıda durumunu özetledik 📋
                                                </p>
                                            `}

                                            <!-- YAZI DURUMU -->
                                            <div style="background-color: ${isTextComplete ? '#ecfdf5' : '#fffbeb'}; border: 1px solid ${isTextComplete ? '#a7f3d0' : '#fde68a'}; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" valign="top">
                                                            <span style="font-size: 24px;">${isTextComplete ? '✅' : '✍️'}</span>
                                                        </td>
                                                        <td>
                                                            <h3 style="margin: 0 0 12px 0; color: ${isTextComplete ? '#059669' : '#d97706'}; font-size: 16px; font-weight: 600;">
                                                                Yıllık Yazıları ${isTextComplete ? '- Tamamlandı!' : ''}
                                                            </h3>
                                                            
                                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                                                                <tr>
                                                                    <td style="padding: 4px 0;">
                                                                        <span style="color: #64748b; font-size: 13px;">Yazılan</span>
                                                                    </td>
                                                                    <td align="right" style="padding: 4px 0;">
                                                                        <span style="color: #059669; font-size: 13px; font-weight: 600;">✓ ${stats.messages_sent_to_classmates} yazı</span>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="padding: 4px 0;">
                                                                        <span style="color: #64748b; font-size: 13px;">Kalan</span>
                                                                    </td>
                                                                    <td align="right" style="padding: 4px 0;">
                                                                        <span style="color: ${stats.remaining_classmates > 0 ? '#dc2626' : '#059669'}; font-size: 13px; font-weight: 600;">
                                                                            ${stats.remaining_classmates > 0 ? `${stats.remaining_classmates} kişi` : 'Yok!'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            
                                                            <!-- Progress Bar -->
                                                            <div style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                                <div style="height: 100%; width: ${stats.completion_percentage}%; background-color: ${textProgressColor}; border-radius: 4px;"></div>
                                                            </div>
                                                            <div style="text-align: right; margin-top: 4px;">
                                                                <span style="font-size: 12px; color: ${textProgressColor}; font-weight: 600;">%${stats.completion_percentage}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>

                                            <!-- ANKET DURUMU -->
                                            ${surveyStats ? `
                                            <div style="background-color: ${isSurveyComplete ? '#f5f3ff' : '#faf5ff'}; border: 1px solid ${isSurveyComplete ? '#c4b5fd' : '#e9d5ff'}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="40" valign="top">
                                                            <span style="font-size: 24px;">${isSurveyComplete ? '🏆' : '🗳️'}</span>
                                                        </td>
                                                        <td>
                                                            <h3 style="margin: 0 0 12px 0; color: ${isSurveyComplete ? '#7c3aed' : '#9333ea'}; font-size: 16px; font-weight: 600;">
                                                                Sınıf Anketleri ${isSurveyComplete ? '- Tamamlandı!' : ''}
                                                            </h3>
                                                            
                                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                                                                <tr>
                                                                    <td style="padding: 4px 0;">
                                                                        <span style="color: #64748b; font-size: 13px;">Tamamlanan</span>
                                                                    </td>
                                                                    <td align="right" style="padding: 4px 0;">
                                                                        <span style="color: #7c3aed; font-size: 13px; font-weight: 600;">✓ ${surveyStats.completed} anket</span>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="padding: 4px 0;">
                                                                        <span style="color: #64748b; font-size: 13px;">Kalan</span>
                                                                    </td>
                                                                    <td align="right" style="padding: 4px 0;">
                                                                        <span style="color: ${surveyStats.remaining > 0 ? '#9333ea' : '#7c3aed'}; font-size: 13px; font-weight: 600;">
                                                                            ${surveyStats.remaining > 0 ? `${surveyStats.remaining} anket` : 'Yok!'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            
                                                            <!-- Progress Bar -->
                                                            <div style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                                                <div style="height: 100%; width: ${surveyStats.percentage}%; background-color: ${surveyProgressColor}; border-radius: 4px;"></div>
                                                            </div>
                                                            <div style="text-align: right; margin-top: 4px;">
                                                                <span style="font-size: 12px; color: ${surveyProgressColor}; font-weight: 600;">%${surveyStats.percentage}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            ` : ''}

                                            ${!isFullyComplete ? `
                                                <!-- Deadline Warning -->
                                                <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="40">
                                                                <span style="font-size: 24px;">⏰</span>
                                                            </td>
                                                            <td>
                                                                <p style="margin: 0 0 4px 0; color: #991b1b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Son Teslim Tarihi</p>
                                                                <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: 700;">${deadline}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            ` : ''}

                                            <!-- CTA Buttons -->
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" style="padding: 8px 0;">
                                                        ${!isTextComplete ? `
                                                        <a href="${appUrl}/dashboard" 
                                                           style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.4); margin: 4px;">
                                                            ✍️ Yazı Yaz
                                                        </a>
                                                        ` : ''}
                                                        ${!isSurveyComplete ? `
                                                        <a href="${appUrl}/surveys" 
                                                           style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4); margin: 4px;">
                                                            🗳️ Anketlere Git
                                                        </a>
                                                        ` : ''}
                                                        ${isFullyComplete ? `
                                                        <a href="${appUrl}/dashboard" 
                                                           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
                                                            📚 Yıllığı Görüntüle
                                                        </a>
                                                        ` : ''}
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Motivation -->
                                            ${!isFullyComplete ? `
                                                <div style="margin-top: 24px; padding: 16px; background-color: #faf5ff; border-radius: 12px; text-align: center;">
                                                    <p style="margin: 0; color: #7c3aed; font-size: 14px; font-style: italic;">
                                                        💜 Her yazı bir anının, her oy bir arkadaşlığın hatırası. <br/>
                                                        Yıllığımızı birlikte özel kılalım!
                                                    </p>
                                                </div>
                                            ` : ''}

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 24px 30px; text-align: center;">
                                            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
                                                Bu email EGL Yıllık sistemi tarafından otomatik olarak gönderilmiştir.
                                            </p>
                                            <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
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
        });

        if (error) {
            console.error("Resend Error:", error);
            return { error: error.message };
        }
        return { success: true, data };
    } catch (e: any) {
        console.error("Email Exception:", e);
        return { error: e.message };
    }
}
