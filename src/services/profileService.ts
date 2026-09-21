import { supabase } from '@/lib/supabase';

export type UserRole = 'farmer' | 'consumer' | 'logistics' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  place: string;
  area: string;
  role: UserRole;
  state?: string | null;
  district?: string | null;
  fpo_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Maps frontend role ('consumer') to database allowed role ('consumer')
 * and normalizes legacy 'buyer' to 'consumer'.
 */
export function toDbRole(role: string | null | undefined): string {
  if (!role) return 'consumer';
  const clean = role.trim().toLowerCase();
  if (clean === 'buyer') return 'consumer';
  return clean;
}

/**
 * Maps database role back to frontend role ('consumer').
 */
export function fromDbRole(role: string | null | undefined): UserRole {
  if (!role) return 'consumer';
  const clean = role.trim().toLowerCase();
  if (clean === 'buyer' || clean === 'consumer') return 'consumer';
  if (clean === 'farmer' || clean === 'logistics' || clean === 'admin') return clean as UserRole;
  return 'consumer';
}

/**
 * Checks whether a user profile has all mandatory fields populated.
 * Section 7: A profile is complete when ALL of these are present and non-empty:
 * - full_name
 * - username
 * - role
 * - place
 * - area
 */
export function isProfileComplete(profile: Partial<UserProfile> | null | undefined): boolean {
  if (!profile) return false;
  if ((profile.role as string) === 'admin') return true;
  const normalizedRole = fromDbRole(profile.role);
  return Boolean(
    profile.full_name &&
    profile.full_name.trim().length > 0 &&
    profile.username &&
    profile.username.trim().length > 0 &&
    ['farmer', 'consumer', 'logistics'].includes(normalizedRole) &&
    profile.place &&
    profile.place.trim().length > 0 &&
    profile.area &&
    profile.area.trim().length > 0
  );
}

/**
 * Fetch profile by Supabase Auth user ID (profiles.id = auth.users.id).
 * Uses RLS policy: auth.uid() = id.
 */
export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile for user ID:', userId, error.message);
      return null;
    }
    if (data) {
      const p = data as any;
      p.role = fromDbRole(p.role);
      return p as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('getProfileByUserId exception:', err);
    return null;
  }
}

/**
 * Check if a username is available (case-insensitive).
 * Calls the secure database RPC `check_username_available` without exposing any other profile rows.
 */
export async function checkUsernameAvailable(
  username: string,
  currentUserId?: string
): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  if (!clean) return false;

  try {
    // 1. Attempt RPC call
    const { data, error } = await supabase.rpc('check_username_available', {
      username_to_check: clean,
      current_user_id: currentUserId || null,
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }

    // 2. Fallback query if RPC has not yet been migrated
    const { data: rows, error: qError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', clean)
      .limit(1);

    if (qError) {
      // If column doesn't exist yet, username is provisionally acceptable
      return true;
    }

    if (!rows || rows.length === 0) return true;
    if (currentUserId && rows[0].id === currentUserId) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Resolves a username to an authentication email via the secure server-side endpoint.
 * Does not expose phone, name, place, area, or other private profile fields.
 */
export async function resolveUsernameToEmail(username: string): Promise<string | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;

  try {
    const res = await fetch('/api/auth/resolve-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: clean }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.email || null;
  } catch {
    return null;
  }
}

/**
 * Save or update profile in public.profiles.
 * Strictly links profiles.id = auth.users.id.
 */
export async function upsertProfile(
  profileData: Partial<UserProfile> & { id: string }
): Promise<{ profile: UserProfile | null; error: string | null }> {
  try {
    const cleanUsername = profileData.username ? profileData.username.trim().toLowerCase() : undefined;

    // Verify username availability if updated
    if (cleanUsername) {
      const isAvailable = await checkUsernameAvailable(cleanUsername, profileData.id);
      if (!isAvailable) {
        return { profile: null, error: 'Username is already taken. Please choose another.' };
      }
    }

    const targetDbRole = toDbRole(profileData.role || 'consumer');

    const payload: Record<string, unknown> = {
      id: profileData.id,
      full_name: profileData.full_name?.trim() || '',
      place: profileData.place?.trim() || '',
      area: profileData.area?.trim() || '',
      role: targetDbRole,
      updated_at: new Date().toISOString(),
    };

    if (cleanUsername !== undefined) payload.username = cleanUsername;
    if (profileData.email !== undefined) payload.email = profileData.email?.trim() || null;
    if (profileData.phone !== undefined) payload.phone = profileData.phone?.trim() || null;
    if (profileData.state !== undefined) payload.state = profileData.state?.trim() || null;
    if (profileData.district !== undefined) payload.district = profileData.district?.trim() || null;
    if (profileData.fpo_name !== undefined) payload.fpo_name = profileData.fpo_name?.trim() || null;

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('upsertProfile DB error:', error.message);
      // Handle schema column missing error gracefully
      if (error.code === '42703') {
        // Fallback omitting columns if migration not run yet
        delete payload.username;
        delete payload.email;
        delete payload.area;
        delete payload.updated_at;
        const { data: fallbackData, error: fbError } = await supabase
          .from('profiles')
          .upsert(payload)
          .select()
          .single();
        if (fbError) {
          return { profile: null, error: fbError.message };
        }
        if (fallbackData) {
          const p = fallbackData as any;
          p.role = fromDbRole(p.role);
          return { profile: p as UserProfile, error: null };
        }
      }
      return { profile: null, error: error.message };
    }

    if (data) {
      const p = data as any;
      p.role = fromDbRole(p.role);
      return { profile: p as UserProfile, error: null };
    }
    return { profile: null, error: null };
  } catch (err: unknown) {
    const error = err as Error;
    return { profile: null, error: error.message || 'Failed to save profile' };
  }
}

export const VALID_ROLES: (UserRole | 'buyer')[] = ['farmer', 'consumer', 'buyer', 'logistics'];

/**
 * Validate that a role is strictly one of the allowed roles.
 * Automatically normalizes 'buyer' to 'consumer' for frontend routing.
 */
export function validateRole(roleInput: string | null | undefined): UserRole | null {
  if (!roleInput) return null;
  const normalized = roleInput.trim().toLowerCase();
  if (normalized === 'buyer' || normalized === 'consumer') {
    return 'consumer';
  }
  if (normalized === 'farmer' || normalized === 'logistics') {
    return normalized as UserRole;
  }
  return null;
}

/**
 * Deterministically generates a unique username from a display name and checks database availability.
 */
export async function generateUniqueUsername(
  baseName: string,
  currentUserId?: string
): Promise<string> {
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'user';

  const candidate = sanitized.slice(0, 20);
  if (await checkUsernameAvailable(candidate, currentUserId)) {
    return candidate;
  }

  for (let i = 2; i <= 50; i++) {
    const nextCandidate = `${sanitized.slice(0, 16)}_${i}`;
    if (await checkUsernameAvailable(nextCandidate, currentUserId)) {
      return nextCandidate;
    }
  }

  return `${sanitized.slice(0, 12)}_${Date.now().toString().slice(-4)}`;
}

