"use server"

import { createClient } from '@/lib/supabase/server';

export async function checkRegistrationEnabled() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'registration_enabled')
            .single();

        if (error || !data) {
            // Default: registration is enabled
            return { enabled: true };
        }

        return { enabled: data.value !== 'false' };
    } catch {
        return { enabled: true };
    }
}
