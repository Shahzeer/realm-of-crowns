import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const DEVICE_ID_KEY = 'realm_of_crowns_device_id';

function generateDeviceId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'dev_';
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      console.log('[Supabase] Loaded device ID:', stored);
      return stored;
    }
  } catch (e) {
    console.warn('[Supabase] Failed to read device ID from storage:', e);
  }

  const newId = generateDeviceId();
  cachedDeviceId = newId;
  console.log('[Supabase] Generated new device ID:', newId);

  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  } catch (e) {
    console.warn('[Supabase] Failed to persist device ID:', e);
  }

  return newId;
}

const TABLE_NAME = 'game_saves';

export async function ensureTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .limit(1);

    if (!error) {
      console.log('[Supabase] Table exists');
      return true;
    }

    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.log('[Supabase] Table does not exist, needs manual creation');
      return false;
    }

    console.warn('[Supabase] Table check error:', error.message);
    return false;
  } catch (e) {
    console.warn('[Supabase] Table check failed:', e);
    return false;
  }
}

export async function loadCloudSave(deviceId: string): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('game_state')
      .eq('device_id', deviceId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Supabase] No cloud save found for device');
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

export async function saveToCloud(deviceId: string, gameState: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(
        {
          device_id: deviceId,
          game_state: gameState,
          updated_at: new Date().toISOString(),
          platform: Platform.OS,
        },
        { onConflict: 'device_id' }
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

export async function deleteCloudSave(deviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('device_id', deviceId);

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
