import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import { db, saveSong } from '@/lib/db';
import { getChord, getDefaultVoicing } from '@/lib/chordDatabase';
import { suggestCapo, OPEN_CHORD_SHAPES } from '@/lib/capoSuggest';
import { useAudio } from '@/hooks/useAudio';
import { Play, Music2, Lightbulb, ArrowRight, Check, X } from 'lucide-react';
import clsx from 'clsx';

export function SongDetail() {
  const { id } = useParams();
  const song = useLiveQuery(() => (id ? db.songs.get(id) : undefined), [id]);
  const { strum } = useAudio();
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const [showCapoSuggestion, setShowCapoSuggestion] = useState(false);

  const capoSuggestion = useMemo(() => {
    if (!song) return null;
    const allChords = song.sections.flatMap((sec) => sec.chords.map((c) => c.name));
    if (allChords.length === 0) return null;
    return suggestCapo(allChords, song.capo);
  }, [song]);

  const applyCapoSuggestion = async () => {
    if (!song || !capoSuggestion) return;
    const updated = {
      ...song,
      capo: capoSuggestion.bestCapo,
      sections: song.sections.map((sec) => ({
        ...sec,
        chords: sec.chords.map((c) => ({
          ...c,
          name: capoSuggestion.mapping[c.name] ?? c.name,
        })),
      })),
    };
    await saveSong(updated);
    setShowCapoSuggestion(false);
  };

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

      {/* Capo intelligent — bouton + panel */}
      {capoSuggestion && capoSuggestion.totalChords > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowCapoSuggestion((v) => !v)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-gold px-4 text-sm font-medium hover:bg-gold/5"
            aria-expanded={showCapoSuggestion}
          >
            <Lightbulb size={16} className="text-gold" />
            Suggérer un capo
          </button>

          {showCapoSuggestion && (
            <Card
              className="mt-3"
              glow={capoSuggestion.improvable}
            >
              <CapoSuggestionPanel
                suggestion={capoSuggestion}
                onApply={applyCapoSuggestion}
                onDismiss={() => setShowCapoSuggestion(false)}
              />
            </Card>
          )}
        </div>
      )}

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

function CapoSuggestionPanel({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: ReturnType<typeof suggestCapo>;
  onApply: () => void | Promise<void>;
  onDismiss: () => void;
}) {
  const {
    currentCapo,
    currentOpenCount,
    bestCapo,
    bestOpenCount,
    totalChords,
    mapping,
    improvable,
  } = suggestion;

  const allAlreadyOpen = currentOpenCount === totalChords && totalChords > 0;

  // Cas 1 : tout est déjà ouvert
  if (allAlreadyOpen && !improvable) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <Check size={18} strokeWidth={2.5} />
        </span>
        <div>
          <div className="font-semibold">Tu joues déjà tous les accords en open.</div>
          <p className="mt-0.5 text-sm text-text-muted">
            Capo {currentCapo} — {currentOpenCount}/{totalChords} accords ouverts. Rien à
            optimiser ✨
          </p>
        </div>
      </div>
    );
  }

  // Cas 2 : pas d'amélioration possible (le capo actuel est déjà l'optimum trouvé)
  if (!improvable) {
    return (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <Check size={18} strokeWidth={2.5} />
        </span>
        <div>
          <div className="font-semibold">Ton capo actuel est déjà optimal.</div>
          <p className="mt-0.5 text-sm text-text-muted">
            Capo {currentCapo} — {currentOpenCount}/{totalChords} accords ouverts.
            {bestOpenCount === 0 && ' Aucune position de capo ne convertit tes accords en open shapes (positions barrées dominantes).'}
          </p>
        </div>
      </div>
    );
  }

  // Cas 3 : amélioration possible
  const delta = bestOpenCount - currentOpenCount;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Suggestion</div>
          <h3 className="display mt-1 text-display-sm">
            Capo <span className="text-gold text-gold-glow">{bestCapo}</span>
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            <span className="text-gold">{bestOpenCount}/{totalChords}</span> accords en
            open chord (vs {currentOpenCount}/{totalChords} actuellement, +{delta}).
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer la suggestion"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft hover:bg-surface-2 hover:text-text"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5">
        <div className="label-small mb-2">Tes accords après transposition</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(mapping).map(([orig, neu]) => {
            const newIsOpen = OPEN_CHORD_SHAPES.has(neu);
            const changed = orig !== neu;
            return (
              <div
                key={orig}
                className={clsx(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                  newIsOpen ? 'border-gold-soft bg-gold/5' : 'border-border bg-surface-2'
                )}
              >
                <span className="font-mono text-text-muted">{orig}</span>
                <ArrowRight size={14} className="text-text-soft" />
                <span
                  className={clsx(
                    'font-mono font-bold',
                    newIsOpen ? 'text-gold' : 'text-text'
                  )}
                >
                  {neu}
                </span>
                {newIsOpen && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-gold/80">
                    open
                  </span>
                )}
                {!changed && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-text-soft">
                    inchangé
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text"
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright"
        >
          Appliquer capo {bestCapo}
        </button>
      </div>
    </div>
  );
}
