/**
 * progressionApi — sauvegarde des progressions custom du Studio.
 *
 * Local-first : on écrit TOUJOURS dans Dexie (`customProgressions`), ce qui
 * suffit pour retrouver ses progressions sur le même device + déclenche le
 * cloud-sync au prochain login (cf. cloudSync.ts). Si l'user est déjà
 * connecté, on pousse aussi immédiatement vers Supabase
 * (`user_custom_progressions`) pour la persistance cross-device en temps réel.
 *
 * Le push Supabase est best-effort : une erreur réseau/RLS ne fait PAS
 * échouer la sauvegarde locale (qui est la source de vérité).
 */
import {
  saveCustomProgression as saveCustomProgressionDexie,
  newCustomProgressionId,
  type CustomProgression,
} from './db';
import { supabase, isSupabaseConfigured } from './supabase';

export type SaveProgressionInput = {
  name: string;
  chords: string[];
  key: string;
  mode: 'major' | 'minor';
  /** Degrés romains (I, vi, IV, V…) — optionnel, défaut []. */
  romans?: string[];
  /** Style de génération (pop / rock / jazz…) — optionnel. */
  style?: string;
};

/**
 * Sauvegarde une progression custom (Dexie + Supabase si connecté).
 * Retourne l'objet CustomProgression persisté localement.
 */
export async function saveCustomProgression(
  input: SaveProgressionInput,
): Promise<CustomProgression> {
  const row: CustomProgression = {
    id: newCustomProgressionId(),
    name: input.name,
    key: input.key,
    mode: input.mode,
    style: input.style,
    romans: input.romans ?? [],
    chords: input.chords,
    createdAt: Date.now(),
  };

  // 1. Dexie — source de vérité locale (toujours).
  await saveCustomProgressionDexie(row);

  // 2. Supabase — best-effort, uniquement si connecté.
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (userId) {
        await supabase.from('user_custom_progressions').upsert(
          {
            user_id: userId,
            local_id: row.id,
            name: row.name,
            key: row.key,
            mode: row.mode,
            style: row.style ?? null,
            romans: row.romans,
            chords: row.chords,
          },
          { onConflict: 'user_id,local_id' },
        );
      }
    } catch {
      // Push cloud échoué → pas grave, le cloud-sync rattrapera au login.
    }
  }

  return row;
}
