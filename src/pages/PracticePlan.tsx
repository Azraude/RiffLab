import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { FloatingGuitar3DLazy } from '@/components/three/FloatingGuitar3DLazy';
import {
  PATH_LEVELS,
  listCompletedNodes,
  markNodeCompleted,
  unmarkNodeCompleted,
  resetProgress,
  computeNodeStates,
  type PathLevel,
  type NodeState,
} from '@/lib/practicePath';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Lock,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import clsx from 'clsx';

/**
 * /plan — Practice Plan en path Duolingo-style.
 *
 * Layout : 10 nodes en zigzag vertical, connectés par des courbes SVG.
 * Chaque node a 4 états (locked / available / current / completed) avec
 * styling distinct. Click sur node available/current/completed → drawer
 * avec détails + bouton marquer complété/réinitialiser.
 *
 * Progression stockée dans Dexie table `practiceProgress` (v4 migration).
 */
export function PracticePlan() {
  const completedRows = useLiveQuery(() => listCompletedNodes(), []);
  const completedIds = useMemo(
    () => new Set((completedRows ?? []).map((n) => n.id)),
    [completedRows]
  );
  const states = useMemo(() => computeNodeStates(completedIds), [completedIds]);
  const [openLevel, setOpenLevel] = useState<PathLevel | null>(null);

  const progress = completedIds.size;
  const total = PATH_LEVELS.length;
  const percent = Math.round((progress / total) * 100);

  const handleResetAll = async () => {
    if (!confirm('Réinitialiser toute la progression ? Tu repartiras à zéro.')) return;
    await resetProgress();
  };

  return (
    <>
      <PageHeader
        title="Mon plan"
        subtitle="Ton parcours d'apprentissage — débloque les niveaux un par un."
      >
        <button
          type="button"
          onClick={handleResetAll}
          aria-label="Recommencer"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm text-text-muted hover:text-text"
        >
          <RotateCcw size={14} /> Recommencer
        </button>
      </PageHeader>

      {/* Hero 3D : Fender Rose, signifie "ton parcours" — agrandi (320px
          mobile / 380px desktop) avec caméra reculée pour bien voir la
          guitare. */}
      <div className="relative mb-6 h-[320px] overflow-hidden rounded-3xl border border-border-gold bg-gradient-to-b from-bg via-surface to-bg md:h-[380px]">
        <FloatingGuitar3DLazy
          model="rose"
          rotationSpeed={0.003}
          cameraDistance={6}
          cameraY={0.2}
          intensity="normal"
        />
        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-end px-6 pb-7 text-center">
          <div className="eyebrow !text-gold-soft">Niveau {Math.min(progress + 1, total)} / {total}</div>
          <h2 className="display mt-1 text-display-md md:text-display-lg">
            {percent}% du parcours
          </h2>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-gradient-to-r from-gold-soft to-gold-bright transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Zigzag path */}
      <div className="mx-auto max-w-md px-4 py-6">
        <PathDisplay states={states} onLevelClick={setOpenLevel} />
      </div>

      {/* Level drawer */}
      <LevelDrawer
        level={openLevel}
        state={openLevel ? states[openLevel.id] : 'locked'}
        onClose={() => setOpenLevel(null)}
        onMarkCompleted={async (id) => {
          await markNodeCompleted(id);
          setOpenLevel(null);
        }}
        onUnmark={async (id) => {
          await unmarkNodeCompleted(id);
          setOpenLevel(null);
        }}
      />
    </>
  );
}

// ─── Path display (zigzag SVG + nodes) ────────────────────────────────

const NODE_DIAMETER = 88;
const VERTICAL_SPACING = 130;
const HORIZONTAL_OFFSET = 70; // décalage gauche/droite depuis le centre

function PathDisplay({
  states,
  onLevelClick,
}: {
  states: Record<string, NodeState>;
  onLevelClick: (l: PathLevel) => void;
}) {
  // Position chaque node (x signé, y croissant)
  const positions = PATH_LEVELS.map((level, i) => ({
    level,
    x: i % 2 === 0 ? -HORIZONTAL_OFFSET : HORIZONTAL_OFFSET,
    y: i * VERTICAL_SPACING,
  }));
  const totalHeight = (PATH_LEVELS.length - 1) * VERTICAL_SPACING + NODE_DIAMETER;
  const svgWidth = HORIZONTAL_OFFSET * 2 + NODE_DIAMETER + 20;
  // Build the curve path
  const curve = positions
    .map((p, i) => {
      const cx = svgWidth / 2 + p.x;
      const cy = p.y + NODE_DIAMETER / 2;
      if (i === 0) return `M ${cx} ${cy}`;
      const prev = positions[i - 1];
      const pcx = svgWidth / 2 + prev.x;
      const pcy = prev.y + NODE_DIAMETER / 2;
      // Control points : courbe bezier qui passe entre les deux nodes
      const midY = (cy + pcy) / 2;
      return `C ${pcx} ${midY} ${cx} ${midY} ${cx} ${cy}`;
    })
    .join(' ');

  return (
    <div className="relative mx-auto" style={{ width: svgWidth, height: totalHeight }}>
      {/* Background curve */}
      <svg
        className="absolute inset-0"
        width={svgWidth}
        height={totalHeight}
        viewBox={`0 0 ${svgWidth} ${totalHeight}`}
        fill="none"
        aria-hidden
      >
        <path
          d={curve}
          stroke="rgb(var(--gold) / 0.4)"
          strokeWidth="3"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />
      </svg>

      {/* Nodes */}
      {positions.map((p) => {
        const state = states[p.level.id] ?? 'locked';
        return (
          <PathNode
            key={p.level.id}
            level={p.level}
            state={state}
            style={{
              position: 'absolute',
              left: svgWidth / 2 + p.x - NODE_DIAMETER / 2,
              top: p.y,
              width: NODE_DIAMETER,
              height: NODE_DIAMETER,
            }}
            onClick={() => onLevelClick(p.level)}
          />
        );
      })}
    </div>
  );
}

// ─── Node ─────────────────────────────────────────────────────────────

function PathNode({
  level,
  state,
  style,
  onClick,
}: {
  level: PathLevel;
  state: NodeState;
  style: React.CSSProperties;
  onClick: () => void;
}) {
  const isLocked = state === 'locked';
  const isCurrent = state === 'current';
  const isCompleted = state === 'completed';

  return (
    <div style={style}>
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isLocked}
        aria-label={`Niveau ${level.order} : ${level.title}`}
        whileTap={!isLocked ? { scale: 0.94 } : undefined}
        animate={
          isCurrent
            ? {
                boxShadow: [
                  '0 0 0 rgb(var(--gold-glow) / 0)',
                  '0 0 24px rgb(var(--gold-glow) / 0.6)',
                  '0 0 0 rgb(var(--gold-glow) / 0)',
                ],
              }
            : {}
        }
        transition={
          isCurrent ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}
        }
        className={clsx(
          'flex h-full w-full flex-col items-center justify-center rounded-full border-2 text-center transition-all',
          isLocked && 'border-border bg-surface-2 text-text-soft cursor-not-allowed',
          isCurrent && 'border-gold bg-gold/15 text-gold scale-110',
          state === 'available' &&
            'border-gold-soft bg-surface-2 text-gold hover:scale-105',
          isCompleted &&
            'border-success bg-success/15 text-success hover:scale-105'
        )}
      >
        {isLocked && <Lock size={22} strokeWidth={2} />}
        {isCurrent && (
          <>
            <Sparkles size={20} strokeWidth={2} />
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">
              En cours
            </span>
          </>
        )}
        {state === 'available' && (
          <>
            <ArrowRight size={20} strokeWidth={2} />
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">
              Démarrer
            </span>
          </>
        )}
        {isCompleted && <Check size={24} strokeWidth={3} />}
      </motion.button>
      {/* Label sous le node */}
      <div
        className={clsx(
          'mt-2 text-center text-xs font-semibold',
          isLocked ? 'text-text-soft' : 'text-text'
        )}
      >
        {level.order}. {level.title}
      </div>
    </div>
  );
}

// ─── Level drawer ─────────────────────────────────────────────────────

function LevelDrawer({
  level,
  state,
  onClose,
  onMarkCompleted,
  onUnmark,
}: {
  level: PathLevel | null;
  state: NodeState;
  onClose: () => void;
  onMarkCompleted: (id: string) => void;
  onUnmark: (id: string) => void;
}) {
  // Détection mobile pour switcher entre bottom-sheet (mobile) et modal
  // centré (desktop). Sans ce split, framer-motion `y` rentre en conflit
  // avec Tailwind `-translate-y-1/2` → le modal apparaît mal positionné
  // sur desktop (bug user feedback session 16).
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <Dialog.Root open={level !== null} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {level && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              {/* Container : flex centered desktop (évite le conflit
                  translate Tailwind + framer-motion y), positionnement
                  bottom mobile. Inner motion.div ne fait que opacity +
                  small y/scale offsets. */}
              <div
                className={
                  isMobile
                    ? 'fixed inset-x-0 bottom-0 z-50 flex justify-center'
                    : 'fixed inset-0 z-50 flex items-center justify-center p-6'
                }
              >
                <motion.div
                  className={clsx(
                    'overflow-y-auto bg-surface shadow-2xl',
                    isMobile
                      ? 'w-full max-h-[85vh] rounded-t-3xl border-t border-border'
                      : 'w-[min(440px,92vw)] max-h-[88vh] rounded-3xl border border-border'
                  )}
                  style={
                    isMobile
                      ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }
                      : undefined
                  }
                  initial={
                    isMobile
                      ? { y: '100%', opacity: 0 }
                      : { opacity: 0, scale: 0.94, y: 12 }
                  }
                  animate={
                    isMobile
                      ? { y: 0, opacity: 1 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  exit={
                    isMobile
                      ? { y: '100%', opacity: 0 }
                      : { opacity: 0, scale: 0.94, y: 12 }
                  }
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  drag={isMobile ? 'y' : false}
                  dragConstraints={{ top: 0 }}
                  dragElastic={{ top: 0, bottom: 0.5 }}
                  onDragEnd={(_, info) => {
                    if (!isMobile) return;
                    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
                  }}
                >
                  {isMobile && (
                    <div className="flex justify-center pb-2 pt-3">
                      <span className="h-1.5 w-12 rounded-full bg-text-soft/40" />
                    </div>
                  )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                >
                  <X size={16} />
                </button>

                <div className="px-6 pt-3 md:pt-6">
                  <div className="eyebrow !text-gold-soft">Niveau {level.order} / 10</div>
                  <Dialog.Title className="display mt-1 text-display-sm">
                    {level.title}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-text-muted">{level.pitch}</p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-text-soft">
                    <span>⏱ Estimé {level.estimatedMinutes} min</span>
                    {state === 'locked' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-text-soft/15 px-2 py-0.5">
                        <Lock size={10} /> Verrouillé
                      </span>
                    )}
                    {state === 'current' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-gold">
                        <Sparkles size={10} /> En cours
                      </span>
                    )}
                    {state === 'completed' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-success">
                        <Check size={10} strokeWidth={3} /> Validé
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="label-small mb-2">Objectifs</div>
                    <ul className="grid gap-2">
                      {level.objectives.map((obj) => (
                        <li
                          key={obj}
                          className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2"
                        >
                          <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-gold-soft" />
                          <span className="text-sm">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {level.exercises.length > 0 && (
                    <div className="mt-5">
                      <div className="label-small mb-2">Exercices recommandés</div>
                      <div className="grid gap-2">
                        {level.exercises.map((ex) => (
                          <Link
                            key={ex.route}
                            to={ex.route}
                            onClick={onClose}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm transition-colors hover:border-gold-soft hover:bg-gold/5"
                          >
                            <span>{ex.label}</span>
                            <ChevronRight size={14} className="text-text-soft" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {state !== 'locked' && (
                    <div className="mt-6">
                      {state === 'completed' ? (
                        <button
                          type="button"
                          onClick={() => onUnmark(level.id)}
                          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm text-text-muted hover:text-text"
                        >
                          Marquer comme non terminé
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkCompleted(level.id)}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold font-semibold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px"
                        >
                          <Check size={18} strokeWidth={3} />
                          J'ai terminé ce niveau
                        </button>
                      )}
                    </div>
                  )}
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
