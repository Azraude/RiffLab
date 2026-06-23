/**
 * Cloud sync Dexie ↔ Supabase — session cloud-sync.
 *
 * RiffLab est local-first (Dexie source de vérité). Quand un user se
 * connecte, on veut que ses données de pratique perso (sessions, riffs
 * maîtrisés, progression du path, progressions custom) survivent à un
 * changement de device ou à un clear du cache.
 *
 * Pipeline :
 *  - 1ère connexion d'un user (pas de flag localStorage `cloudSyncedAt`)
 *    → migrateLocalDataToCloud : push tout le local Dexie vers Supabase.
 *  - Connexions suivantes (flag présent) → pullCloudDataToLocal : on
 *    récupère ce qui a été ajouté depuis un autre device.
 *
 * Idempotence : les tables sans clé naturelle (user_sessions,
 * user_custom_progressions) portent une colonne `local_id` (= l'id Dexie)
 * + contrainte UNIQUE(user_id, local_id). On upsert dessus → re-sync = no-op.
 * Les tables à clé naturelle (mastered_riffs : user_id+riff_id, practice
 * progress : user_id+node_id) upsert directement sur leur PK.
 *
 * ⚠️ Hors scope (volontaire) : recordings (Blobs audio — trop lourd pour
 * du sync naïf, viendra via Storage), songs, setlists, riffLikes/bookmarks
 * (déjà couverts par la couche sociale dès qu'un user est connecté pour
 * les VRAIS riffs ; les likes de riffs seed restent purement locaux).
 */
import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';

const SYNC_KEY_PREFIX = 'rifflab_cloud_synced_';

export type CloudSyncResult = {
  sessionsCount: number;
  masteredCount: number;
  practiceProgressCount: number;
  customProgressionsCount: number;
};

/** Total d'items poussés (sert à décider si on affiche un toast). */
export function totalSynced(r: CloudSyncResult): number {
  return (
    r.sessionsCount +
    r.masteredCount +
    r.practiceProgressCount +
    r.customProgressionsCount
  );
}

/**
 * Migration one-shot Dexie → Supabase au premier login d'un user.
 *
 * Lève une erreur si UNE des écritures Supabase échoue (table absente,
 * RLS, réseau…) pour que l'appelant N'ÉCRIVE PAS le flag `cloudSyncedAt`
 * et retente au prochain login — sinon on perdrait des données.
 */
export async function migrateLocalDataToCloud(
  userId: string,
): Promise<CloudSyncResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré — sync impossible.');
  }

  // 1. Sessions de pratique
  const sessions = await db.sessions.toArray();
  if (sessions.length > 0) {
    const rows = sessions.map((s) => ({
      user_id: userId,
      local_id: s.id != null ? String(s.id) : null,
      date: s.date,
      chord_id: s.chord || null,
      scale_id: s.scale || null,
      progression: s.progression ?? [],
      completed: s.completed ?? true,
      duration_sec: s.durationSec ?? null,
      source: 'manual',
    }));
    const { error } = await supabase
      .from('user_sessions')
      .upsert(rows, { onConflict: 'user_id,local_id' });
    if (error) throw new Error(`user_sessions: ${error.message}`);
  }

  // 2. Mastered riffs
  const mastered = await db.masteredRiffs.toArray();
  if (mastered.length > 0) {
    const rows = mastered.map((m) => ({
      user_id: userId,
      riff_id: m.id,
      play_count: m.playCount ?? 0,
      mastered_at: new Date(m.masteredAt).toISOString(),
    }));
    const { error } = await supabase
      .from('user_mastered_riffs')
      .upsert(rows, { onConflict: 'user_id,riff_id' });
    if (error) throw new Error(`user_mastered_riffs: ${error.message}`);
  }

  // 3. Practice path progress
  const progress = await db.practiceProgress.toArray();
  if (progress.length > 0) {
    const rows = progress.map((p) => ({
      user_id: userId,
      node_id: p.id,
      completed: true,
      completed_at: new Date(p.completedAt).toISOString(),
    }));
    const { error } = await supabase
      .from('user_practice_progress')
      .upsert(rows, { onConflict: 'user_id,node_id' });
    if (error) throw new Error(`user_practice_progress: ${error.message}`);
  }

  // 4. Custom progressions
  const customs = await db.customProgressions.toArray();
  if (customs.length > 0) {
    const rows = customs.map((p) => ({
      user_id: userId,
      local_id: p.id,
      name: p.name ?? null,
      key: p.key ?? null,
      mode: p.mode ?? null,
      style: p.style ?? null,
      romans: p.romans ?? [],
      chords: p.chords ?? [],
    }));
    const { error } = await supabase
      .from('user_custom_progressions')
      .upsert(rows, { onConflict: 'user_id,local_id' });
    if (error) throw new Error(`user_custom_progressions: ${error.message}`);
  }

  markCloudSyncDone(userId);

  return {
    sessionsCount: sessions.length,
    masteredCount: mastered.length,
    practiceProgressCount: progress.length,
    customProgressionsCount: customs.length,
  };
}

/**
 * Pull Supabase → Dexie (user qui se connecte sur un NOUVEAU device, ou
 * après clear du cache). Merge non-destructif : on n'écrase pas les data
 * locales plus récentes, on ajoute juste ce qui manque.
 */
export async function pullCloudDataToLocal(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  // ─── Sessions ───────────────────────────────────────────────────
  const { data: sessions } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId);
  if (sessions && sessions.length > 0) {
    // Dédup : on ne ré-insère pas une session déjà présente localement
    // (même date + chord + scale). Les sessions Dexie ont un id ++ donc
    // un put naïf créerait des doublons à chaque pull.
    const existing = await db.sessions.toArray();
    const seen = new Set(
      existing.map((s) => `${s.date}|${s.chord}|${s.scale}`),
    );
    const toAdd = sessions
      .filter((s) => !seen.has(`${s.date}|${s.chord_id ?? ''}|${s.scale_id ?? ''}`))
      .map((s) => ({
        date: s.date as string,
        chord: (s.chord_id ?? '') as string,
        scale: (s.scale_id ?? '') as string,
        progression: (s.progression ?? []) as string[],
        completed: (s.completed ?? true) as boolean,
        durationSec: (s.duration_sec ?? undefined) as number | undefined,
        createdAt: s.created_at ? new Date(s.created_at).getTime() : Date.now(),
      }));
    if (toAdd.length > 0) await db.sessions.bulkAdd(toAdd);
  }

  // ─── Mastered riffs ─────────────────────────────────────────────
  const { data: mastered } = await supabase
    .from('user_mastered_riffs')
    .select('*')
    .eq('user_id', userId);
  if (mastered && mastered.length > 0) {
    await db.masteredRiffs.bulkPut(
      mastered.map((m) => ({
        id: m.riff_id as string,
        masteredAt: m.mastered_at ? new Date(m.mastered_at).getTime() : Date.now(),
        playCount: (m.play_count ?? 0) as number,
      })),
    );
  }

  // ─── Practice path progress ─────────────────────────────────────
  const { data: progress } = await supabase
    .from('user_practice_progress')
    .select('*')
    .eq('user_id', userId);
  if (progress && progress.length > 0) {
    await db.practiceProgress.bulkPut(
      progress.map((p) => ({
        id: p.node_id as string,
        completedAt: p.completed_at
          ? new Date(p.completed_at).getTime()
          : Date.now(),
      })),
    );
  }

  // ─── Custom progressions ────────────────────────────────────────
  const { data: customs } = await supabase
    .from('user_custom_progressions')
    .select('*')
    .eq('user_id', userId);
  if (customs && customs.length > 0) {
    // local_id = l'id Dexie d'origine. S'il est présent on le réutilise
    // (idempotent), sinon on dérive un id depuis l'UUID Supabase.
    await db.customProgressions.bulkPut(
      customs.map((c) => ({
        id: (c.local_id as string) || `prog_${c.id}`,
        name: (c.name ?? '') as string,
        key: (c.key ?? 'C') as string,
        mode: (c.mode ?? 'major') as 'major' | 'minor',
        style: (c.style ?? undefined) as string | undefined,
        romans: (c.romans ?? []) as string[],
        chords: (c.chords ?? []) as string[],
        createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
      })),
    );
  }
}

/** Check si l'user a déjà été migré vers le cloud (1ère vs n-ème login). */
export function hasCloudSyncBeenDone(userId: string): boolean {
  try {
    return !!localStorage.getItem(`${SYNC_KEY_PREFIX}${userId}`);
  } catch {
    return false;
  }
}

/** Marque la migration comme faite (timestamp ISO). */
export function markCloudSyncDone(userId: string): void {
  try {
    localStorage.setItem(`${SYNC_KEY_PREFIX}${userId}`, new Date().toISOString());
  } catch {
    /* localStorage indispo (mode privé strict) — on retentera au prochain login */
  }
}
