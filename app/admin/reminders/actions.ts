"use server"

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail(userId: string, email: string, userName: string, stats: any) {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if super admin
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

    try {
        const { data, error } = await resend.emails.send({
            from: 'EGL Yıllık <info@keremkk.com.tr>',
            to: [email],
            subject: '⚠️ Yıllık Yazıları Durum Hatırlatması',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Merhaba ${userName}! 👋</h2>
                    <p>Yıllık yazılarını tamamlaman için durum özetin aşağıdadır:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 10px;">🏫 <strong>Sınıf:</strong> ${stats.class}</li>
                            <li style="margin-bottom: 10px;">👥 <strong>Toplam Sınıf Mevcudu:</strong> ${stats.total_classmates}</li>
                            <li style="margin-bottom: 10px;">✍️ <strong>Yazılan Yazı Sayısı:</strong> ${stats.messages_sent_to_classmates}</li>
                            <li style="margin-bottom: 10px;">📊 <strong>Tamamlanma Oranı:</strong> %${stats.completion_percentage}</li>
                            <li style="margin-bottom: 10px; color: ${stats.remaining_classmates > 0 ? '#e11d48' : '#059669'}; font-weight: bold;">
                                ${stats.remaining_classmates > 0 ? `❗ Kalan Kişi Sayısı: ${stats.remaining_classmates}` : '✅ Tamamlandı'}
                            </li>
                        </ul>
                    </div>

                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #dc2626; font-weight: bold;">
                            ⏰ Son Teslim Tarihi: <span style="font-size: 1.1em;">${deadline}</span>
                        </p>
                    </div>

                    <p>Lütfen son tarihe kadar yazılarını tamamla!</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                       style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Dashboard'a Git
                    </a>
                </div>
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
