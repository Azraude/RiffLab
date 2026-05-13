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

// ─── Database ──────────────────────────────────────────────────
class RiffLabDB extends Dexie {
  songs!: Table<Song, string>;
  sessions!: Table<PracticeSession, number>;

  constructor() {
    super('rifflab');
    this.version(1).stores({
      songs: 'id, title, artist, key, updatedAt, status',
      sessions: '++id, date, completed',
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

export async function todaysSession(): Promise<PracticeSession | undefined> {
  const today = new Date().toISOString().slice(0, 10);
  return db.sessions.where('date').equals(today).first();
}

export async function logSession(s: Omit<PracticeSession, 'id' | 'createdAt'>): Promise<void> {
  await db.sessions.add({ ...s, createdAt: Date.now() });
}

// Seed: create 2-3 example songs if DB is empty on first load
export async function seedIfEmpty(): Promise<void> {
  const count = await db.songs.count();
  if (count > 0) return;

  const now = Date.now();
  await db.songs.bulkAdd([
    {
      id: newSongId(),
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
      id: newSongId(),
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
      id: newSongId(),
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
}
