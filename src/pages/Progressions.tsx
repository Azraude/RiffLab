/**
 * /progressions — Studio composition (sess PROG-STUDIO).
 *
 * Fusion ex-Progressions + ex-Composer en un seul Studio multi-tabs :
 *  - Compose (par défaut) : mode LOCK-PROGRESSIVE — l'algo suggère le
 *    prochain accord en fonction des lockés ; user lock un par un avec
 *    explication pédagogique (fit : 💚 naturel / 💛 colorful / 💜 surprise)
 *  - Classiques : la liste des 30+ progressions catalog (UI existante)
 *
 * Mobile-first 375px d'abord. Tabs scroll-x si overflow.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sheet } from '@/components/ui/Sheet';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import {
  PROGRESSIONS,
  ALL_MOODS,
  MOOD_LABELS,
  transposeProgression,
  type Mood,
  type Progression,
  type Difficulty,
} from '@/lib/progressionDatabase';
import {
  suggestNextChord,
  generateFullProgression,
  romanToChord,
  STYLE_META,
  type ProgressionStyle,
  type ChordSuggestion,
} from '@/lib/progressionTheory';
import { db, newSectionId, saveSong, type Song } from '@/lib/db';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import { getChord } from '@/lib/chordDatabase';
import { useAudio } from '@/hooks/useAudio';
import {
  Play,
  Pause,
  Plus,
  Sparkles,
  Volume2,
  Lock,
  Unlock,
  RotateCcw,
  Dices,
  Music2,
  Save,
} from 'lucide-react';
import clsx from 'clsx';
import { SEO } from '@/components/SEO';
import { saveCustomProgression } from '@/lib/progressionApi';
import { useAuth } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';

type StudioTab = 'compose' | 'classics';

export function Progressions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab: StudioTab =
    (searchParams.get('tab') as StudioTab) === 'classics' ? 'classics' : 'compose';
  const [tab, setTab] = useState<StudioTab>(initialTab);

  const switchTab = (t: StudioTab) => {
    setTab(t);
    setSearchParams((sp) => {
      if (t === 'compose') sp.delete('tab');
      else sp.set('tab', t);
      return sp;
    });
  };

  return (
    <>
      <SEO title="Studio progressions" description="Compose des progressions d'accords qui sonnent. 30+ progressions par mood/tonalité, mode LOCK-PROGRESSIVE, preview audio." />
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles size={22} className="text-gold" />
            Studio
          </span>
        }
        subtitle="Compose lock-by-lock ou pioche dans 30+ progressions classiques."
      />

      {/* Tabs */}
      <div className="-mx-2 mb-5 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          <TabBtn active={tab === 'compose'} onClick={() => switchTab('compose')}>
            🎼 Compose
          </TabBtn>
          <TabBtn active={tab === 'classics'} onClick={() => switchTab('classics')}>
            📚 Classiques
          </TabBtn>
        </div>
      </div>

      {tab === 'compose' && <StudioCompose />}
      {tab === 'classics' && <ClassicsTab />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STUDIO COMPOSE — mode LOCK-PROGRESSIVE
// ═══════════════════════════════════════════════════════════════════

function StudioCompose() {
  const [keyName, setKeyName] = useState<NoteName>('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [styles, setStyles] = useState<ProgressionStyle[]>(['pop']);
  const [length, setLength] = useState<4 | 8 | 12 | 16>(4);
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(4).fill(null));
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  // Reset slots quand length change (preserve prefix s'il y a déjà des locks)
  useEffect(() => {
    setSlots((prev) => {
      const next = Array(length).fill(null) as (string | null)[];
      for (let i = 0; i < Math.min(prev.length, length); i++) next[i] = prev[i];
      return next;
    });
    setActiveSlot(null);
  }, [length]);

  // Reset slots quand key/mode change
  useEffect(() => {
    setSlots(Array(length).fill(null));
    setActiveSlot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyName, mode]);

  const lockedChords = slots.filter((s): s is string => Boolean(s));
  const firstEmpty = slots.findIndex((s) => s === null);
  const allFilled = firstEmpty === -1;

  // Suggestions pour le slot actif
  const suggestions = useMemo(() => {
    if (activeSlot === null) return [];
    // Locked = tous les slots LOCKÉS AVANT le slot actif
    const lockedBefore = slots.slice(0, activeSlot).filter((s): s is string => Boolean(s));
    return suggestNextChord(lockedBefore, keyName, mode, styles, 5);
  }, [activeSlot, slots, keyName, mode, styles]);

  const start = () => {
    if (firstEmpty !== -1) setActiveSlot(firstEmpty);
  };

  const generateAll = () => {
    const full = generateFullProgression(slots, keyName, mode, styles);
    setSlots(full);
    setActiveSlot(null);
  };

  const lockSuggestion = (sugg: ChordSuggestion) => {
    if (activeSlot === null) return;
    const next = [...slots];
    next[activeSlot] = sugg.chord;
    setSlots(next);
    // Cherche prochain slot vide
    const nextEmpty = next.findIndex((s, i) => i > activeSlot && s === null);
    setActiveSlot(nextEmpty === -1 ? null : nextEmpty);
  };

  const unlockSlot = (idx: number) => {
    const next = [...slots];
    next[idx] = null;
    setSlots(next);
    setActiveSlot(idx);
  };

  const resetAll = () => {
    setSlots(Array(length).fill(null));
    setActiveSlot(null);
  };

  return (
    <div className="space-y-5">
      {/* ─── Configuration ─── */}
      <Card>
        <div className="label-small mb-2">Tonalité</div>
        <div className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-1.5">
            {NOTE_NAMES.map((n) => (
              <Chip key={n} active={keyName === n} onClick={() => setKeyName(n)} mono>
                {n}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="label-small mb-2">Mode</div>
          <div className="flex gap-1.5">
            <Chip active={mode === 'major'} onClick={() => setMode('major')}>
              Majeur
            </Chip>
            <Chip active={mode === 'minor'} onClick={() => setMode('minor')}>
              Mineur
            </Chip>
          </div>
        </div>

        <div className="mt-3">
          <div className="label-small mb-2">Style (max 2)</div>
          <div className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-1.5">
              {STYLE_META.map((s) => {
                const isActive = styles.includes(s.id);
                return (
                  <Chip
                    key={s.id}
                    active={isActive}
                    onClick={() => {
                      if (isActive) {
                        setStyles(styles.filter((x) => x !== s.id));
                      } else if (styles.length < 2) {
                        setStyles([...styles, s.id]);
                      }
                    }}
                  >
                    {s.label}
                  </Chip>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="label-small mb-2">Longueur</div>
          <div className="flex gap-1.5">
            {[4, 8, 12, 16].map((n) => (
              <Chip
                key={n}
                active={length === n}
                onClick={() => setLength(n as 4 | 8 | 12 | 16)}
              >
                {n}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      {/* ─── Slots row ─── */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="eyebrow">Ta progression</div>
          {lockedChords.length > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-[11px] text-text-soft hover:border-danger/40 hover:text-danger"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>
        <div
          className={clsx(
            'grid gap-2',
            length === 4 && 'grid-cols-4',
            length === 8 && 'grid-cols-4 sm:grid-cols-8',
            length === 12 && 'grid-cols-4 sm:grid-cols-6 md:grid-cols-12',
            length === 16 && 'grid-cols-4 sm:grid-cols-8 md:grid-cols-8 lg:grid-cols-16',
          )}
        >
          {slots.map((chord, i) => (
            <SlotCell
              key={i}
              idx={i}
              chord={chord}
              isActive={activeSlot === i}
              isPlaying={playingIdx === i}
              onTap={() => {
                if (chord !== null) {
                  unlockSlot(i);
                } else {
                  setActiveSlot(i);
                }
              }}
            />
          ))}
        </div>

        {!allFilled && activeSlot === null && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={start}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold text-base font-bold text-bg shadow-gold-strong transition-all hover:-translate-y-px active:scale-[0.99] sm:w-auto sm:flex-1"
            >
              <Sparkles size={16} />
              {lockedChords.length > 0 ? 'Continuer la suggestion' : 'Démarrer la suggestion'}
            </button>
            <button
              type="button"
              onClick={generateAll}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-sm font-semibold text-text transition-colors hover:border-gold-soft"
            >
              <Dices size={14} />
              Tout générer
            </button>
          </div>
        )}
      </Card>

      {/* ─── Suggestions pour le slot actif ─── */}
      {activeSlot !== null && suggestions.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="eyebrow">Slot {activeSlot + 1} — Suggestions</div>
              <p className="mt-0.5 text-xs text-text-muted">
                Choisis un accord pour locker ce slot. L'algo tient compte des locks précédents.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSlot(null)}
              className="rounded-md px-2 py-1 text-xs text-text-soft hover:text-text"
              aria-label="Fermer les suggestions"
            >
              Annuler
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s) => (
              <SuggestionCard
                key={s.chord}
                suggestion={s}
                onPick={() => lockSuggestion(s)}
                lockedBefore={slots.slice(0, activeSlot).filter((c): c is string => Boolean(c))}
              />
            ))}
          </div>
        </Card>
      )}

      {/* ─── Progression complète + actions ─── */}
      {lockedChords.length > 0 && allFilled && (
        <FinishedActions
          chords={lockedChords}
          keyName={keyName}
          mode={mode}
          styles={styles}
          onPlayingChange={setPlayingIdx}
        />
      )}
    </div>
  );
}

// ─── SlotCell ──────────────────────────────────────────────────────

function SlotCell({
  idx,
  chord,
  isActive,
  isPlaying,
  onTap,
}: {
  idx: number;
  chord: string | null;
  isActive: boolean;
  isPlaying: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={chord ? `Slot ${idx + 1} : ${chord} — tap pour unlock` : `Slot ${idx + 1} vide`}
      className={clsx(
        'group relative flex h-16 min-w-0 flex-col items-center justify-center rounded-xl border-2 px-1 transition-all active:scale-[0.97]',
        chord
          ? isPlaying
            ? 'border-gold-bright bg-gold/25 shadow-gold-strong'
            : 'border-gold bg-gold/10 hover:bg-gold/15'
          : isActive
            ? 'border-gold-soft bg-surface-2 ring-2 ring-gold/40'
            : 'border-dashed border-border bg-surface-2 hover:border-gold-soft',
      )}
    >
      <span className="absolute left-1 top-0.5 font-mono text-[9px] text-text-soft">{idx + 1}</span>
      {chord ? (
        <>
          <span className="display max-w-full truncate font-mono text-base text-gold">{chord}</span>
          <Lock
            size={9}
            className="absolute right-1 top-1 text-gold opacity-60 group-hover:opacity-100"
          />
        </>
      ) : (
        <span className="text-xs text-text-soft">?</span>
      )}
    </button>
  );
}

// ─── SuggestionCard ────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  lockedBefore,
  onPick,
}: {
  suggestion: ChordSuggestion;
  lockedBefore: string[];
  onPick: () => void;
}) {
  const { strum } = useAudio();
  const chordData = getChord(suggestion.chord);
  const [previewing, setPreviewing] = useState(false);

  const fitColor =
    suggestion.fit === 'natural'
      ? 'border-success/40 bg-success/10 text-success'
      : suggestion.fit === 'colorful'
        ? 'border-gold/40 bg-gold/10 text-gold-bright'
        : 'border-[#b88dff]/40 bg-[#b88dff]/10 text-[#b88dff]';
  const fitEmoji =
    suggestion.fit === 'natural' ? '💚' : suggestion.fit === 'colorful' ? '💛' : '💜';
  const fitLabel =
    suggestion.fit === 'natural'
      ? 'Naturel'
      : suggestion.fit === 'colorful'
        ? 'Coloré'
        : 'Surprise';

  const handleTest = async () => {
    setPreviewing(true);
    // Play lockedBefore + candidat
    const seq = [...lockedBefore, suggestion.chord];
    const beatMs = 60_000 / 100; // 1 noire à 100 BPM
    for (const c of seq) {
      void strum(c, 'down');
      await new Promise((r) => setTimeout(r, beatMs * 2));
    }
    setPreviewing(false);
  };

  return (
    <div
      className={clsx(
        'flex items-stretch gap-2 rounded-xl border-2 bg-surface p-2.5 transition-colors',
        suggestion.fit === 'natural'
          ? 'border-success/30 hover:border-success/60'
          : suggestion.fit === 'colorful'
            ? 'border-gold/30 hover:border-gold-soft'
            : 'border-[#b88dff]/30 hover:border-[#b88dff]/60',
      )}
    >
      {/* Diagram mini */}
      <div className="shrink-0">
        {chordData && chordData.voicings[0] ? (
          <ChordDiagram voicing={chordData.voicings[0]} name={chordData.name} size="sm" />
        ) : (
          <div className="flex h-20 w-16 items-center justify-center rounded-md border border-dashed border-border bg-surface-2 font-mono text-xs text-text-soft">
            {suggestion.chord}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="display font-mono text-lg text-gold">{suggestion.chord}</span>
          <span
            className={clsx(
              'shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider',
              fitColor,
            )}
            title={`Score : ${suggestion.score}/100`}
          >
            {fitEmoji} {fitLabel}
          </span>
        </div>
        {suggestion.roman && (
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-soft">
            {suggestion.roman}
          </div>
        )}
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-text-muted">{suggestion.reason}</p>

        <div className="mt-auto flex items-center gap-1.5 pt-2">
          <button
            type="button"
            onClick={() => void handleTest()}
            disabled={previewing}
            aria-label="Tester en contexte"
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-text-muted transition-colors hover:border-gold-soft hover:text-text disabled:opacity-50"
          >
            {previewing ? <Pause size={11} /> : <Play size={11} fill="currentColor" />}
            Test
          </button>
          <button
            type="button"
            onClick={onPick}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md bg-gold px-2 text-[11px] font-semibold text-bg transition-colors hover:bg-gold-bright active:scale-[0.97]"
          >
            <Lock size={11} />
            Locker
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FinishedActions ──────────────────────────────────────────────

function FinishedActions({
  chords,
  keyName,
  mode,
  styles,
  onPlayingChange,
}: {
  chords: string[];
  keyName: NoteName;
  mode: 'major' | 'minor';
  styles: ProgressionStyle[];
  onPlayingChange: (idx: number | null) => void;
}) {
  const { strum } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const cancelRef = useRef(false);
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isConnected = useAuth((s) => !!s.user);

  // Sauvegarde la progression custom (Dexie + Supabase si connecté).
  // Save local autorisé sans compte ; soft-prompt connexion pour le cloud.
  const handleSave = async () => {
    const fallback = `${keyName} ${mode === 'minor' ? 'mineur' : 'majeur'}`;
    const name = (window.prompt('Nom de ta progression ?', fallback) ?? '').trim();
    if (!name) return;
    setSaving(true);
    try {
      await saveCustomProgression({
        name,
        chords,
        key: keyName,
        mode,
        style: styles[0],
      });
      toast.success(`Progression « ${name} » sauvegardée !`);
      if (!isConnected) {
        window.setTimeout(
          () =>
            toast.info('Connecte-toi pour retrouver tes progressions sur tous tes appareils'),
          1000,
        );
      }
    } catch {
      toast.error('Échec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePlay = async () => {
    if (playing) {
      cancelRef.current = true;
      setPlaying(false);
      onPlayingChange(null);
      return;
    }
    setPlaying(true);
    cancelRef.current = false;
    const beatMs = 60_000 / 80;
    const cycles = loop ? 8 : 1;
    for (let c = 0; c < cycles && !cancelRef.current; c++) {
      for (let i = 0; i < chords.length; i++) {
        if (cancelRef.current) break;
        onPlayingChange(i);
        void strum(chords[i], 'down');
        await new Promise((r) => setTimeout(r, beatMs * 4));
      }
    }
    if (!cancelRef.current) {
      onPlayingChange(null);
      setPlaying(false);
    }
  };

  useEffect(() => () => { cancelRef.current = true; }, []);

  return (
    <>
      <Card className="border-gold/40 bg-gradient-to-br from-gold/10 to-transparent">
        <div className="eyebrow flex items-center gap-1.5">
          <Sparkles size={11} className="text-gold" /> Progression terminée
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {chords.length} accords en {keyName} {mode === 'minor' ? 'mineur' : 'majeur'} ·{' '}
          {chords.join(' → ')}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handlePlay()}
            className={clsx(
              'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors',
              playing
                ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
                : 'bg-gold text-bg hover:bg-gold-bright',
            )}
          >
            {playing ? (
              <>
                <Pause size={14} fill="currentColor" /> Stop
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" /> Écouter
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setLoop((l) => !l)}
            aria-pressed={loop}
            className={clsx(
              'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm transition-colors',
              loop
                ? 'border-gold bg-gold/15 text-gold'
                : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text',
            )}
          >
            🔁 Loop {loop ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-semibold text-bg transition-colors hover:bg-gold-bright disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border-gold bg-gold/5 px-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            <Music2 size={14} />
            Ajouter à un morceau
          </button>
        </div>
      </Card>

      <AddChordsToSongSheet
        chords={chords}
        keyName={keyName}
        mode={mode}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onPicked={(songId) => {
          setAddOpen(false);
          navigate(`/songs/${songId}`);
        }}
      />
    </>
  );
}

// Pour silence imports unused si quelqu'un n'utilise pas romanToChord
void romanToChord;

// ─── Add to song (Sheet réutilisable) ─────────────────────────────

function AddChordsToSongSheet({
  chords,
  keyName,
  mode,
  open,
  onClose,
  onPicked,
}: {
  chords: string[];
  keyName: NoteName;
  mode: 'major' | 'minor';
  open: boolean;
  onClose: () => void;
  onPicked: (songId: string) => void;
}) {
  const songs = useLiveQuery(() => db.songs.toArray(), []);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Ajouter à un morceau"
      description={`Tes accords (${keyName} ${mode === 'minor' ? 'mineur' : 'majeur'}) seront ajoutés comme nouvelle section.`}
    >
      {!songs || songs.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-soft">
          Aucun morceau dans ta bibliothèque. Crée-en un d'abord.
        </p>
      ) : (
        <ul className="grid gap-2">
          {songs.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={async () => {
                  const newSection = {
                    id: newSectionId(),
                    name: `Progression ${keyName}${mode === 'minor' ? 'm' : ''}`,
                    chords: chords.map((c) => ({ name: c, beats: 4 })),
                  };
                  await saveSong({ ...s, sections: [...s.sections, newSection] } as Song);
                  onPicked(s.id);
                }}
                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors hover:border-gold-soft hover:bg-gold/5"
              >
                <div className="font-semibold">{s.title}</div>
                {s.artist && <div className="mt-0.5 text-xs text-text-muted">{s.artist}</div>}
                <div className="mt-1 text-[10px] text-text-soft">
                  {s.key}
                  {s.mode === 'minor' ? 'm' : ''} · {s.tempo} bpm · {s.sections.length} sections
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIQUES TAB — reuse UI existante
// ═══════════════════════════════════════════════════════════════════

type RootFilter = 'all' | NoteName;
type MoodFilter = 'all' | Mood;
type DiffFilter = 'all' | Difficulty;

function ClassicsTab() {
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');
  const [rootFilter, setRootFilter] = useState<RootFilter>('all');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [targetRoot, setTargetRoot] = useState<NoteName>('C');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [addToSongFor, setAddToSongFor] = useState<Progression | null>(null);

  const filtered = useMemo(() => {
    return PROGRESSIONS.filter((p) => {
      if (moodFilter !== 'all' && !p.moods.includes(moodFilter)) return false;
      if (diffFilter !== 'all' && p.difficulty !== diffFilter) return false;
      if (rootFilter !== 'all' && p.refRoot !== rootFilter) return false;
      return true;
    });
  }, [moodFilter, rootFilter, diffFilter]);

  // silence unused
  void setRootFilter;

  return (
    <div className="space-y-5">
      <div>
        <div className="label-small mb-2">Mood</div>
        <div className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-1.5">
            <Chip active={moodFilter === 'all'} onClick={() => setMoodFilter('all')}>
              Tous
            </Chip>
            {ALL_MOODS.map((m) => (
              <Chip key={m} active={moodFilter === m} onClick={() => setMoodFilter(m)}>
                {MOOD_LABELS[m]}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="label-small mb-2">Difficulté</div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={diffFilter === 'all'} onClick={() => setDiffFilter('all')}>
            Toutes
          </Chip>
          {[1, 2, 3, 4, 5].map((d) => (
            <Chip
              key={d}
              active={diffFilter === d}
              onClick={() => setDiffFilter(d as Difficulty)}
            >
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={clsx(
                      'h-1 w-1.5 rounded-full',
                      i < d ? 'bg-current' : 'bg-current opacity-25',
                    )}
                  />
                ))}
              </span>
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="label-small mb-2">
          Tonalité cible — toutes les progressions seront transposées
        </div>
        <div className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-1.5">
            {NOTE_NAMES.map((n) => (
              <Chip
                key={n}
                active={targetRoot === n}
                onClick={() => setTargetRoot(n)}
                mono
              >
                {n}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-text-soft">
        {filtered.length} progression{filtered.length > 1 ? 's' : ''}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((prog) => (
          <ProgressionClassicCard
            key={prog.id}
            progression={prog}
            targetRoot={targetRoot}
            isPlaying={playingId === prog.id}
            onPlay={() => setPlayingId(playingId === prog.id ? null : prog.id)}
            onAddToSong={() => setAddToSongFor(prog)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-text-soft">
          Aucune progression ne correspond à ces filtres.
        </p>
      )}

      <AddToSongSheet
        progression={addToSongFor}
        targetRoot={targetRoot}
        onClose={() => setAddToSongFor(null)}
      />
    </div>
  );
}

// ─── Classique card ───────────────────────────────────────────────

function ProgressionClassicCard({
  progression,
  targetRoot,
  isPlaying,
  onPlay,
  onAddToSong,
}: {
  progression: Progression;
  targetRoot: NoteName;
  isPlaying: boolean;
  onPlay: () => void;
  onAddToSong: () => void;
}) {
  const { strum } = useAudio();
  const chords = useMemo(
    () => transposeProgression(progression, targetRoot),
    [progression, targetRoot],
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const stopRef = useRef<boolean>(false);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  useEffect(() => {
    if (!isPlaying) {
      stopRef.current = true;
      setActiveIdx(null);
      return;
    }
    stopRef.current = false;
    const tempo = 100;
    const beatMs = 60000 / tempo;
    const cycles = 4;
    let idx = 0;
    const total = chords.length * cycles;
    let cancelled = false;

    (async () => {
      while (idx < total && !stopRef.current && !cancelled) {
        const c = chords[idx % chords.length];
        if (cancelled) break;
        setActiveIdx(idx % chords.length);
        void strum(c.name, 'down');
        await new Promise((r) => setTimeout(r, c.beats * beatMs));
        idx++;
      }
      if (!cancelled) {
        setActiveIdx(null);
        if (idx >= total) onPlayRef.current();
      }
    })();

    return () => {
      cancelled = true;
      stopRef.current = true;
      setActiveIdx(null);
    };
  }, [isPlaying, chords, strum]);

  return (
    <Card hover className="group relative flex flex-col">
      <span
        className="pointer-events-none absolute right-3 top-3 text-text-soft transition-all group-hover:scale-110 group-hover:text-gold"
        aria-hidden
      >
        <Volume2 size={14} strokeWidth={1.8} />
      </span>
      <div className="flex items-start justify-between gap-2 pr-6">
        <div className="min-w-0 flex-1">
          <h3 className="display text-display-sm leading-tight">{progression.name}</h3>
          <div className="mt-0.5 font-mono text-xs text-gold">{progression.degrees}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                'h-1.5 w-2 rounded-full',
                i < progression.difficulty ? 'bg-gold' : 'bg-border',
              )}
            />
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-text-muted">{progression.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {progression.moods.map((m) => (
          <span
            key={m}
            className="rounded-md bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold"
          >
            {MOOD_LABELS[m]}
          </span>
        ))}
      </div>

      {progression.examples && (
        <p className="mt-2 text-xs text-text-soft">{progression.examples}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {chords.map((c, i) => (
          <div
            key={i}
            className={clsx(
              'flex h-9 items-center rounded-lg border px-2.5 font-mono text-sm font-bold transition-colors',
              activeIdx === i
                ? 'border-gold bg-gold/15 text-gold-bright shadow-gold'
                : 'border-border bg-surface-2 text-gold',
            )}
          >
            {c.name}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onPlay}
          className={clsx(
            'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
            isPlaying
              ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
              : 'bg-gold text-bg hover:bg-gold-bright',
          )}
        >
          {isPlaying ? (
            <>
              <Pause size={14} fill="currentColor" /> Stop
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" /> Écouter
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onAddToSong}
          aria-label="Ajouter à un morceau"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border-gold px-3 text-xs hover:bg-gold/5"
        >
          <Plus size={14} /> + morceau
        </button>
      </div>
    </Card>
  );
}

// ─── AddToSongSheet (legacy classics) ─────────────────────────────

function AddToSongSheet({
  progression,
  targetRoot,
  onClose,
}: {
  progression: Progression | null;
  targetRoot: NoteName;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const songs = useLiveQuery(() => db.songs.toArray(), []);

  const handlePick = async (song: Song) => {
    if (!progression) return;
    const chords = transposeProgression(progression, targetRoot);
    const newSection = {
      id: newSectionId(),
      name: progression.name,
      chords: chords.map((c) => ({ name: c.name, beats: c.beats })),
    };
    await saveSong({ ...song, sections: [...song.sections, newSection] });
    onClose();
    navigate(`/songs/${song.id}`);
  };

  return (
    <Sheet
      open={progression !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Ajouter à un morceau"
      description={
        progression
          ? `${progression.name} en ${targetRoot} sera ajouté comme nouvelle section.`
          : undefined
      }
    >
      {!songs || songs.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-soft">
          Aucun morceau dans ta bibliothèque.{' '}
          <Link to="/songs/new" className="text-gold underline">
            Crées-en un d'abord
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-2">
          {songs.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors hover:border-gold-soft hover:bg-gold/5"
              >
                <div className="font-semibold">{s.title}</div>
                {s.artist && <div className="mt-0.5 text-xs text-text-muted">{s.artist}</div>}
                <div className="mt-1 text-[10px] text-text-soft">
                  {s.key}
                  {s.mode === 'minor' ? 'm' : ''} · {s.tempo} bpm · {s.sections.length} sections
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

// ─── Shared primitives ────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors',
        active
          ? 'border-gold bg-gold text-bg shadow-gold'
          : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  mono,
  children,
}: {
  active: boolean;
  onClick: () => void;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors',
        mono && 'font-mono',
        active
          ? 'border-gold bg-gold text-bg'
          : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

// silence imports unused warnings
void Unlock;
