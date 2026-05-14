/**
 * Share via URL — encode un song ou une setlist en base64url pour partage
 * sans backend. Le destinataire colle l'URL, on décode, on prévisualise,
 * et on offre un "Fork" qui copie dans la DB locale (avec un nouvel ID).
 *
 * Payload structure :
 *   { v: 1, kind: 'song', data: Song }
 *   { v: 1, kind: 'setlist', data: { setlist: Setlist, songs: Song[] } }
 */
import type { Song, Setlist } from './db';
import { newSongId, newSetlistId, newSectionId } from './db';

const VERSION = 1;

export type SharePayload =
  | { v: 1; kind: 'song'; data: Song }
  | { v: 1; kind: 'setlist'; data: { setlist: Setlist; songs: Song[] } };

// ─── Base64URL helpers ────────────────────────────────────────────────

/** Encode UTF-8 string → base64url (URL-safe, no padding). */
function toBase64Url(str: string): string {
  // String → bytes → btoa(latin1)
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode base64url → UTF-8 string. */
function fromBase64Url(b64url: string): string {
  // Restore padding
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ─── Encode ────────────────────────────────────────────────────────────

export function encodeSong(song: Song): string {
  const payload: SharePayload = { v: VERSION, kind: 'song', data: song };
  return toBase64Url(JSON.stringify(payload));
}

export function encodeSetlist(setlist: Setlist, songs: Song[]): string {
  const payload: SharePayload = {
    v: VERSION,
    kind: 'setlist',
    data: { setlist, songs },
  };
  return toBase64Url(JSON.stringify(payload));
}

// ─── Decode ────────────────────────────────────────────────────────────

export function decodeShare(encoded: string): SharePayload | null {
  try {
    const json = fromBase64Url(encoded);
    const payload = JSON.parse(json);
    if (!payload || typeof payload !== 'object') return null;
    if (payload.v !== VERSION) return null;
    if (payload.kind !== 'song' && payload.kind !== 'setlist') return null;
    return payload as SharePayload;
  } catch {
    return null;
  }
}

// ─── Fork (copie locale avec nouveaux IDs) ────────────────────────────

/**
 * Renvoie un nouveau Song avec id frais + sections aux IDs frais.
 * Le titre est suffixé par "(forké)" pour distinguer.
 */
export function forkSong(song: Song, addSuffix = true): Song {
  const now = Date.now();
  return {
    ...song,
    id: newSongId(),
    title: addSuffix ? `${song.title} (forké)` : song.title,
    sections: song.sections.map((s) => ({ ...s, id: newSectionId() })),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Renvoie {newSetlist, newSongs} où chaque song est forkée (IDs frais)
 * et le setlist pointe sur les nouveaux IDs.
 */
export function forkSetlist(
  setlist: Setlist,
  songs: Song[]
): { setlist: Setlist; songs: Song[] } {
  const songIdMap = new Map<string, string>();
  const forkedSongs = songs.map((s) => {
    const forked = forkSong(s, false);
    songIdMap.set(s.id, forked.id);
    return forked;
  });
  const now = Date.now();
  const forkedSetlist: Setlist = {
    ...setlist,
    id: newSetlistId(),
    name: `${setlist.name} (forkée)`,
    songIds: setlist.songIds.map((id) => songIdMap.get(id) ?? id).filter(Boolean),
    createdAt: now,
    updatedAt: now,
  };
  return { setlist: forkedSetlist, songs: forkedSongs };
}

// ─── URL helpers ───────────────────────────────────────────────────────

/** Construit l'URL absolue de partage pour le payload donné. */
export function buildShareUrl(encoded: string): string {
  const base = window.location.origin;
  return `${base}/share/${encoded}`;
}

/** Copie l'URL dans le presse-papier (avec fallback). Retourne true si OK. */
export async function copyShareUrl(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // Fallback ci-dessous
  }
  // Fallback : prompt l'user pour copier manuellement
  try {
    window.prompt('Copie cette URL :', url);
    return true;
  } catch {
    return false;
  }
}
