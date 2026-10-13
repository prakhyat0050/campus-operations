import { supabase } from '@/integrations/supabase/client';
import type { CampusRole } from './access';

export type CampusProfile = {
    user_id: string;
    display_name: string | null;
    email: string | null;
    role: CampusRole;
    created_at?: string;
    updated_at?: string;
};

export async function getCampusProfile(userId?: string) {
    const resolvedUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!resolvedUserId) return null;

    const { data, error } = await supabase
        .from('campus_profiles')
        .select('*')
        .eq('user_id', resolvedUserId)
        .maybeSingle();

    if (error) {
        throw new Error(`Campus profile could not be loaded. ${error.message}`);
    }

    return (data as CampusProfile | null) ?? null;
}

export async function syncCampusProfile({
    role,
    displayName,
    email,
}: {
    role: CampusRole;
    displayName?: string | null;
    email?: string | null;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('You must be signed in to save your campus profile.');
    }

    const row = {
        user_id: user.id,
        display_name: displayName ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        email: email ?? user.email ?? null,
        role,
    };

    const { data, error } = await supabase
        .from('campus_profiles')
        .upsert(row, { onConflict: 'user_id' })
        .select('*')
        .single();

    if (error) {
        throw new Error(`Campus profile could not be saved. ${error.message}`);
    }

    return data as CampusProfile;
}
