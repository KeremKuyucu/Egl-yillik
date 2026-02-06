"use server"

import { createClient } from '@/lib/supabase/server';

export async function updateGraduationDate(dateString: string, year?: number) {
    const supabase = await createClient();

    // Validate date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return { error: 'Geçersiz tarih formatı' };
    }

    const targetYear = year || new Date().getFullYear();
    const key = `graduation_date_${targetYear}`;

    // Upsert the setting
    const { error } = await supabase
        .from('site_settings')
        .upsert({
            key: key,
            value: date.toISOString(),
            description: `${targetYear} mezuniyet tarihi (Anıların açılacağı tarih)`,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'key'
        });

    if (error) {
        console.error('Graduation date update error:', error);
        return { error: error.message };
    }

    return { success: true };
}

export async function updateDeadline(dateTimeString: string) {
    const supabase = await createClient();

    // Validate date
    const deadline = new Date(dateTimeString);
    if (isNaN(deadline.getTime())) {
        return { error: 'Geçersiz tarih formatı' };
    }

    // Upsert the setting
    const { error } = await supabase
        .from('site_settings')
        .upsert({
            key: 'deadline',
            value: deadline.toISOString(),
            description: 'Yıllık yazıları için son teslim tarihi',
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'key'
        });

    if (error) {
        console.error('Deadline update error:', error);
        return { error: error.message };
    }

    return { success: true };
}

export async function updateToggleSetting(key: string, value: boolean) {
    const supabase = await createClient();

    // Validate key
    const allowedKeys = ['messaging_enabled', 'voting_enabled', 'registration_enabled', 'announcement_enabled'];
    if (!allowedKeys.includes(key)) {
        return { error: 'Geçersiz ayar anahtarı' };
    }

    const descriptions: Record<string, string> = {
        messaging_enabled: 'Mesaj yazma özelliği açık/kapalı',
        voting_enabled: 'Oylama/anket özelliği açık/kapalı',
        registration_enabled: 'Yeni kayıt özelliği açık/kapalı',
        announcement_enabled: 'Duyuru bannerı açık/kapalı'
    };

    // Upsert the setting
    const { error } = await supabase
        .from('site_settings')
        .upsert({
            key,
            value: value.toString(),
            description: descriptions[key],
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'key'
        });

    if (error) {
        console.error('Toggle update error:', error);
        return { error: error.message };
    }

    return { success: true };
}

export async function updateTextSetting(key: string, value: string) {
    const supabase = await createClient();

    // Validate key
    const allowedKeys = ['announcement_message'];
    if (!allowedKeys.includes(key)) {
        return { error: 'Geçersiz ayar anahtarı' };
    }

    const descriptions: Record<string, string> = {
        announcement_message: 'Site genelinde gösterilecek duyuru metni'
    };

    // Upsert the setting
    const { error } = await supabase
        .from('site_settings')
        .upsert({
            key,
            value,
            description: descriptions[key],
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'key'
        });

    if (error) {
        console.error('Text setting update error:', error);
        return { error: error.message };
    }

    return { success: true };
}

export async function getSettingsAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

    const settings: Record<string, string> = {};

    if (error) {
        // Return defaults if table doesn't exist yet or error
        return {
            success: true,
            data: settings
        };
    }

    data?.forEach((item) => {
        settings[item.key] = item.value;
    });

    return { success: true, data: settings };
}