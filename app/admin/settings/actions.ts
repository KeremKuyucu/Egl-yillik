"use server"

import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';

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
