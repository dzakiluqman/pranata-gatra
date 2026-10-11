import { decode } from 'base64-arraybuffer';

import type { Profile } from '@/features/auth/types/auth.types';
import { supabase } from '@/lib/supabase';

export interface UpdateProfileInput {
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

export interface ProfileServiceResult<T = void> {
  data?: T;
  error: Error | null;
}

/**
 * Fetch profile from public.profiles table
 */
export async function fetchProfile(userId: string): Promise<ProfileServiceResult<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { error: new Error(error.message) };
    }

    return { data: (data as Profile) ?? undefined, error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Gagal mengambil data profil.'),
    };
  }
}

/**
 * Upload an avatar image file to Supabase Storage in the 'avatars' bucket.
 * Path pattern: avatars/{userId}/avatar.{ext}
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string,
  base64?: string | null,
  mimeType?: string,
): Promise<ProfileServiceResult<string>> {
  try {
    let arrayBuffer: ArrayBuffer;

    if (base64) {
      arrayBuffer = decode(base64);
    } else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    }

    const resolvedMime = mimeType || 'image/png';
    const isJpeg = resolvedMime.includes('jpeg') || resolvedMime.includes('jpg');
    const ext = isJpeg ? 'jpg' : 'png';
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: resolvedMime,
        upsert: true,
      });

    if (uploadError) {
      return { error: new Error(`Gagal mengunggah foto ke storage: ${uploadError.message}`) };
    }

    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Append cache-busting timestamp so the new image immediately renders everywhere
    const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

    return { data: publicUrl, error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Terjadi kesalahan saat mengunggah foto profil.'),
    };
  }
}

/**
 * Updates both the 'profiles' database table and Supabase Auth metadata.
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileInput,
): Promise<ProfileServiceResult<Profile>> {
  try {
    const payload: Record<string, any> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };

    if (updates.full_name !== undefined) {
      payload.full_name = updates.full_name;
    }

    if (updates.avatar_url !== undefined) {
      payload.avatar_url = updates.avatar_url;
    }

    if (updates.email) {
      payload.email = updates.email;
    }

    // 1. Update profiles table via upsert
    const { data, error: dbError } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('id, email, full_name, avatar_url, created_at, updated_at')
      .single();

    if (dbError) {
      return { error: new Error(`Gagal memperbarui tabel profil: ${dbError.message}`) };
    }

    // 2. Sync to Supabase auth user_metadata so app-wide sessions stay in sync
    const authData: Record<string, any> = {};
    if (updates.full_name !== undefined) authData.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) authData.avatar_url = updates.avatar_url;

    if (Object.keys(authData).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({
        data: authData,
      });
      if (authError) {
        console.warn('[profileService] updateUser metadata warning:', authError.message);
      }
    }

    return { data: data as Profile, error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Terjadi kesalahan saat menyimpan profil.'),
    };
  }
}
