/**
 * Tutorial overlay — tour guidé Notion/Linear-style après l'onboarding.
 *
 * Affiché sur Dashboard quand `tutorialCompleted` est false. Spotlight
 * sur des éléments-clés via leur data-tutorial-id, avec tooltip à côté.
 * 5-6 steps, skip visible partout, stocke la complétion dans prefsStore.
 *
 * Approche :
 * - Backdrop noir 75% opacité full-screen
 * - Hole spotlight = box-shadow inset géant qui laisse une zone claire
 *   autour de l'élément cible (via getBoundingClientRect)
 * - Tooltip positionné au-dessus ou en-dessous du target selon l'espace
 * - "Suivant" → step++, "Skip" → close, dernier step = "Terminé"
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { usePrefs } from '@/stores/prefsStore';

type Step = {
  targetId: string;
  title: string;
  body: string;
  /** Position préférée du tooltip si l'espace le permet */
  prefer?: 'top' | 'bottom';
};

const STEPS: Step[] = [
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
];

const HOLE_PADDING = 8;
const TOOLTIP_GAP = 16;

export function Tutorial({ onDone }: { onDone: () => void }) {
  const setTutorialCompleted = usePrefs((s) => s.setTutorialCompleted);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const step = STEPS[stepIdx];

  useEffect(() => {
    if (!step) return;
    const target = document.querySelector<HTMLElement>(
      `[data-tutorial-id="${step.targetId}"]`,
    );
    if (!target) {
      // Cible absente : skip ce step
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
  }, [stepIdx]);

  const isLast = stepIdx === STEPS.length - 1;

  const goNext = () => {
    if (isLast) return finish();
    setStepIdx((s) => s + 1);
  };

  const finish = () => {
    setTutorialCompleted(true);
    onDone();
  };

  if (!step) return null;

  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  if (!portalRoot) return null;

  // Calcul positions
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
        {/* Backdrop avec hole spotlight via SVG mask (plus propre que box-shadow) */}
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
            {/* Outline gold autour du hole */}
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

        {/* Tooltip */}
        <motion.div
          key={`tip-${stepIdx}`}
          initial={{ opacity: 0, y: tooltipPos.placement === 'top' ? 8 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="absolute z-10 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-gold bg-gradient-to-b from-surface to-bg p-4 shadow-gold-strong"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
          }}
          role="dialog"
          aria-label={`Tutoriel — étape ${stepIdx + 1}/${STEPS.length}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="eyebrow flex items-center gap-1.5">
              <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[10px] text-gold-bright">
                {stepIdx + 1}/{STEPS.length}
              </span>
              <span>Tour guidé</span>
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
              {isLast ? 'Terminé' : 'Suivant'}
              {!isLast && <ArrowRight size={14} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    portalRoot,
  );
}

function computeTooltipPosition(
  rect: DOMRect | null,
  prefer: 'top' | 'bottom' = 'bottom',
): { x: number; y: number; placement: 'top' | 'bottom' } {
  const TIP_W = 360;
  const TIP_H = 200; // estimation conservative
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;

  if (!rect) {
    // Centre écran si pas de cible
    return {
      x: Math.max(16, (viewportW - TIP_W) / 2),
      y: Math.max(80, (viewportH - TIP_H) / 2),
      placement: 'bottom',
    };
  }

  // Choisit le côté selon l'espace disponible
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

  // Centre horizontalement sur la cible, clampé aux bords
  const idealX = rect.left + rect.width / 2 - TIP_W / 2;
  const x = Math.max(16, Math.min(viewportW - TIP_W - 16, idealX));

  return { x, y, placement };
}
