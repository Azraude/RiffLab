/**
 * Profile API étendu (sess PROFIL).
 *
 * Complète `socialApi.ts` avec les nouveaux champs : cover_url, instruments,
 * liens externes (Instagram / YouTube / SoundCloud / Site web).
 *
 * Pourquoi un fichier séparé : socialApi.ts est en cours d'évolution dans
 * une autre session (hotfix comments). On évite les conflits de merge en
 * isolant l'ajout côté nouveau module. À fusionner dans socialApi à terme.
 */
import { supabase, isSupabaseConfigured } from './supabase';

// ─── Types ──────────────────────────────────────────────────────────

/** Sous-ensemble des instruments connus. Reste extensible (TEXT[] côté DB). */
export type InstrumentId = 'acoustic' | 'electric' | 'classical' | 'bass';

export const INSTRUMENTS: { id: InstrumentId; label: string; emoji: string }[] = [
  { id: 'acoustic', label: 'Folk acoustique', emoji: '🪕' },
  { id: 'electric', label: 'Électrique', emoji: '🎸' },
  { id: 'classical', label: 'Classique', emoji: '🎻' },
  { id: 'bass', label: 'Basse', emoji: '🎸' },
];

export const INSTRUMENT_LABELS: Record<InstrumentId, string> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.id, i.label]),
) as Record<InstrumentId, string>;

/** Champs profile étendus (en plus de socialApi.Profile). */
export type ProfileExtensions = {
  cover_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  soundcloud_url: string | null;
  website_url: string | null;
  instruments: string[]; // typé `string[]` côté DB pour rester laxe
};

/** Patch accepté par updateProfileExtended. */
export type ProfilePatch = Partial<{
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  soundcloud_url: string | null;
  website_url: string | null;
  instruments: string[];
}>;

// ─── Covers ────────────────────────────────────────────────────────

/** Les 5 covers default bundled dans public/covers/. */
export const DEFAULT_COVERS = [
  { id: 'forge', label: 'Forge', path: '/covers/cover-forge.svg' },
  { id: 'manche', label: 'Manche', path: '/covers/cover-manche.svg' },
  { id: 'studio', label: 'Studio', path: '/covers/cover-studio.svg' },
  { id: 'neon', label: 'Néon', path: '/covers/cover-neon.svg' },
  { id: 'vintage', label: 'Vintage', path: '/covers/cover-vintage.svg' },
] as const;

export const DEFAULT_COVER_PATH = DEFAULT_COVERS[0].path; // forge

export function resolveCoverUrl(cover_url: string | null | undefined): string {
  return cover_url && cover_url.length > 0 ? cover_url : DEFAULT_COVER_PATH;
}

// ─── Helpers ────────────────────────────────────────────────────────

function notConfigured(): { data: null; error: Error } {
  return { data: null, error: new Error('Supabase non configuré') };
}

// ─── Update étendu ─────────────────────────────────────────────────

/**
 * Update profile avec champs étendus (cover, instruments, links).
 * Idempotent : envoie uniquement les champs fournis dans le patch.
 */
export async function updateProfileExtended(
  id: string,
  patch: ProfilePatch,
): Promise<{ data: unknown | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const payload = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();
  return { data, error: error ? new Error(error.message) : null };
}

// ─── Upload cover (bucket 'covers') ────────────────────────────────

/**
 * Upload custom cover dans bucket `covers/<userId>/cover-<ts>.<ext>`.
 * Bucket public, donc URL accessible sans auth.
 */
export async function uploadCover(
  userId: string,
  file: File,
): Promise<{ data: string | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  if (file.size > 3 * 1024 * 1024) {
    return { data: null, error: new Error('Image trop lourde (max 3 MB)') };
  }
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${userId}/cover-${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('covers')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) return { data: null, error: new Error(uploadErr.message) };
  const { data: publicUrl } = supabase.storage.from('covers').getPublicUrl(path);
  return { data: publicUrl.publicUrl, error: null };
}

// ─── Upload avatar (bucket 'avatars') ──────────────────────────────

/**
 * Upload avatar dans bucket `avatars/<userId>/avatar-<ts>.<ext>`.
 * Bucket public → URL accessible sans auth. Retourne l'URL publique ;
 * l'appelant l'injecte dans le patch (`avatar_url`) puis updateProfileExtended.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ data: string | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  if (file.size > 3 * 1024 * 1024) {
    return { data: null, error: new Error('Image trop lourde (max 3 MB)') };
  }
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) return { data: null, error: new Error(uploadErr.message) };
  const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
  return { data: publicUrl.publicUrl, error: null };
}

// ─── Validation URLs ───────────────────────────────────────────────

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** Renvoie le message d'erreur ou null si valide / vide. */
export function validateProfileUrl(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (!URL_REGEX.test(trimmed)) {
    return `${fieldLabel} : URL invalide (commence par https://...)`;
  }
  if (trimmed.length > 300) return `${fieldLabel} : trop long (max 300)`;
  return null;
}
