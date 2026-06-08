/**
 * /composer — compositeur de progression d'accords.
 *
 * Workflow :
 * 1. Choisis key + mode + style
 * 2. Click "Générer" → 4 accords cohérents
 * 3. Chaque accord :
 *    - Roman numeral en top
 *    - SwipeableChordCard (réutilisé) qui montre les voicings
 *    - Badge évaluation (great / good / risky)
 *    - Bouton "Changer" → drawer ChordPicker avec candidats triés par rating
 * 4. Actions row : Écouter / Boucler / Sauver / Copier
 *
 * Théorie : src/lib/progressionTheory.ts (generateProgression,
 * romanToChord, evaluateChordFit, suggestChordCandidates).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SwipeableChordCard } from '@/components/chord/SwipeableChordCard';
import {
  generateProgression,
  evaluateChordFit,
  suggestChordCandidates,
  STYLE_META,
  type ProgressionStyle,
  type ChordRating,
} from '@/lib/progressionTheory';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import { getChord, CHORDS, type Chord } from '@/lib/chordDatabase';
import { useAudio } from '@/hooks/useAudio';
import {
  saveCustomProgression,
  newCustomProgressionId,
  markInteraction,
} from '@/lib/db';
import {
  Wand2,
  Play,
  Repeat,
  Save,
  ClipboardCopy,
  Edit3,
  X,
  Square,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { usePrefs } from '@/stores/prefsStore';
import { ComposerTutorial } from '@/components/onboarding/ComposerTutorial';

export function Composer() {
  const [key, setKey] = useState<NoteName>('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [style, setStyle] = useState<ProgressionStyle>('pop');
  const [progression, setProgression] = useState<{ romans: string[]; chords: string[] } | null>(null);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [playing, setPlaying] = useState<'sequence' | 'loop' | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const { strum } = useAudio();

  // Tutorial first-visit — auto-trigger 600ms après mount (laisser le hero
  // se rendre d'abord pour que les data-tutorial-id soient en DOM)
  const composerTutorialSeen = usePrefs((s) => s.composerTutorialSeen);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  useEffect(() => {
    if (!composerTutorialSeen) {
      const t = window.setTimeout(() => setTutorialOpen(true), 600);
      return () => window.clearTimeout(t);
    }
  }, [composerTutorialSeen]);

  // Génère une progression au premier mount + à chaque changement de paramètre
  useEffect(() => {
    setProgression(generateProgression(key, mode, style));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mode, style]);

  const generateNew = () => {
    setProgression(generateProgression(key, mode, style));
  };

  const replaceChord = (slot: number, newChord: string) => {
    if (!progression) return;
    const chords = [...progression.chords];
    chords[slot] = newChord;
    setProgression({ ...progression, chords });
    setPickerSlot(null);
  };

  const playSequence = async (loop = false) => {
    if (!progression) return;
    setPlaying(loop ? 'loop' : 'sequence');
    const beatMs = (60_000 / 80) * 4; // 4 beats par chord à 80 BPM
    let iter = 0;
    const maxIter = loop ? 32 : 1;
    while (iter < maxIter && (loop ? playingRef.current === 'loop' : true)) {
      for (let i = 0; i < progression.chords.length; i++) {
        if (loop && playingRef.current !== 'loop') break;
        if (!loop && playingRef.current === null) break;
        setActiveSlot(i);
        void strum(progression.chords[i]);
        void markInteraction('chord', progression.chords[i]);
        await new Promise((r) => setTimeout(r, beatMs));
      }
      iter++;
    }
    setActiveSlot(null);
    setPlaying(null);
  };

  // Refs pour cancel propre de la lecture
  const playingRef = useRef<typeof playing>(null);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const stopPlay = () => {
    setPlaying(null);
    setActiveSlot(null);
  };

  const handleSave = async () => {
    if (!progression) return;
    const defaultName = `Ma progression en ${key} ${mode === 'minor' ? 'mineur' : 'majeur'}`;
    const name = window.prompt('Nom de la progression', defaultName);
    if (name === null) return;
    await saveCustomProgression({
      id: newCustomProgressionId(),
      name: name.trim() || defaultName,
      key,
      mode,
      style,
      romans: progression.romans,
      chords: progression.chords,
      createdAt: Date.now(),
    });
    setSavedToast(name.trim() || defaultName);
    window.setTimeout(() => setSavedToast(null), 2500);
  };

  const handleCopy = async () => {
    if (!progression) return;
    const text = progression.chords.join(' - ');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      window.setTimeout(() => setCopiedToast(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Wand2 size={22} className="text-gold" />
            Compositeur
          </span>
        }
        subtitle="Génère des progressions d'accords qui sonnent bien, swipe les voicings, écoute en live."
      >
        <button
          type="button"
          onClick={() => setTutorialOpen(true)}
          aria-label="Aide — revoir le tour guidé"
          title="Revoir le tour guidé"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted transition-colors hover:border-gold-soft hover:text-gold"
        >
          <HelpCircle size={16} />
        </button>
      </PageHeader>

      {/* Header card — selectors + génération */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
          <div data-tutorial-id="composer-key">
            <div className="label-small mb-1.5">Tonalité</div>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value as NoteName)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none md:h-10"
            >
              {NOTE_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="label-small mb-1.5">Mode</div>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'major' | 'minor')}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none md:h-10"
            >
              <option value="major">Majeur</option>
              <option value="minor">Mineur</option>
            </select>
          </div>
          <div data-tutorial-id="composer-style">
            <div className="label-small mb-1.5">Style</div>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ProgressionStyle)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none md:h-10"
            >
              {STYLE_META.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} — {s.description}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={generateNew}
            data-tutorial-id="composer-generate"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold transition-all hover:-translate-y-px md:h-10"
          >
            <Sparkles size={14} />
            Générer
          </button>
        </div>
      </Card>

      {/* Tutorial overlay first-visit + bouton ? */}
      {tutorialOpen && <ComposerTutorial onDone={() => setTutorialOpen(false)} />}

      {/* Grid 4 chord cards */}
      {progression && (
        <div data-tutorial-id="composer-slots" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {progression.chords.map((chordName, i) => (
            <ChordSlot
              key={i + chordName}
              slot={i}
              chordName={chordName}
              roman={progression.romans[i]}
              keyName={key}
              mode={mode}
              active={activeSlot === i}
              onChange={() => setPickerSlot(i)}
            />
          ))}
        </div>
      )}

      {/* Actions row */}
      {progression && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-sm text-text-muted">
              <span className="text-gold-bright">{progression.chords.join('  →  ')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {playing ? (
                <button
                  type="button"
                  onClick={stopPlay}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-4 text-sm font-semibold text-danger hover:bg-danger/25 md:h-10"
                >
                  <Square size={14} fill="currentColor" /> Stop
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void playSequence(false)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10"
                  >
                    <Play size={14} fill="currentColor" /> Écouter
                  </button>
                  <button
                    type="button"
                    onClick={() => void playSequence(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5 md:h-10"
                  >
                    <Repeat size={14} /> Boucler
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => void handleSave()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-sm text-text hover:border-gold-soft md:h-10"
              >
                <Save size={14} /> Sauver
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-sm text-text hover:border-gold-soft md:h-10"
              >
                <ClipboardCopy size={14} />
                {copiedToast ? 'Copié ✓' : 'Copier'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Chord picker drawer */}
      <ChordPickerDrawer
        slot={pickerSlot}
        keyName={key}
        mode={mode}
        onClose={() => setPickerSlot(null)}
        onPick={(chord) => {
          if (pickerSlot !== null) replaceChord(pickerSlot, chord);
        }}
      />

      {/* Save toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-6 z-[80] mx-auto w-fit max-w-[92vw] rounded-2xl border border-success/40 bg-success/15 px-5 py-3 text-sm text-success shadow-gold-strong"
            role="status"
            aria-live="polite"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            ✓ "{savedToast}" sauvegardée dans tes progressions
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Chord slot card ──────────────────────────────────────────────

function ChordSlot({
  slot,
  chordName,
  roman,
  keyName,
  mode,
  active,
  onChange,
}: {
  slot: number;
  chordName: string;
  roman: string;
  keyName: NoteName;
  mode: 'major' | 'minor';
  active: boolean;
  onChange: () => void;
}) {
  const chord = getChord(chordName);
  const evalRes = useMemo(
    () => evaluateChordFit(chordName, keyName, mode),
    [chordName, keyName, mode],
  );
  const { strum } = useAudio();

  return (
    <div
      className={clsx(
        'relative flex flex-col rounded-2xl border-2 bg-surface p-3 transition-all',
        active
          ? 'border-gold shadow-gold-strong scale-[1.02]'
          : 'border-border',
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-gold-soft">
          Slot {slot + 1} · {roman}
        </span>
        <button
          type="button"
          onClick={onChange}
          aria-label={`Changer l'accord ${slot + 1}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-gold"
        >
          <Edit3 size={12} />
        </button>
      </div>
      {chord ? (
        <SwipeableChordCard chord={chord} onPlay={() => void strum(chord.name)} />
      ) : (
        <FallbackChordCard chordName={chordName} onPlay={() => void strum(chordName)} />
      )}
      <RatingBadge evaluation={evalRes} />
    </div>
  );
}

function FallbackChordCard({ chordName, onPlay }: { chordName: string; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="flex h-32 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface-2 text-text-muted"
    >
      <span className="font-mono text-2xl font-bold text-gold">{chordName}</span>
      <span className="text-[10px] uppercase tracking-wider text-text-soft">
        pas de diagramme — tap pour jouer
      </span>
    </button>
  );
}

function RatingBadge({ evaluation }: { evaluation: ReturnType<typeof evaluateChordFit> }) {
  const cls: Record<ChordRating, string> = {
    great: 'border-success/40 bg-success/15 text-success',
    good: 'border-gold/40 bg-gold/15 text-gold-bright',
    risky: 'border-[#e8a45e]/40 bg-[#e8a45e]/15 text-[#e8a45e]',
    weird: 'border-danger/40 bg-danger/15 text-danger',
  };
  const dot: Record<ChordRating, string> = {
    great: '🟢',
    good: '🟡',
    risky: '🟠',
    weird: '🔴',
  };
  return (
    <div
      className={clsx(
        'mt-2 flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px]',
        cls[evaluation.rating],
      )}
    >
      <span aria-hidden="true">{dot[evaluation.rating]}</span>
      <span className="truncate">{evaluation.reason}</span>
    </div>
  );
}

// ─── ChordPicker drawer ──────────────────────────────────────────

function ChordPickerDrawer({
  slot,
  keyName,
  mode,
  onClose,
  onPick,
}: {
  slot: number | null;
  keyName: NoteName;
  mode: 'major' | 'minor';
  onClose: () => void;
  onPick: (chord: string) => void;
}) {
  const open = slot !== null;
  const candidates = useMemo(() => suggestChordCandidates(keyName, mode), [keyName, mode]);
  // Filtre : ne montre que les accords dont on a un voicing/diagramme dans la db
  // (les autres sonneront mais sans diagramme, donc on les met en bas avec un badge)
  const knownChords = useMemo(() => new Set(CHORDS.map((c: Chord) => c.name)), []);
  const groups: Record<ChordRating, { chord: string; reason: string; known: boolean }[]> = {
    great: [],
    good: [],
    risky: [],
    weird: [],
  };
  for (const c of candidates) {
    groups[c.rating].push({ chord: c.chord, reason: c.reason, known: knownChords.has(c.chord) });
  }
  // Trier chaque groupe : known d'abord
  for (const k of Object.keys(groups) as ChordRating[]) {
    groups[k].sort((a, b) => Number(b.known) - Number(a.known));
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount aria-describedby={undefined} className="outline-none">
              <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pointer-events-none sm:items-center">
                <motion.div
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 32, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="pointer-events-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-gold bg-bg shadow-gold-strong"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border p-5">
                    <div>
                      <div className="eyebrow">Slot {slot !== null ? slot + 1 : ''}</div>
                      <Dialog.Title className="display mt-1 text-display-sm">
                        Choisis un accord
                      </Dialog.Title>
                      <p className="mt-1 text-xs text-text-muted">
                        Tonalité {keyName} {mode === 'minor' ? 'mineur' : 'majeur'} — triés par cohérence
                      </p>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        aria-label="Fermer"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5">
                    {(['great', 'good', 'risky'] as ChordRating[]).map((rating) => (
                      groups[rating].length === 0 ? null : (
                        <section key={rating} className="mb-5 last:mb-0">
                          <h3 className="label-small mb-2 flex items-center gap-1.5">
                            {rating === 'great' && <>🟢 Naturels (dans la tonalité)</>}
                            {rating === 'good' && <>🟡 Emprunts intéressants</>}
                            {rating === 'risky' && <>🟠 Hors-cadre — couleur</>}
                          </h3>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {groups[rating].map(({ chord, reason, known }) => (
                              <button
                                key={chord}
                                type="button"
                                onClick={() => onPick(chord)}
                                title={reason}
                                className={clsx(
                                  'group flex h-16 flex-col items-center justify-center rounded-lg border text-center transition-all',
                                  known
                                    ? 'border-border bg-surface-2 hover:border-gold-soft hover:bg-gold/5'
                                    : 'border-dashed border-border/60 bg-surface-2 opacity-70 hover:opacity-100',
                                )}
                              >
                                <span className="font-mono text-base font-bold text-gold group-hover:text-gold-bright">
                                  {chord}
                                </span>
                                {!known && (
                                  <span className="mt-0.5 text-[8px] uppercase tracking-wider text-text-soft">
                                    pas de diagramme
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </section>
                      )
                    ))}
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

