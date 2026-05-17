/**
 * Base de données locale (IndexedDB via Dexie).
 * Persiste tes sons, sessions de pratique, préférences.
 */
import Dexie, { type Table } from 'dexie';
import type { TuningId, NoteName } from './theory';

// ─── Types ─────────────────────────────────────────────────────
export type StrumDir = 'down' | 'up' | 'mute' | 'rest';

export type StrumPattern = {
  beats: StrumDir[];        // ex: ['down', 'down', 'up', 'mute', 'down', 'up']
  subdivision: 4 | 8 | 16;
};

export type ChordRef = {
  name: string;             // ex: 'Em', 'F#m7'
  beats: number;            // durée en temps
};

export type Section = {
  id: string;
  name: string;             // 'Intro', 'Couplet', 'Refrain', 'Pont', 'Solo'
  chords: ChordRef[];
  strumPattern?: StrumPattern;
  lyrics?: string;
  loop?: boolean;
};

export type SongStatus = 'à bosser' | 'intermédiaire' | 'maîtrisé';

export type Song = {
  id: string;
  title: string;
  artist?: string;
  key: NoteName;
  mode: 'major' | 'minor';
  tempo: number;            // BPM
  capo: number;
  tuning: TuningId;
  tags: string[];
  status: SongStatus;
  sections: Section[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type PracticeSession = {
  id?: number;
  date: string;             // YYYY-MM-DD
  chord: string;
  scale: string;
  progression: string[];
  completed: boolean;
  durationSec?: number;
  createdAt: number;
};

export type Setlist = {
  id: string;
  name: string;
  songIds: string[];        // ordre = ordre de lecture
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type Recording = {
  id: string;
  songId: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  name?: string;            // titre custom optionnel
  createdAt: number;
  /** Si true, l'audio est destiné à un playback en boucle (looper pedal) */
  isLoop?: boolean;
};

export type PracticePathNode = {
  /** ID stable du node (ex: 'bases', 'strumming', etc.) */
  id: string;
  completedAt: number;
};

export type RiffLike = {
  /** ID du community riff liké (ex: 'cr-smoke') */
  id: string;
  likedAt: number;
};

export type RiffBookmark = {
  id: string;
  bookmarkedAt: number;
};

export type RiffRating = {
  id: string;
  /** Note 1-5 */
  rating: number;
  ratedAt: number;
};

export type InteractionType = 'chord' | 'scale' | 'technique' | 'song';
export type Interaction = {
  /** Clé composite : `${type}:${itemId}` (ex: "chord:Em", "scale:penta_minor") */
  key: string;
  type: InteractionType;
  itemId: string;
  interactedAt: number;
};

/** Daily challenge — un défi quotidien pré-pickés depuis tabsDatabase. */
export type DailyChallenge = {
  /** YYYY-MM-DD — sert de PK */
  date: string;
  tabId: string;
  completedAt: number;
};

// ─── Database ──────────────────────────────────────────────────
class RiffLabDB extends Dexie {
  songs!: Table<Song, string>;
  sessions!: Table<PracticeSession, number>;
  setlists!: Table<Setlist, string>;
  recordings!: Table<Recording, string>;
  practiceProgress!: Table<PracticePathNode, string>;
  riffLikes!: Table<RiffLike, string>;
  riffBookmarks!: Table<RiffBookmark, string>;
  riffRatings!: Table<RiffRating, string>;
  interactions!: Table<Interaction, string>;
  dailyChallenges!: Table<DailyChallenge, string>;

  constructor() {
    super('rifflab');
    this.version(1).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
    });
    // v2 : ajout des setlists
    this.version(2).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
      setlists: 'id, name, updatedAt',
    });
    // v3 : ajout des recordings (blob audio par song)
    this.version(3).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
      setlists: 'id, name, updatedAt',
      recordings: 'id, songId, createdAt',
    });
    // v4 : ajout du practiceProgress (path Duolingo-style)
    this.version(4).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
      setlists: 'id, name, updatedAt',
      recordings: 'id, songId, createdAt',
      practiceProgress: 'id, completedAt',
    });
    // v5 : ajout des riffLikes (community riff hebdomadaire)
    this.version(5).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
      setlists: 'id, name, updatedAt',
      recordings: 'id, songId, createdAt',
      practiceProgress: 'id, completedAt',
      riffLikes: 'id, likedAt',
    });
    // v6 : community riffs hub — bookmarks + ratings
    this.version(6).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
      setlists: 'id, name, updatedAt',
      recordings: 'id, songId, createdAt',
      practiceProgress: 'id, completedAt',
      riffLikes: 'id, likedAt',
      riffBookmarks: 'id, bookmarkedAt',
      riffRatings: 'id, ratedAt',
    });
    // v7 : interactions log pour auto-validation Practice Plan
    this.version(7).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
      setlists: 'id, name, updatedAt',
      recordings: 'id, songId, createdAt',
      practiceProgress: 'id, completedAt',
      riffLikes: 'id, likedAt',
      riffBookmarks: 'id, bookmarkedAt',
      riffRatings: 'id, ratedAt',
      interactions: 'key, type, itemId, interactedAt',
    });
    // v8 : Daily Challenge — un défi quotidien (tab pické deterministe par date)
    this.version(8).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
      setlists: 'id, name, updatedAt',
      recordings: 'id, songId, createdAt',
      practiceProgress: 'id, completedAt',
      riffLikes: 'id, likedAt',
      riffBookmarks: 'id, bookmarkedAt',
      riffRatings: 'id, ratedAt',
      interactions: 'key, type, itemId, interactedAt',
      dailyChallenges: 'date, completedAt',
    });
  }
}

export const db = new RiffLabDB();

// ─── Helpers ───────────────────────────────────────────────────
export function newSongId() {
  return 'song_' + crypto.randomUUID();
}

export function newSectionId() {
  return 'sec_' + crypto.randomUUID();
}

export function newSetlistId() {
  return 'sl_' + crypto.randomUUID();
}

export function emptySetlist(partial: Partial<Setlist> = {}): Setlist {
  const now = Date.now();
  return {
    id: newSetlistId(),
    name: 'Nouvelle setlist',
    songIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function newRecordingId() {
  return 'rec_' + crypto.randomUUID();
}

// ─── Riff likes (community riff) ─────────────────────────────────
export async function isRiffLiked(id: string): Promise<boolean> {
  return !!(await db.riffLikes.get(id));
}

export async function toggleRiffLike(id: string): Promise<boolean> {
  const exists = await db.riffLikes.get(id);
  if (exists) {
    await db.riffLikes.delete(id);
    return false;
  }
  await db.riffLikes.put({ id, likedAt: Date.now() });
  return true;
}

// ─── Riff bookmarks + ratings (community riff hub v6) ────────────
export async function isRiffBookmarked(id: string): Promise<boolean> {
  return !!(await db.riffBookmarks.get(id));
}

export async function toggleRiffBookmark(id: string): Promise<boolean> {
  const exists = await db.riffBookmarks.get(id);
  if (exists) {
    await db.riffBookmarks.delete(id);
    return false;
  }
  await db.riffBookmarks.put({ id, bookmarkedAt: Date.now() });
  return true;
}

export async function listBookmarkedRiffIds(): Promise<string[]> {
  const all = await db.riffBookmarks.toArray();
  return all.map((b) => b.id);
}

export async function getUserRating(id: string): Promise<number | null> {
  const r = await db.riffRatings.get(id);
  return r?.rating ?? null;
}

export async function setUserRating(id: string, rating: number): Promise<void> {
  await db.riffRatings.put({ id, rating, ratedAt: Date.now() });
}

export async function clearUserRating(id: string): Promise<void> {
  await db.riffRatings.delete(id);
}

// ─── Interactions log (auto-validation Practice Plan v7) ─────────
export async function markInteraction(
  type: InteractionType,
  itemId: string
): Promise<void> {
  const key = `${type}:${itemId}`;
  await db.interactions.put({ key, type, itemId, interactedAt: Date.now() });
}

export async function hasInteracted(
  type: InteractionType,
  itemId: string
): Promise<boolean> {
  const key = `${type}:${itemId}`;
  return !!(await db.interactions.get(key));
}

export async function listInteractions(): Promise<Interaction[]> {
  return db.interactions.toArray();
}

// ─── Recording CRUD ──────────────────────────────────────────────
export async function listRecordings(songId: string): Promise<Recording[]> {
  return db.recordings.where('songId').equals(songId).reverse().sortBy('createdAt');
}

export async function saveRecording(rec: Recording): Promise<void> {
  await db.recordings.put(rec);
}

export async function deleteRecording(id: string): Promise<void> {
  await db.recordings.delete(id);
}

export async function countRecordings(songId: string): Promise<number> {
  return db.recordings.where('songId').equals(songId).count();
}

export async function countRecordingsBySong(): Promise<Record<string, number>> {
  const all = await db.recordings.toArray();
  const out: Record<string, number> = {};
  for (const r of all) out[r.songId] = (out[r.songId] ?? 0) + 1;
  return out;
}

// ─── Setlist CRUD ──────────────────────────────────────────────
export async function listSetlists(): Promise<Setlist[]> {
  return db.setlists.orderBy('updatedAt').reverse().toArray();
}

export async function getSetlist(id: string): Promise<Setlist | undefined> {
  return db.setlists.get(id);
}

export async function saveSetlist(setlist: Setlist): Promise<void> {
  setlist.updatedAt = Date.now();
  await db.setlists.put(setlist);
}

export async function deleteSetlist(id: string): Promise<void> {
  await db.setlists.delete(id);
}

export function emptySong(partial: Partial<Song> = {}): Song {
  const now = Date.now();
  return {
    id: newSongId(),
    title: '',
    artist: '',
    key: 'C',
    mode: 'major',
    tempo: 100,
    capo: 0,
    tuning: 'standard',
    tags: [],
    status: 'à bosser',
    sections: [
      {
        id: newSectionId(),
        name: 'Couplet',
        chords: [],
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

// ─── CRUD helpers ──────────────────────────────────────────────
export async function listSongs(): Promise<Song[]> {
  return db.songs.orderBy('updatedAt').reverse().toArray();
}

export async function getSong(id: string): Promise<Song | undefined> {
  return db.songs.get(id);
}

export async function saveSong(song: Song): Promise<void> {
  song.updatedAt = Date.now();
  await db.songs.put(song);
}

export async function deleteSong(id: string): Promise<void> {
  await db.songs.delete(id);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function todaysSession(): Promise<PracticeSession | undefined> {
  return db.sessions.where('date').equals(todayKey()).first();
}

export async function logSession(s: Omit<PracticeSession, 'id' | 'createdAt'>): Promise<void> {
  await db.sessions.add({ ...s, createdAt: Date.now() });
}

/**
 * Streak quotidien : nombre de jours consécutifs (jusqu'à aujourd'hui)
 * avec au moins une session marquée `completed: true`. Si pas de session
 * aujourd'hui mais une hier, le streak n'est pas encore "cassé"
 * (il devient cassé seulement quand un jour entier est passé sans session).
 */
export async function computeStreak(): Promise<number> {
  const sessions = await db.sessions.filter((s) => s.completed === true).sortBy('date');
  if (sessions.length === 0) return 0;

  const done = new Set(sessions.map((s) => s.date));
  const today = todayKey();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // Point de départ : aujourd'hui si pratiqué, sinon hier (la veille reste
  // valable jusqu'à la fin de la journée actuelle).
  let cursor: Date;
  if (done.has(today)) {
    cursor = new Date(today);
  } else if (done.has(yesterday)) {
    cursor = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  while (done.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Renvoie les 7 derniers jours (du plus ancien au plus récent), avec un
 * flag indiquant si l'utilisateur a pratiqué ce jour-là.
 */
export type DayStatus = { date: string; weekday: string; practiced: boolean };

export async function lastSevenDays(): Promise<DayStatus[]> {
  const sessions = await db.sessions.filter((s) => s.completed === true).toArray();
  const done = new Set(sessions.map((s) => s.date));
  // Lundi en premier dans la semaine, indexé via getDay() (0=dim..6=sam).
  const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const out: DayStatus[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    out.push({ date, weekday: WEEKDAYS[d.getDay()], practiced: done.has(date) });
  }
  return out;
}

export type StatsTopEntry = { name: string; count: number };

/** Top N accords + gammes les plus pratiqués. */
export async function topPracticeItems(n = 5): Promise<{
  chords: StatsTopEntry[];
  scales: StatsTopEntry[];
  totalSessions: number;
}> {
  const all = await db.sessions.filter((s) => s.completed === true).toArray();
  const chordCounts = new Map<string, number>();
  const scaleCounts = new Map<string, number>();
  for (const s of all) {
    if (s.chord) chordCounts.set(s.chord, (chordCounts.get(s.chord) ?? 0) + 1);
    if (s.scale) scaleCounts.set(s.scale, (scaleCounts.get(s.scale) ?? 0) + 1);
  }
  const toSorted = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  return {
    chords: toSorted(chordCounts),
    scales: toSorted(scaleCounts),
    totalSessions: all.length,
  };
}

/** 30 derniers jours, count de sessions par jour (pour courbe SVG). */
export async function last30DaysPracticed(): Promise<{ date: string; count: number }[]> {
  const all = await db.sessions.filter((s) => s.completed === true).toArray();
  const counts = new Map<string, number>();
  for (const s of all) counts.set(s.date, (counts.get(s.date) ?? 0) + 1);
  const out: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    out.push({ date, count: counts.get(date) ?? 0 });
  }
  return out;
}

// Seed: create 2-3 example songs + 1 démo setlist if DB is empty on first load
export async function seedIfEmpty(): Promise<void> {
  const count = await db.songs.count();
  if (count > 0) return;

  const now = Date.now();
  const songIds = [newSongId(), newSongId(), newSongId()];
  await db.songs.bulkAdd([
    {
      id: songIds[0],
      title: 'Wonderwall',
      artist: 'Oasis',
      key: 'F#' as NoteName,
      mode: 'minor',
      tempo: 87,
      capo: 2,
      tuning: 'standard',
      tags: ['acoustique', 'classique'],
      status: 'maîtrisé',
      sections: [
        {
          id: newSectionId(),
          name: 'Couplet',
          chords: [
            { name: 'Em7', beats: 4 },
            { name: 'G', beats: 4 },
            { name: 'Dsus4', beats: 4 },
            { name: 'A7sus4', beats: 4 },
          ],
          strumPattern: {
            beats: ['down', 'down', 'up', 'mute', 'down', 'up'],
            subdivision: 8,
          },
        },
        {
          id: newSectionId(),
          name: 'Refrain',
          chords: [
            { name: 'Cadd9', beats: 2 },
            { name: 'Em7', beats: 2 },
            { name: 'G', beats: 4 },
          ],
        },
      ],
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 3,
    },
    {
      id: songIds[1],
      title: "Sweet Child o' Mine",
      artist: "Guns N' Roses",
      key: 'D' as NoteName,
      mode: 'major',
      tempo: 125,
      capo: 0,
      tuning: 'standard',
      tags: ['rock', 'solo'],
      status: 'à bosser',
      sections: [
        {
          id: newSectionId(),
          name: 'Couplet',
          chords: [
            { name: 'D', beats: 4 },
            { name: 'C', beats: 2 },
            { name: 'G', beats: 2 },
          ],
        },
      ],
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
    },
    {
      id: songIds[2],
      title: 'No Surprises',
      artist: 'Radiohead',
      key: 'F' as NoteName,
      mode: 'major',
      tempo: 76,
      capo: 0,
      tuning: 'standard',
      tags: ['chill', 'acoustique'],
      status: 'intermédiaire',
      sections: [
        {
          id: newSectionId(),
          name: 'Intro',
          chords: [
            { name: 'F', beats: 2 },
            { name: 'Em', beats: 2 },
            { name: 'Am7', beats: 2 },
            { name: 'Dm', beats: 2 },
          ],
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // Setlist démo : "Répèt du jeudi"
  await db.setlists.add({
    id: newSetlistId(),
    name: 'Répèt du jeudi',
    songIds,
    createdAt: now,
    updatedAt: now,
  });
}
