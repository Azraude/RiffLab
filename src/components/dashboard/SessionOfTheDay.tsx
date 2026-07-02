/**
 * SessionOfTheDay — la card vedette du Dashboard (refonte home 2026-06-25).
 *
 * Accord du jour (pickOfTheDay côté Dashboard) : eyebrow, titre serif
 * "Travaille" + nom d'accord or italique, chips, description, ChordDiagram,
 * 2 CTA (Écouter subtle + "J'ai pratiqué" gold gradient), filigrane guitare
 * décoratif en fond. Garde l'ancre data-tutorial-id="practice-button".
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2, Check, Target } from 'lucide-react';
import clsx from 'clsx';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import type { Chord } from '@/lib/chordDatabase';

interface SessionOfTheDayProps {
  chord: Chord;
  /** Nom de la gamme du jour (ex "Majeure"). */
  scaleLabel: string;
  /** Tonalité du jour (ex "G"). */
  keyName: string;
  practicedToday: boolean;
  onListen: () => void;
  onMarkPracticed: () => void;
}

export function SessionOfTheDay({
  chord,
  scaleLabel,
  keyName,
  practicedToday,
  onListen,
  onMarkPracticed,
}: SessionOfTheDayProps) {
  const voicing = chord.voicings[0];

  return (
    <section className="relative my-4 overflow-hidden rounded-[20px] border border-gold/25 bg-gradient-to-br from-surface-2 to-bg p-5">
      <GuitarFiligrane />

      {/* Eyebrow */}
      <div className="eyebrow relative flex items-center gap-1.5">
        <Target size={13} className="shrink-0" />
        Session du jour
      </div>

      {/* Titre + chord diagram */}
      <div className="relative mt-3 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="display text-3xl leading-tight text-text">Travaille</h2>
          <p className="display text-2xl italic text-gold">{chord.name}</p>

          {/* Chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex h-6 items-center rounded-md border border-gold/30 bg-gold/5 px-2 font-mono text-[11px] font-bold text-gold">
              {chord.name}
            </span>
            <Link
              to="/scales"
              className="inline-flex h-6 items-center rounded-md border border-border bg-surface px-2 font-mono text-[11px] text-text-muted transition-colors hover:border-gold-soft hover:text-gold"
              aria-label={`Voir la gamme ${scaleLabel} sur le manche`}
            >
              {keyName} · {scaleLabel}
            </Link>
          </div>

          <p className="mt-3 text-sm italic leading-relaxed text-text-muted">
            {getChordVibe(chord.name)}
          </p>
        </div>

        {/* Chord diagram */}
        {voicing && (
          <div className="shrink-0 rounded-xl border border-border bg-bg/50 p-2">
            <ChordDiagram voicing={voicing} name={chord.name} size="sm" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="relative mt-5 grid grid-cols-[auto_1fr] gap-2">
        <button
          type="button"
          onClick={onListen}
          className="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface px-4 font-medium text-text transition-colors hover:border-gold-soft hover:text-gold"
        >
          <Volume2 size={18} />
          Écouter
        </button>
        <motion.button
          type="button"
          data-tutorial-id="practice-button"
          onClick={onMarkPracticed}
          disabled={practicedToday}
          whileTap={{ scale: 0.97 }}
          className={clsx(
            'flex h-12 items-center justify-center gap-2 rounded-xl font-bold transition-all',
            practicedToday
              ? 'border border-success/40 bg-success/10 text-success'
              : 'bg-gradient-to-b from-gold-bright to-gold text-bg shadow-[0_4px_16px_rgb(var(--gold-glow)/0.35)]'
          )}
        >
          <Check size={18} />
          {practicedToday ? 'Pratiqué' : "J'ai pratiqué"}
        </motion.button>
      </div>
    </section>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

/** Décor filigrane doré subtil (guitare stylisée) en fond de card. */
function GuitarFiligrane() {
  return (
    <svg
      viewBox="0 0 400 200"
      className="pointer-events-none absolute -bottom-4 -right-4 h-40 w-64 opacity-[0.08]"
      aria-hidden
    >
      <path
        d="M50 100 Q100 50, 200 100 T350 100"
        stroke="rgb(var(--gold))"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="300" cy="100" r="35" stroke="rgb(var(--gold))" strokeWidth="1.5" fill="none" />
      <circle cx="300" cy="100" r="8" stroke="rgb(var(--gold))" strokeWidth="1" fill="none" />
    </svg>
  );
}

/** Description courte de l'accord — mapping + fallback générique. */
function getChordVibe(name: string): string {
  const vibes: Record<string, string> = {
    C: "L'accord de la simplicité pure. Aucun bémol, aucun dièse — direct.",
    Cmaj7: 'Lumineux et ouvert — parfait pour les ballades.',
    Am: 'Mélancolique et profond. Le point de départ de mille chansons.',
    G: 'Rond, chaleureux. La couleur folk par excellence.',
    D: 'Brillant et énergique — le moteur des refrains.',
    Em: "Le mineur le plus naturel du manche. Sombre juste ce qu'il faut.",
    E: 'Puissant, taillé pour le blues et le rock.',
    F: 'Le premier vrai défi barré — passage obligé, ça vaut le coup.',
    Dm: 'Tendu, dramatique. Il appelle une résolution.',
    A: 'Franc et ensoleillé, trois doigts serrés.',
  };
  return vibes[name] ?? `Accord ${name} — travaille sa position et fais-le sonner clair.`;
}
