import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import { db } from '@/lib/db';
import { getChord, getDefaultVoicing } from '@/lib/chordDatabase';
import { useAudio } from '@/hooks/useAudio';
import { Play, Music2 } from 'lucide-react';

export function SongDetail() {
  const { id } = useParams();
  const song = useLiveQuery(() => (id ? db.songs.get(id) : undefined), [id]);
  const { strum } = useAudio();
  const [activeChord, setActiveChord] = useState<string | null>(null);

  if (!song) {
    return (
      <>
        <Link to="/songs" className="text-sm text-text-muted hover:text-gold">
          ← Retour aux sons
        </Link>
        <p className="mt-6 text-text-muted">Son introuvable.</p>
      </>
    );
  }

  // Unique chord names across all sections
  const uniqueChords = Array.from(
    new Set(song.sections.flatMap((sec) => sec.chords.map((c) => c.name)))
  );

  const handleChordClick = async (name: string) => {
    setActiveChord(name);
    await strum(name, 'down');
    setTimeout(() => setActiveChord(null), 400);
  };

  return (
    <>
      <Link to="/songs" className="text-sm text-text-muted hover:text-gold">
        ← Retour aux sons
      </Link>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display text-display-lg">{song.title}</h1>
          {song.artist && <p className="mt-1 text-text-muted">{song.artist}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-soft">
            <span>♩ {song.tempo} BPM</span>
            <span>
              {song.key} {song.mode === 'minor' ? 'min' : 'maj'}
            </span>
            {song.capo > 0 && <span>capo {song.capo}</span>}
            <span>● {song.status}</span>
          </div>
        </div>
      </div>

      {/* Chord palette */}
      <div className="mt-8">
        <h2 className="eyebrow mb-4">Accords du morceau</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {uniqueChords.map((name) => {
            const voicing = getDefaultVoicing(name);
            const chord = getChord(name);
            return (
              <Card
                key={name}
                hover
                className={
                  'cursor-pointer text-center transition-all ' +
                  (activeChord === name ? 'border-gold shadow-gold' : '')
                }
                onClick={() => handleChordClick(name)}
              >
                <div className="font-mono text-lg font-bold text-gold">{name}</div>
                <div className="mt-2 flex justify-center">
                  {voicing ? (
                    <ChordDiagram voicing={voicing} name={name} size="sm" />
                  ) : (
                    <div className="text-[10px] text-text-soft">Diagramme à venir</div>
                  )}
                </div>
                {chord && (
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-text-soft">
                    {chord.category}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sections with chord progressions */}
      <div className="mt-10 space-y-6">
        {song.sections.map((sec) => (
          <Card key={sec.id}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="display text-display-sm">{sec.name}</h3>
              <button
                onClick={async () => {
                  // Play all chords in sequence
                  for (const c of sec.chords) {
                    await strum(c.name, 'down');
                    await new Promise((r) =>
                      setTimeout(r, (c.beats * 60_000) / song.tempo)
                    );
                  }
                }}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border-gold px-3 text-sm hover:bg-gold/5 md:h-8 md:text-xs"
              >
                <Play size={14} /> Jouer la section
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {sec.chords.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleChordClick(c.name)}
                  className={
                    'group flex h-11 items-center gap-2 rounded-lg border px-3 transition-all md:h-auto md:py-2 ' +
                    (activeChord === c.name
                      ? 'border-gold bg-gold/10'
                      : 'border-border bg-surface hover:border-gold-soft')
                  }
                >
                  <span className="font-mono text-sm font-bold text-gold">{c.name}</span>
                  <span className="text-[10px] text-text-soft">{c.beats}t</span>
                </button>
              ))}
              {sec.chords.length === 0 && (
                <span className="text-sm text-text-soft">Aucun accord dans cette section.</span>
              )}
            </div>

            {sec.strumPattern && (
              <div className="mt-4 flex items-center gap-2 text-xs text-text-soft">
                <Music2 size={12} />
                <span>Strum pattern : </span>
                <span className="font-mono">
                  {sec.strumPattern.beats
                    .map((b) =>
                      b === 'down' ? '↓' : b === 'up' ? '↑' : b === 'mute' ? '×' : '·'
                    )
                    .join(' ')}
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <p className="mt-10 text-sm text-text-soft">
        Clique sur un accord pour l'entendre · La lecture audio nécessite une première interaction
        (politique navigateur).
      </p>
    </>
  );
}
