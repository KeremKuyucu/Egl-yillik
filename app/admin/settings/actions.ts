"use server"

import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';

export async function updateGraduationDate(dateString: string) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single();

    if (!profile || profile.level < ROLES.SUPER_ADMIN) {
        return { error: 'Unauthorized - Super Admin yetkisi gerekli' };
    }

    // Validate date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return { error: 'Geçersiz tarih formatı' };
    }

    // Upsert the setting
    const { error } = await supabase
        .from('site_settings')
        .upsert({
            key: 'graduation_date',
            value: date.toISOString(),
            description: 'Mezuniyet tarihi (Anıların açılacağı tarih)',
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

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single();

    if (!profile || profile.level < ROLES.SUPER_ADMIN) {
        return { error: 'Unauthorized - Super Admin yetkisi gerekli' };
    }

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

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single();

    if (!profile || profile.level < ROLES.SUPER_ADMIN) {
        return { error: 'Unauthorized - Super Admin yetkisi gerekli' };
    }

    // Validate key
    const allowedKeys = ['messaging_enabled', 'voting_enabled', 'registration_enabled', 'maintenance_mode'];
    if (!allowedKeys.includes(key)) {
        return { error: 'Geçersiz ayar anahtarı' };
    }

    const descriptions: Record<string, string> = {
        messaging_enabled: 'Mesaj yazma özelliği açık/kapalı',
        voting_enabled: 'Oylama/anket özelliği açık/kapalı',
        registration_enabled: 'Yeni kayıt özelliği açık/kapalı',
        maintenance_mode: 'Bakım modu açık/kapalı'
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

export async function getSettingsAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

    if (error) {
        // Return defaults if table doesn't exist yet
        return {
            success: true,
            data: {
                deadline: new Date(2026, 1, 9, 23, 59, 59).toISOString(),
                graduation_date: new Date(2026, 6, 26).toISOString(),
                messaging_enabled: 'true',
                voting_enabled: 'true',
                registration_enabled: 'true',
                maintenance_mode: 'false'
            }
        };
    }

    const settings: Record<string, string> = {
        deadline: new Date(2026, 1, 9, 23, 59, 59).toISOString(),
        graduation_date: new Date(2026, 6, 26).toISOString(),
        messaging_enabled: 'true',
        voting_enabled: 'true',
        registration_enabled: 'true',
        maintenance_mode: 'false'
    };

    data?.forEach((item) => {
        settings[item.key] = item.value;
    });

    return { success: true, data: settings };
}

export async function getDeadlineAction() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'deadline')
        .single();

    if (error || !data) {
        // Return default deadline if not set
        return {
            success: true,
            data: new Date(2026, 1, 9, 23, 59, 59).toISOString()
        };
    }

    return { success: true, data: data.value };
}
