"use server"

import { createClient } from '@/lib/supabase/server';

export interface SiteSettings {
    id: string;
    key: string;
    value: string;
    description?: string;
    updated_at: string;
}

// Helper: Cache'siz anlık veri çekme (String değerler için)
async function getInstantStringSetting(key: string): Promise<string> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) {
        throw new Error(`Setting ${key} not found.`);
    }
    return data.value;
}

export async function getDeadline(): Promise<{ date: Date; display: string }> {
    const val = await getInstantStringSetting('deadline');

    const deadlineDate = new Date(val);
    const display = deadlineDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return { date: deadlineDate, display };
}

// Helper: Cache'siz anlık veri çekme (Kritik ayarlar için)
async function getInstantSetting(key: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) {
        throw new Error(`Setting ${key} not found.`);
    }
    return data.value === 'true';
}

export async function isMessagingEnabled(): Promise<boolean> {
    return getInstantSetting('messaging_enabled');
}

export async function isVotingEnabled(): Promise<boolean> {
    return getInstantSetting('voting_enabled');
}

export async function isRegistrationEnabled(): Promise<boolean> {
    return getInstantSetting('registration_enabled');
}

export async function getAnnouncementSettings(): Promise<{ enabled: boolean; message: string }> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['announcement_enabled', 'announcement_message']);

    const settings = data?.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>) || {};

    return {
        enabled: settings['announcement_enabled'] === 'true',
        message: settings['announcement_message'] || ''
    };
}