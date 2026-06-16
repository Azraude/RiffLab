/**
 * RiffEditor — wizard 3 steps pour créer un riff (sess 27 Phase 4).
 *
 * Steps :
 *  1. Métadonnées : titre / artiste / BPM / tonalité / tags
 *  2. Notation : grille interactive 6 cordes × N mesures (click pour fret),
 *     +/- mesures
 *  3. Touches finales : description, techniques, difficulté auto, preview
 *     audio, publish
 *
 * Save dans Dexie userRiffs (Phase 4 = local, pas de backend).
 */
import { useMemo, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Minus, Trash2, Send, Music2 } from 'lucide-react';
import clsx from 'clsx';
import type { Tab, TabNote, TabString } from '@/lib/tabsDatabase';
import {
  ALL_RIFF_TAGS,
  ALL_RIFF_TECHNIQUES,
  TECHNIQUE_LABELS,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type RiffTag,
  type RiffTechnique,
} from '@/lib/communityRiffs';
import { computeDifficulty } from '@/lib/riffDifficulty';
import { RiffPlayer } from './RiffPlayer';
import { checkAndUnlockBadges, newUserRiffId, saveUserRiff, type UserRiff } from '@/lib/db';
import { getBadgeMeta } from '@/lib/badges';
import { publishRiff } from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useSocialStreak } from '@/stores/socialStreakStore';
import { useToast } from '@/hooks/useToast';

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']; // top → bottom (high E first)
const BEATS_PER_MEASURE = 16;
// 4 colonnes par temps fort pour simplifier l'édition (1 click = noire)
// On affiche 4 cellules par mesure (= 1 colonne = 4 beats = 1 noire)
const CELLS_PER_MEASURE = 4;
const CELL_BEATS = BEATS_PER_MEASURE / CELLS_PER_MEASURE; // 4 beats par cellule = noire

interface RiffEditorProps {
  open: boolean;
  onClose: () => void;
  onPublished?: (riff: UserRiff) => void;
}

type Cell = { fret: number | null };

export function RiffEditor({ open, onClose, onPublished }: RiffEditorProps) {
  const toast = useToast();
  const me = useAuth((s) => s.user);
  const navigate = useNavigate();

  // === Step 1 state ===
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpm, setBpm] = useState(120);
  const [tonalKey, setTonalKey] = useState('E');
  const [mode, setMode] = useState<'major' | 'minor'>('minor');
  const [tags, setTags] = useState<RiffTag[]>([]);

  // === Step 2 state : grille 6 strings × N measures × CELLS_PER_MEASURE cells ===
  const [measureCount, setMeasureCount] = useState(2);
  // Map "stringIdx:measureIdx:cellIdx" → fret number (null = no note)
  const [cells, setCells] = useState<Record<string, Cell>>({});

  // === Step 3 state ===
  const [description, setDescription] = useState('');
  const [techniques, setTechniques] = useState<RiffTechnique[]>([]);
  const [publishing, setPublishing] = useState(false);

  /** Build le Tab depuis les cells pour preview audio + compute difficulty. */
  const tab = useMemo<Tab>(() => {
    const measures: TabNote[][] = [];
    for (let m = 0; m < measureCount; m++) {
      const notes: TabNote[] = [];
      for (let s = 0; s < 6; s++) {
        for (let c = 0; c < CELLS_PER_MEASURE; c++) {
          const cell = cells[`${s}:${m}:${c}`];
          if (cell?.fret != null) {
            notes.push({
              string: s as TabString,
              fret: cell.fret,
              duration: CELL_BEATS,
              startBeat: c * CELL_BEATS,
            });
          }
        }
      }
      measures.push(notes);
    }
    return {
      id: 'preview',
      name: title || 'Mon riff',
      artist: artist || undefined,
      tempo: bpm,
      key: `${tonalKey}${mode === 'minor' ? 'm' : ''}`,
      measures,
    };
  }, [cells, measureCount, title, artist, bpm, tonalKey, mode]);

  const difficulty = useMemo(
    () => computeDifficulty({ tab, techniques, bpm }),
    [tab, techniques, bpm]
  );

  /** Click sur une cell : cycle fret null → 0 → 1 → 2 → ... → 12 → null. */
  const handleCellClick = (s: number, m: number, c: number) => {
    const key = `${s}:${m}:${c}`;
    const current = cells[key]?.fret;
    let next: number | null;
    if (current == null) next = 0;
    else if (current >= 12) next = null;
    else next = current + 1;
    setCells((prev) => ({ ...prev, [key]: { fret: next } }));
  };

  /** Long click / right click sur une cell : reset à null. Pas implémenté UX
   *  pour rester simple — on cycle juste. */

  const handleAddMeasure = () => setMeasureCount((n) => Math.min(8, n + 1));
  const handleRemoveMeasure = () => {
    if (measureCount <= 1) return;
    // Drop les cells de la dernière mesure pour ne pas garder du state mort
    setCells((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        const [_s, m] = k.split(':').map(Number);
        if (m === measureCount - 1) delete next[k];
      }
      return next;
    });
    setMeasureCount((n) => n - 1);
  };

  const handleClearAll = () => {
    if (!confirm('Effacer toute la tablature ?')) return;
    setCells({});
  };

  const toggleTag = (t: RiffTag) =>
    setTags((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));
  const toggleTechnique = (t: RiffTechnique) =>
    setTechniques((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  const handleReset = () => {
    setStep(1);
    setTitle('');
    setArtist('');
    setBpm(120);
    setTonalKey('E');
    setMode('minor');
    setTags([]);
    setMeasureCount(2);
    setCells({});
    setDescription('');
    setTechniques([]);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.warning('Donne un titre à ton riff');
      setStep(1);
      return;
    }
    const noteCount = tab.measures.flatMap((m) => m).length;
    if (noteCount === 0) {
      toast.warning('Ton tab est vide — ajoute au moins une note');
      setStep(2);
      return;
    }
    setPublishing(true);
    const id = newUserRiffId();
    const userRiff: UserRiff = {
      id,
      title: title.trim(),
      artist: artist.trim() || undefined,
      bpm,
      key: `${tonalKey}${mode === 'minor' ? 'm' : ''}`,
      tabJson: JSON.stringify(tab.measures),
      tags,
      techniques,
      description: description.trim() || undefined,
      level: difficulty.level,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // 1. Save Dexie local (toujours, même si pas connecté)
    await saveUserRiff(userRiff);
    useSocialStreak.getState().recordActivity();

    // 2. Push Supabase si connecté (sess 30 wiring)
    let publishedPublicly = false;
    if (me) {
      const { error } = await publishRiff({
        id, // shared UUID Dexie ↔ Supabase
        author_id: me.id,
        title: userRiff.title,
        artist: userRiff.artist ?? null,
        description: userRiff.description ?? null,
        bpm: userRiff.bpm,
        tuning: 'standard',
        capo: 0,
        key: userRiff.key,
        difficulty: userRiff.level,
        techniques: userRiff.techniques as string[],
        tags: userRiff.tags,
        tab_data: JSON.parse(userRiff.tabJson),
        duration_ms: null,
      });
      if (error) {
        console.error('[RiffEditor] publishRiff Supabase fail', error);
        toast.warning(
          `Riff sauvé local, partage public échoué : ${error.message}`,
          { duration: 7000 }
        );
      } else {
        publishedPublicly = true;
      }
    }

    setPublishing(false);

    // 3. Toast final + redirect
    if (publishedPublicly) {
      toast.success(`🎸 Riff publié ! Disponible dans le feed.`);
      window.setTimeout(() => navigate(`/riffs/${id}`), 800);
    } else if (me) {
      // Connecté mais push fail (déjà toast warning au-dessus)
      toast.info(`Sauvé local sous "${title}".`);
    } else {
      toast.info(
        `Riff sauvé localement. Connecte-toi pour le partager publiquement.`,
        { duration: 7000 }
      );
    }

    // Badge "first-riff" unlock potentiel
    const newBadges = await checkAndUnlockBadges();
    for (const slug of newBadges) {
      const meta = getBadgeMeta(slug);
      if (meta) toast.success(`${meta.emoji} Badge : ${meta.title}`, { duration: 6000 });
    }
    onPublished?.(userRiff);
    handleReset();
    onClose();
  };

  const canGoNext = step === 1 ? title.trim().length > 0 : true;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          handleReset();
        }
        if (o !== open) {
          if (!o) onClose();
        }
      }}
      title="🎸 Partager mon riff"
      description={`Étape ${step} sur 3`}
    >
      {/* Stepper */}
      <div className="mb-5 flex gap-2">
        {([1, 2, 3] as const).map((s) => (
          <div
            key={s}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-colors',
              s <= step ? 'bg-gold' : 'bg-border'
            )}
          />
        ))}
      </div>

      {/* === STEP 1 — Métadonnées === */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <Field label="Titre *">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Mon riff blues"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
              autoFocus
            />
          </Field>

          <Field label="Artiste / interprète (optionnel)">
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="ex: Stevie Ray Vaughan"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tonalité">
              <select
                value={tonalKey}
                onChange={(e) => setTonalKey(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Mode">
              <div className="flex h-11 gap-2">
                {(['major', 'minor'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={clsx(
                      'flex-1 rounded-xl border text-sm font-medium transition-colors',
                      mode === m
                        ? 'border-gold bg-gold/15 text-gold'
                        : 'border-border bg-surface text-text-muted'
                    )}
                  >
                    {m === 'major' ? 'Maj' : 'Min'}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label={`Tempo · ${bpm} BPM`}>
            <input
              type="range"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </Field>

          <Field label="Genres (multi-select)">
            <div className="flex flex-wrap gap-2">
              {ALL_RIFF_TAGS.map((t) => (
                <Chip key={t} active={tags.includes(t)} onClick={() => toggleTag(t)}>
                  #{t}
                </Chip>
              ))}
            </div>
          </Field>
        </motion.div>
      )}

      {/* === STEP 2 — Notation du tab === */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <p className="text-xs text-text-muted">
            Click sur une cellule pour cycler la frette (vide → 0 → 1 → 2 ... → 12 → vide).
            Chaque colonne = une noire. 4 colonnes par mesure.
          </p>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-muted">
                {measureCount} mesure{measureCount > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleRemoveMeasure}
                disabled={measureCount <= 1}
                aria-label="Retirer mesure"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted hover:border-danger/40 hover:text-danger disabled:opacity-40"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={handleAddMeasure}
                disabled={measureCount >= 8}
                aria-label="Ajouter mesure"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs text-text-soft hover:border-danger/40 hover:text-danger"
            >
              <Trash2 size={12} /> Effacer
            </button>
          </div>

          {/* Grille */}
          <div className="-mx-1 overflow-x-auto px-1 pb-2">
            <div className="inline-block min-w-full">
              <table className="border-separate border-spacing-0">
                <tbody>
                  {Array.from({ length: 6 }).map((_, s) => (
                    <tr key={s}>
                      <td className="w-7 pr-2 text-right font-mono text-[11px] font-bold text-text-soft">
                        {STRING_LABELS[s]}
                      </td>
                      {Array.from({ length: measureCount }).map((_, m) => (
                        <td key={`m-${m}`} className="px-0.5">
                          <div className="flex">
                            {Array.from({ length: CELLS_PER_MEASURE }).map((_, c) => {
                              const cell = cells[`${s}:${m}:${c}`];
                              const isFirst = c === 0;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleCellClick(s, m, c)}
                                  className={clsx(
                                    'flex h-8 w-9 items-center justify-center border-y border-border bg-surface font-mono text-xs transition-colors hover:bg-gold/10',
                                    isFirst && 'border-l-2 border-l-gold-soft/50',
                                    cell?.fret != null ? 'text-gold font-bold' : 'text-text-soft'
                                  )}
                                  aria-label={`Corde ${STRING_LABELS[s]}, mesure ${m + 1}, temps ${c + 1}`}
                                >
                                  {cell?.fret != null ? cell.fret : '·'}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                      <td className="border-l-2 border-l-gold/40 pl-0.5"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-center text-xs text-text-muted">
            💡 Tu peux preview ta création à l'étape suivante avant de publier.
          </div>
        </motion.div>
      )}

      {/* === STEP 3 — Touches finales === */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <Field label="Description (optionnel)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conseils pour bien jouer ce riff, contexte, dédicace…"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-gold-soft focus:outline-none"
            />
          </Field>

          <Field label="Techniques utilisées (multi-select)">
            <div className="flex flex-wrap gap-2">
              {ALL_RIFF_TECHNIQUES.map((t) => (
                <Chip
                  key={t}
                  active={techniques.includes(t)}
                  onClick={() => toggleTechnique(t)}
                >
                  {TECHNIQUE_LABELS[t]}
                </Chip>
              ))}
            </div>
          </Field>

          {/* Difficulté auto */}
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <div className="label-small">Difficulté calculée auto</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span
                className={clsx(
                  'rounded-full border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider',
                  LEVEL_COLORS[difficulty.level]
                )}
              >
                {LEVEL_LABELS[difficulty.level]}
              </span>
              <span className="font-mono text-sm text-text-muted">
                Score <span className="font-bold text-gold">{difficulty.score}/100</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-text-soft">
              <span>Densité : +{difficulty.breakdown.densityPts}</span>
              <span>Techniques : +{difficulty.breakdown.techPts}</span>
              <span>Range fret : +{difficulty.breakdown.rangePts}</span>
              <span>BPM : +{difficulty.breakdown.bpmPts}</span>
            </div>
          </div>

          {/* Preview player */}
          <Field label="Preview audio">
            <RiffPlayer tab={tab} />
          </Field>
        </motion.div>
      )}

      {/* === Footer navigation === */}
      <div className="sticky bottom-0 -mx-5 -mb-6 mt-6 flex gap-3 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur-md md:-mx-6 md:px-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            className="inline-flex h-11 items-center gap-1 rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text"
          >
            <ChevronLeft size={14} /> Retour
          </button>
        ) : (
          <span className="flex-1" />
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => canGoNext && setStep((s) => (s === 1 ? 2 : 3))}
            disabled={!canGoNext}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold hover:-translate-y-px disabled:opacity-50"
          >
            Continuer <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={publishing}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-bold text-bg shadow-gold-strong hover:-translate-y-px disabled:opacity-50"
          >
            <Send size={14} /> {publishing ? 'Publication…' : 'Publier 🚀'}
          </button>
        )}
      </div>

      {/* Hidden helper pour empêcher unused warning */}
      <span className="hidden">
        <Music2 size={1} />
      </span>
    </Sheet>
  );
}

// ─── Helpers UI ────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-small mb-2">{label}</div>
      {children}
    </div>
  );
}

function Chip({
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
        'inline-flex h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-gold bg-gold/15 text-gold'
          : 'border-border bg-surface-2 text-text-muted hover:border-gold-soft hover:text-text'
      )}
    >
      {children}
    </button>
  );
}
