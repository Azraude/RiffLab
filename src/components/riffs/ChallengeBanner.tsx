/**
 * ChallengeBanner — carte "Riff du jour" (challenge quotidien) en tête du
 * feed /riffs (refonte design 2026-06-24, Phase 1).
 *
 * Mobile-first : gradient surface→bg, halo doré radial top-right, eyebrow
 * countdown, titre serif, metadata (tonalité · BPM · count) et CTA or pleine
 * largeur. Décoratif + incitatif — le clic délègue au parent (onTakeChallenge).
 */
import { Flame, Mic } from 'lucide-react';

export interface DailyChallenge {
  /** Libellé long de la tonalité — "Mi mineur". */
  keyLabel: string;
  /** Tonalité courte affichée — "Em". */
  keyShort: string;
  /** Plage de tempo conseillée — "90-130". */
  bpmRange: string;
  /** Nombre de riffs déjà postés pour le défi. */
  riffCount: number;
  /** Heures restantes avant la fin du défi. */
  endsInHours: number;
  /** Accroche affichée en gros — "Poste un riff en Mi mineur". */
  title: string;
}

interface ChallengeBannerProps {
  challenge: DailyChallenge;
  onTakeChallenge: () => void;
}

export function ChallengeBanner({ challenge, onTakeChallenge }: ChallengeBannerProps) {
  return (
    <div className="relative mb-4 mt-1 overflow-hidden rounded-[18px] border border-gold/20 bg-gradient-to-br from-surface-2 to-bg p-[18px]">
      {/* Halo radial doré décoratif en haut à droite */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 rounded-full"
        style={{ background: 'radial-gradient(circle, rgb(var(--gold-glow) / 0.16) 0%, transparent 62%)' }}
      />

      <div className="relative">
        {/* Eyebrow countdown */}
        <div className="flex items-center gap-2">
          <Flame size={16} className="shrink-0 text-gold-bright" fill="currentColor" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
            Riff du jour · Se termine dans {challenge.endsInHours} h
          </span>
        </div>

        {/* Titre */}
        <h2 className="display mt-2 text-[22px] leading-tight text-text">{challenge.title}</h2>

        {/* Metadata */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-mono text-gold">Tonalité {challenge.keyShort}</span>
          <span className="text-text-muted" aria-hidden>·</span>
          <span className="text-text-muted">♩ {challenge.bpmRange}</span>
          <span className="text-text-muted" aria-hidden>·</span>
          <span className="text-text-muted">{challenge.riffCount} riffs</span>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onTakeChallenge}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold font-bold text-bg shadow-[0_4px_12px_rgba(212,175,55,0.25)] transition-transform active:scale-[0.98]"
        >
          <Mic size={18} />
          Relève le défi
        </button>
      </div>
    </div>
  );
}
