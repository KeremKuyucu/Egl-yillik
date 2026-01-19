// lib/settings.ts
import { createClient } from '@/lib/supabase/server';

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

export async function getDeadline(): Promise<{ date: Date; display: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'deadline')
            .single();

        if (error || !data) {
            return { date: DEFAULT_DEADLINE, display: DEFAULT_DEADLINE_DISPLAY };
        }

        const deadlineDate = new Date(data.value);
        const display = deadlineDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        return { date: deadlineDate, display };
    } catch {
        return { date: DEFAULT_DEADLINE, display: DEFAULT_DEADLINE_DISPLAY };
    }
}

const DEFAULT_GRADUATION_DATE = new Date(2026, 5, 26, 17, 0, 0); // 26 Haziran 2026 (Ay 0-indexed: 5 = Haziran)
const DEFAULT_GRADUATION_DATE_DISPLAY = '26 Haziran 2026';

export async function getGraduationDate(): Promise<{ date: Date; display: string }> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'graduation_date')
            .single();

        if (error || !data) {
            return { date: DEFAULT_GRADUATION_DATE, display: DEFAULT_GRADUATION_DATE_DISPLAY };
        }

        const gradDate = new Date(data.value);
        const display = gradDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        return { date: gradDate, display };
    } catch {
        return { date: DEFAULT_GRADUATION_DATE, display: DEFAULT_GRADUATION_DATE_DISPLAY };
    }
}

export async function getSetting(key: string): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) {
            return null;
        }

        return data.value;
    } catch {
        return null;
    }
}

// Boolean ayarlar için helper
export async function getBooleanSetting(key: string, defaultValue: boolean = true): Promise<boolean> {
    const value = await getSetting(key);
    if (value === null) return defaultValue;
    return value === 'true';
}

// Sistemin açık/kapalı ayarları
export async function isMessagingEnabled(): Promise<boolean> {
    return getBooleanSetting('messaging_enabled', true);
}

export async function isVotingEnabled(): Promise<boolean> {
    return getBooleanSetting('voting_enabled', true);
}

export async function isRegistrationEnabled(): Promise<boolean> {
    return getBooleanSetting('registration_enabled', true);
}

// Tüm ayarları bir kerede çekmek için
export async function getAllSettings(): Promise<Record<string, string>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('key, value');

        if (error || !data) return {};

        const settings: Record<string, string> = {};
        data.forEach((item) => {
            settings[item.key] = item.value;
        });

        return settings;
    } catch {
        return {};
    }
}
