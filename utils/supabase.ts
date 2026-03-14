import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

const TABLE_NAME = 'game_saves';

export async function loadCloudSave(userId: string): Promise<Record<string, unknown> | null> {
  try {
    console.log('[Supabase] Loading cloud save for user:', userId);
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('game_state')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Supabase] No cloud save found for user');
        return null;
      }
      console.warn('[Supabase] Load error:', error.message);
      return null;
    }

    console.log('[Supabase] Loaded cloud save successfully');
    return data?.game_state as Record<string, unknown> ?? null;
  } catch (e) {
    console.warn('[Supabase] Load failed:', e);
    return null;
  }
}

export async function saveToCloud(userId: string, gameState: Record<string, unknown>): Promise<boolean> {
  try {
    console.log('[Supabase] Saving to cloud for user:', userId);
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(
        {
          user_id: userId,
          game_state: gameState,
          updated_at: new Date().toISOString(),
          platform: Platform.OS,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.warn('[Supabase] Save error:', error.message);
      return false;
    }

    console.log('[Supabase] Saved to cloud successfully');
    return true;
  } catch (e) {
    console.warn('[Supabase] Save failed:', e);
    return false;
  }
}

export async function deleteCloudSave(userId: string): Promise<boolean> {
  try {
    console.log('[Supabase] Deleting cloud save for user:', userId);
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn('[Supabase] Delete error:', error.message);
      return false;
    }

    console.log('[Supabase] Cloud save deleted');
    return true;
  } catch (e) {
    console.warn('[Supabase] Delete failed:', e);
    return false;
  }
}

export async function loadUserProfile(userId: string): Promise<{ email: string; display_name: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email, display_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[Supabase] Profile load error:', error.message);
      return null;
    }

    return data;
  } catch (e) {
    console.warn('[Supabase] Profile load failed:', e);
    return null;
  }
}
