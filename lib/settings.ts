// lib/settings.ts
import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

export interface SiteSettings {
    id: string;
    key: string;
    value: string;
    description?: string;
    updated_at: string;
}

// Default values
const DEFAULT_DEADLINE = new Date(2026, 1, 9, 23, 59, 59);
const DEFAULT_DEADLINE_DISPLAY = '9 Şubat 2026';

const DEFAULT_GRADUATION_DATE = new Date(2026, 5, 26, 17, 0, 0);
const DEFAULT_GRADUATION_DATE_DISPLAY = '26 Haziran 2026';

// Helper: Cache'siz anlık veri çekme (String değerler için)
async function getInstantStringSetting(key: string): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) return null;
        return data.value;
    } catch {
        return null;
    }
}

export async function getDeadline(): Promise<{ date: Date; display: string }> {
    const val = await getInstantStringSetting('deadline');

    if (!val) return { date: DEFAULT_DEADLINE, display: DEFAULT_DEADLINE_DISPLAY };

    const deadlineDate = new Date(val);
    const display = deadlineDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return { date: deadlineDate, display };
}

export async function getGraduationDate(): Promise<{ date: Date; display: string }> {
    const val = await getInstantStringSetting('graduation_date');

    if (!val) return { date: DEFAULT_GRADUATION_DATE, display: DEFAULT_GRADUATION_DATE_DISPLAY };

    const gradDate = new Date(val);
    const display = gradDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return { date: gradDate, display };
}

// Helper: Cache'siz anlık veri çekme (Kritik ayarlar için)
async function getInstantSetting(key: string, defaultValue: boolean): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) return defaultValue;
        return data.value === 'true';
    } catch {
        return defaultValue;
    }
}

export async function isMessagingEnabled(): Promise<boolean> {
    return getInstantSetting('messaging_enabled', true);
}

export async function isVotingEnabled(): Promise<boolean> {
    return getInstantSetting('voting_enabled', true);
}

export async function isRegistrationEnabled(): Promise<boolean> {
    return getInstantSetting('registration_enabled', true);
}

export async function isMaintenanceMode(): Promise<boolean> {
    return getInstantSetting('maintenance_mode', false);
}
