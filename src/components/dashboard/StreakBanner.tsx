/**
 * StreakBanner — flamme progressive + compteur streak + pastilles des 7
 * derniers jours (refonte home 2026-06-25).
 *
 * La flamme se remplit selon le ratio de jours pratiqués sur la semaine.
 * `triggerCelebration` (tap "J'ai pratiqué") : bordure embrasée
 * (.streak-celebrating, keyframes globals.css) + 8 particules 🔥.
 * Les pastilles sont les 7 derniers jours GLISSANTS (aujourd'hui à droite),
 * labels réels via DayStatus.weekday.
 */
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { todayKey, type DayStatus } from '@/lib/db';

interface StreakBannerProps {
  streak: number;
  weekDays: DayStatus[];
  triggerCelebration?: boolean;
}

export function StreakBanner({ streak, weekDays, triggerCelebration = false }: StreakBannerProps) {
  const practicedCount = weekDays.filter((d) => d.practiced).length;
  const fillPercent = weekDays.length > 0 ? practicedCount / weekDays.length : 0;

  return (
    <section
      data-tutorial-id="streak-card"
      className={clsx(
        'relative my-3 rounded-2xl border border-border bg-surface-2 p-4',
        triggerCelebration && 'streak-celebrating'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Flamme + compteur → lien vers /stats */}
        <Link to="/stats" className="flex items-center gap-3" aria-label="Voir mes stats">
          <div className="relative">
            <FlameFilled fillPercent={fillPercent} />
            <AnimatePresence>{triggerCelebration && <FlameParticles />}</AnimatePresence>
          </div>
          <div className="leading-tight">
            <div className="display text-3xl tabular-nums text-gold">{streak}</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              {streak > 1 ? "jours d'affilée" : "jour d'affilée"}
            </div>
          </div>
        </Link>

        {/* Pastilles 7 derniers jours */}
        <div className="flex items-center gap-1">
          {weekDays.map((d) => (
            <DayPill
              key={d.date}
              label={d.weekday}
              practiced={d.practiced}
              isToday={d.date === todayKey()}
              date={d.date}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function DayPill({
  label,
  practiced,
  isToday,
  date,
}: {
  label: string;
  practiced: boolean;
  isToday: boolean;
  date: string;
}) {
  return (
    <span
      title={date}
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-bold transition-all',
        practiced
          ? 'border border-gold bg-gradient-to-br from-gold-bright to-gold text-bg shadow-[0_0_8px_rgb(var(--gold-glow)/0.4)]'
          : 'border border-border bg-surface text-text-soft',
        isToday && !practiced && 'ring-2 ring-gold-soft/50 text-gold-soft'
      )}
    >
      {label}
    </span>
  );
}

/** Flamme SVG remplie à fillPercent (0 = contour vide, 1 = or vif + glow). */
function FlameFilled({ fillPercent }: { fillPercent: number }) {
  const pct = Math.round(fillPercent * 100);
  return (
    <svg viewBox="0 0 40 48" className="h-12 w-10" aria-hidden>
      <defs>
        <linearGradient id="streak-flame-fill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgb(var(--gold-bright))" />
          <stop offset={`${pct}%`} stopColor="rgb(var(--gold))" />
          <stop offset={`${pct}%`} stopColor="transparent" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M20 4 C15 12, 8 18, 8 28 C8 36, 13 44, 20 44 C27 44, 32 36, 32 28 C32 22, 27 20, 25 14 C23 22, 20 22, 20 4 Z"
        fill="url(#streak-flame-fill)"
        stroke="rgb(var(--gold-soft))"
        strokeWidth="1.5"
        style={
          fillPercent > 0.3
            ? { filter: 'drop-shadow(0 0 8px rgb(var(--gold-glow) / 0.6))' }
            : undefined
        }
      />
    </svg>
  );
}

/** 8 particules flammes qui s'élèvent pendant la célébration. */
function FlameParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 -m-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], y: -60, scale: 1.2 }}
          exit={{ opacity: 0, transition: { duration: 0.15, delay: 0 } }}
          transition={{ duration: 1.4, delay: i * 0.1, ease: 'easeOut' }}
          className="flame-particle absolute text-sm"
          style={{ left: `${12 + i * 10}%`, bottom: 0 }}
          aria-hidden
        >
          🔥
        </motion.span>
      ))}
    </div>
  );
}
