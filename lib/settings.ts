import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export interface SiteSettings {
    id: string;
    key: string;
    value: string;
    description?: string;
    updated_at: string;
}

/**
 * Tüm site ayarlarını tek sorguda çeker — request başına 1 kere.
 * isMessagingEnabled, isVotingEnabled vs. hepsi bunu kullanır.
 */
export const getCachedSettings = cache(async (): Promise<Record<string, string>> => {
    const supabase = await createClient();
    const { data } = await supabase
        .from('site_settings')
        .select('key, value');

    if (!data) return {};

    return data.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);
});

// -------------------- Setting Getters --------------------

export async function getDeadline(): Promise<{ date: Date; display: string }> {
    const settings = await getCachedSettings();
    const val = settings['deadline'];

    if (!val) throw new Error('Setting deadline not found.');

    const deadlineDate = new Date(val);
    const display = deadlineDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return { date: deadlineDate, display };
}

export async function isMessagingEnabled(): Promise<boolean> {
    const settings = await getCachedSettings();
    if (settings['messaging_enabled'] !== 'true') return false;

    const val = settings['deadline'];
    if (val) {
        if (new Date() > new Date(val)) return false;
    }
    return true;
}

export async function isVotingEnabled(): Promise<boolean> {
    const settings = await getCachedSettings();
    if (settings['voting_enabled'] !== 'true') return false;

    const val = settings['deadline'];
    if (val) {
        if (new Date() > new Date(val)) return false;
    }
    return true;
}

export async function isRegistrationEnabled(): Promise<boolean> {
    const settings = await getCachedSettings();
    return settings['registration_enabled'] === 'true';
}

export async function isGalleryEnabled(): Promise<boolean> {
    const settings = await getCachedSettings();
    if (settings['gallery_enabled'] === 'false') return false; // Default true if not explicitly false

    const val = settings['deadline'];
    if (val) {
        if (new Date() > new Date(val)) return false;
    }
    return true;
}

export async function getAnnouncementSettings(): Promise<{ enabled: boolean; message: string }> {
    const settings = await getCachedSettings();
    return {
        enabled: settings['announcement_enabled'] === 'true',
        message: settings['announcement_message'] || ''
    };
}

export async function getSystemClosedMessage(type: 'messaging' | 'voting' | 'gallery' = 'messaging'): Promise<string> {
    const settings = await getCachedSettings();
    
    let typeName = 'Mesajlaşma ve düzenleme';
    if (type === 'voting') typeName = 'Oylama';
    if (type === 'gallery') typeName = 'Fotoğraf ekleme ve silme';
    
    // Yıllık bitiş tarihi (deadline) en büyük önceliğe sahip
    const val = settings['deadline'];
    if (val) {
        const deadlineDate = new Date(val);
        if (new Date() > deadlineDate) {
            const display = deadlineDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            return `Süre doldu: Yıllık için belirlenen son katılım tarihi (${display}) geçmiştir.`;
        }
    }

    const settingKey = `${type}_enabled`;
    if (settings[settingKey] === 'false') {
        return `Sistem kilitli: ${typeName} işlemleri yöneticisi tarafından durdurulmuştur.`;
    } else if (settings[settingKey] !== 'true' && settings[settingKey] !== undefined) {
        return `Sistem kilitli: ${typeName} işlemleri yöneticisi tarafından durdurulmuştur.`;
    }

    return `${typeName} kapalıdır.`;
}