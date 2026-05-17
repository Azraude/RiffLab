/**
 * Tutorial overlay — tour guidé Notion/Linear-style.
 *
 * Composant générique réutilisable :
 * - `Tutorial` = wrapper Dashboard avec les 5 steps onboarding stockés
 *   dans prefs.tutorialCompleted (TASK J session 20)
 * - `TutorialOverlay` = primitive réutilisable qui prend `steps` + `onDone`,
 *   utilisée aussi par PlanTutorial (TASK 3 session 21)
 *
 * Approche :
 * - Backdrop SVG mask spotlight via getBoundingClientRect du target
 * - Tooltip positionné au-dessus ou en-dessous selon l'espace
 * - Step "outro" possible (targetId = null → backdrop plein + modal centré)
 * - Confetti gold optionnel sur le dernier step
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { usePrefs } from '@/stores/prefsStore';

export type TutorialStep = {
  /** Si null, c'est un step "outro" centré sans spotlight */
  targetId: string | null;
  title: string;
  body: string;
  /** Position préférée du tooltip si l'espace le permet */
  prefer?: 'top' | 'bottom';
  /** Texte du bouton suivant (default = "Suivant" / "Terminé" sur le dernier) */
  cta?: string;
  /** Si true, lance une volée de confetti gold au click sur le CTA */
  confetti?: boolean;
};

const HOLE_PADDING = 8;
const TOOLTIP_GAP = 16;

const DASHBOARD_STEPS: TutorialStep[] = [
  {
    targetId: 'practice-button',
    title: "Marque ta session quotidienne",
    body: "Quand tu as joué quelques minutes, tap ce bouton. Ça alimente ta série et tes stats.",
    prefer: 'top',
  },
  {
    targetId: 'streak-card',
    title: 'Ta série',
    body: "Chaque jour compté augmente ta flamme. La série casse si tu rates 2 jours d'affilée — sois régulier.",
    prefer: 'bottom',
  },
  {
    targetId: 'daily-challenge',
    title: 'Le défi du jour',
    body: 'Un riff différent chaque jour. Relève-le pour valider une série séparée et débloquer des badges.',
    prefer: 'bottom',
  },
  {
    targetId: 'sidebar-nav',
    title: 'Tout est à gauche',
    body: 'Sidebar = ton hub : sons, accords, gammes, tuner, métronome. Sur mobile, c\'est en bas.',
    prefer: 'bottom',
  },
  {
    targetId: null,
    title: "C'est parti !",
    body: 'T\'as toutes les clés. Joue, explore, kiffe — RiffLab est un terrain de jeu, pas un cours.',
    cta: 'Allez régale-toi 🎸',
    confetti: true,
  },
];

/**
 * Tutorial Dashboard — appelé depuis Dashboard.tsx avec onDone qui
 * marque tutorialDismissed en local state. Persiste tutorialCompleted
 * dans prefsStore.
 */
export function Tutorial({ onDone }: { onDone: () => void }) {
  const setTutorialCompleted = usePrefs((s) => s.setTutorialCompleted);
  return (
    <TutorialOverlay
      steps={DASHBOARD_STEPS}
      label="Tour guidé"
      onDone={() => {
        setTutorialCompleted(true);
        onDone();
      }}
    />
  );
}

/**
 * TutorialOverlay — primitive réutilisable.
 * Pas de prefs hook ici : c'est le wrapper qui gère la persistance via
 * son `onDone`.
 */
export function TutorialOverlay({
  steps,
  label = 'Tour guidé',
  onDone,
}: {
  steps: TutorialStep[];
  label?: string;
  onDone: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [confettiOn, setConfettiOn] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const finish = () => {
    if (step?.confetti) {
      setConfettiOn(true);
      window.setTimeout(() => onDone(), 700);
    } else {
      onDone();
    }
  };

  const goNext = () => {
    if (isLast) return finish();
    setStepIdx((s) => s + 1);
  };

  useEffect(() => {
    if (!step) return;
    if (step.targetId === null) {
      setRect(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(
      `[data-tutorial-id="${step.targetId}"]`,
    );
    if (!target) {
      const t = window.setTimeout(() => goNext(), 250);
      return () => window.clearTimeout(t);
    }
    const update = () => setRect(target.getBoundingClientRect());
    update();
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    ro.observe(target);
    observerRef.current = ro;
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, steps]);

  if (!step) return null;
  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  if (!portalRoot) return null;

  const hole = rect
    ? {
        x: rect.left - HOLE_PADDING,
        y: rect.top - HOLE_PADDING,
        w: rect.width + HOLE_PADDING * 2,
        h: rect.height + HOLE_PADDING * 2,
      }
    : null;

  const tooltipPos = computeTooltipPosition(rect, step.prefer);

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIdx}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90]"
        aria-live="polite"
      >
        {hole ? (
          <svg
            className="absolute inset-0 h-full w-full"
            style={{ pointerEvents: 'auto' }}
            aria-hidden="true"
          >
            <defs>
              <mask id="tutorial-hole">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={hole.x}
                  y={hole.y}
                  width={hole.w}
                  height={hole.h}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.78)"
              mask="url(#tutorial-hole)"
            />
            <rect
              x={hole.x}
              y={hole.y}
              width={hole.w}
              height={hole.h}
              rx="12"
              fill="none"
              stroke="rgb(var(--gold-bright))"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(0 0 12px rgb(var(--gold-glow) / 0.6))',
              }}
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/78" />
        )}

        <motion.div
          key={`tip-${stepIdx}`}
          initial={{ opacity: 0, y: tooltipPos.placement === 'top' ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="absolute z-10 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-gold bg-gradient-to-b from-surface to-bg p-4 shadow-gold-strong"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
          role="dialog"
          aria-label={`${label} — étape ${stepIdx + 1}/${steps.length}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="eyebrow flex items-center gap-1.5">
              <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[10px] text-gold-bright">
                {stepIdx + 1}/{steps.length}
              </span>
              <span>{label}</span>
            </div>
            <button
              type="button"
              onClick={finish}
              aria-label="Passer le tutoriel"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-text"
            >
              <X size={14} />
            </button>
          </div>
          <h3 className="display mt-2 text-display-sm">{step.title}</h3>
          <p className="mt-2 text-sm text-text-muted">{step.body}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={finish}
              className="text-xs text-text-soft hover:text-text"
            >
              Passer
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright"
            >
              {step.cta ?? (isLast ? 'Terminé' : 'Suivant')}
              {!isLast && <ArrowRight size={14} />}
            </button>
          </div>
        </motion.div>

        {confettiOn && <GoldConfetti />}
      </motion.div>
    </AnimatePresence>,
    portalRoot,
  );
}

function GoldConfetti() {
  const particles = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {particles.map((i) => {
        const angle = (i / 24) * Math.PI * 2;
        const distance = 120 + Math.random() * 200;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance + 100;
        const rotate = (Math.random() - 0.5) * 360;
        const delay = Math.random() * 0.1;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{ x: dx, y: dy, opacity: 0, rotate, scale: 1 }}
            transition={{ duration: 0.7, delay, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-sm bg-gold-bright"
            style={{ boxShadow: '0 0 8px rgb(var(--gold-glow) / 0.7)' }}
          />
        );
      })}
    </div>
  );
}

function computeTooltipPosition(
  rect: DOMRect | null,
  prefer: 'top' | 'bottom' = 'bottom',
): { x: number; y: number; placement: 'top' | 'bottom' } {
  const TIP_W = 360;
  const TIP_H = 200;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;
  if (!rect) {
    return {
      x: Math.max(16, (viewportW - TIP_W) / 2),
      y: Math.max(80, (viewportH - TIP_H) / 2),
      placement: 'bottom',
    };
  }
  const spaceTop = rect.top;
  const spaceBottom = viewportH - rect.bottom;
  const placement: 'top' | 'bottom' =
    prefer === 'top' && spaceTop >= TIP_H + TOOLTIP_GAP
      ? 'top'
      : spaceBottom >= TIP_H + TOOLTIP_GAP
        ? 'bottom'
        : spaceTop >= TIP_H + TOOLTIP_GAP
          ? 'top'
          : 'bottom';
  const y =
    placement === 'top'
      ? Math.max(16, rect.top - TIP_H - TOOLTIP_GAP)
      : Math.min(viewportH - TIP_H - 16, rect.bottom + TOOLTIP_GAP);
  const idealX = rect.left + rect.width / 2 - TIP_W / 2;
  const x = Math.max(16, Math.min(viewportW - TIP_W - 16, idealX));
  return { x, y, placement };
}
