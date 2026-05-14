import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import {
  decodeShare,
  forkSong,
  forkSetlist,
  type SharePayload,
} from '@/lib/share';
import { saveSong, saveSetlist, type Song, type Setlist } from '@/lib/db';
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Disc3,
  Download,
  Music2,
} from 'lucide-react';

/**
 * /share/:encoded — preview d'un song ou setlist partagé via URL base64,
 * avec bouton "Fork dans mon carnet" qui copie le contenu dans Dexie
 * avec des IDs frais.
 */
export function SharePreview() {
  const { encoded } = useParams<{ encoded: string }>();
  const navigate = useNavigate();
  const [forking, setForking] = useState(false);

  const payload: SharePayload | null = useMemo(
    () => (encoded ? decodeShare(encoded) : null),
    [encoded]
  );

  const handleFork = async () => {
    if (!payload || forking) return;
    setForking(true);
    try {
      if (payload.kind === 'song') {
        const forked = forkSong(payload.data);
        await saveSong(forked);
        navigate(`/songs/${forked.id}`);
      } else {
        const { setlist: newSetlist, songs: newSongs } = forkSetlist(
          payload.data.setlist,
          payload.data.songs
        );
        // Sauvegarde toutes les songs puis le setlist
        for (const s of newSongs) await saveSong(s);
        await saveSetlist(newSetlist);
        navigate(`/setlists/${newSetlist.id}`);
      }
    } catch (e) {
      console.error(e);
      alert("Impossible d'ajouter à ton carnet — voir la console.");
      setForking(false);
    }
  };

  if (!payload) return <InvalidShare />;

  return (
    <>
      <PageHeader
        title="Partage"
        subtitle={
          payload.kind === 'song'
            ? 'Aperçu du son partagé. Fork-le pour l\'ajouter à ton carnet.'
            : 'Aperçu de la setlist partagée. Fork-la pour avoir le pack complet.'
        }
      />

      {payload.kind === 'song' ? (
        <SongPreview song={payload.data} />
      ) : (
        <SetlistPreview setlist={payload.data.setlist} songs={payload.data.songs} />
      )}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleFork}
          disabled={forking}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gold font-semibold text-bg shadow-gold transition-all hover:bg-gold-bright hover:-translate-y-px disabled:opacity-50"
        >
          <Download size={18} />
          {forking ? 'Ajout en cours…' : 'Fork dans mon carnet'}
        </button>
        <Link
          to="/songs"
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-border font-semibold text-text-muted hover:text-text"
        >
          Voir mes sons
        </Link>
      </div>

      <p className="mt-4 text-center text-xs text-text-soft">
        Tout est stocké en local. Le partage est anonyme et passe juste par l'URL.
      </p>
    </>
  );
}

// ─── Song preview ─────────────────────────────────────────────────────

function SongPreview({ song }: { song: Song }) {
  const totalBeats = song.sections.reduce(
    (sum, s) => sum + s.chords.reduce((b, c) => b + c.beats, 0),
    0
  );
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
          <Music2 size={22} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="display text-display-sm">{song.title || 'Sans titre'}</h2>
          {song.artist && (
            <p className="mt-0.5 text-sm text-text-muted">{song.artist}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip">{song.key} {song.mode === 'minor' ? 'mineur' : 'majeur'}</span>
            <span className="chip">{song.tempo} BPM</span>
            {song.capo > 0 && <span className="chip">Capo {song.capo}</span>}
            <span className="chip">{song.sections.length} section{song.sections.length > 1 ? 's' : ''}</span>
            <span className="chip">~{totalBeats} temps</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-5 grid gap-3">
        {song.sections.map((sec) => (
          <div
            key={sec.id}
            className="rounded-xl border border-border bg-surface-2 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">{sec.name}</span>
              <span className="text-xs text-text-soft">
                {sec.chords.length} accord{sec.chords.length > 1 ? 's' : ''}
              </span>
            </div>
            {sec.chords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sec.chords.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2 font-mono text-sm font-bold text-gold"
                  >
                    {c.name}
                    <span className="text-[10px] text-text-soft">{c.beats}t</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {song.notes && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
          <div className="label-small mb-1">Notes</div>
          <p className="whitespace-pre-wrap text-sm text-text-muted">{song.notes}</p>
        </div>
      )}
    </Card>
  );
}

// ─── Setlist preview ──────────────────────────────────────────────────

function SetlistPreview({ setlist, songs }: { setlist: Setlist; songs: Song[] }) {
  // Order songs by setlist.songIds
  const songById = new Map(songs.map((s) => [s.id, s]));
  const orderedSongs = setlist.songIds.map((id) => songById.get(id)).filter(Boolean) as Song[];

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
          <Disc3 size={22} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="display text-display-sm">{setlist.name}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip">{orderedSongs.length} son{orderedSongs.length > 1 ? 's' : ''}</span>
            <span className="chip">
              <CalendarDays size={11} className="mr-1" />
              {new Date(setlist.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {orderedSongs.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10 font-mono text-xs font-bold text-gold">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{s.title}</div>
              {s.artist && (
                <div className="truncate text-xs text-text-soft">{s.artist}</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-text-soft">
              <span className="font-mono">{s.key}</span>
              <span>·</span>
              <span>{s.tempo} BPM</span>
              <ChevronRight size={14} className="text-text-soft" />
            </div>
          </div>
        ))}
      </div>

      {setlist.notes && (
        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
          <div className="label-small mb-1">Notes</div>
          <p className="whitespace-pre-wrap text-sm text-text-muted">{setlist.notes}</p>
        </div>
      )}
    </Card>
  );
}

// ─── Invalid share ────────────────────────────────────────────────────

function InvalidShare() {
  return (
    <>
      <PageHeader title="Partage invalide" />
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle size={24} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <h2 className="display text-display-sm">URL non lisible</h2>
            <p className="mt-2 text-sm text-text-muted">
              Ce lien de partage est corrompu ou utilise une ancienne version.
              Demande à la personne qui te l'a envoyé de générer un nouveau lien.
            </p>
            <Link
              to="/songs"
              className="mt-4 inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm hover:bg-gold/5"
            >
              Retour à mes sons
            </Link>
          </div>
        </div>
      </Card>
    </>
  );
}
