// lib/settings.ts
import { createClient } from '@/lib/supabase/server';

export interface SiteSettings {
    id: string;
    key: string;
    value: string;
    description?: string;
    updated_at: string;
}

// Default deadline - Şubat 9, 2026 (month is 0-indexed, so 1 = February)
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
