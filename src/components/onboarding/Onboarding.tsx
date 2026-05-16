import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
import { usePrefs, type PlayerLevel } from '@/stores/prefsStore';
import { SKIN_LIST, type FretboardSkinId } from '@/lib/fretboardSkins';

/**
 * Onboarding flow — 4 écrans pour les nouveaux users. Affichés au premier
 * passage sur /dashboard, stocké via prefs.onboardingCompleted.
 *
 * Skip button visible dès le 1er écran. Le résultat des choix
 * (level + fretboardSkin) est persisté dans prefsStore.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const setLevel = usePrefs((s) => s.setLevel);
  const setFretboardSkin = usePrefs((s) => s.setFretboardSkin);
  const setOnboardingCompleted = usePrefs((s) => s.setOnboardingCompleted);

  const finish = () => {
    setOnboardingCompleted(true);
    onDone();
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/95 backdrop-blur-md">
      {/* Ambient gold halo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgb(var(--gold-glow) / 0.12) 0%, transparent 60%)',
        }}
      />

      {/* Skip button top-right */}
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 z-10 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 text-xs text-text-muted backdrop-blur-md hover:text-text"
      >
        <X size={14} /> Passer
      </button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={clsx(
              'h-1 rounded-full transition-all',
              i === step ? 'w-8 bg-gold' : 'w-1.5 bg-border'
            )}
          />
        ))}
      </div>

      {/* Slides container */}
      <div className="relative z-[1] w-[min(560px,92vw)] px-5">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <Welcome key="0" onNext={next} />
          )}
          {step === 1 && (
            <LevelPick key="1" onPick={(l) => { setLevel(l); next(); }} />
          )}
          {step === 2 && (
            <SkinPick key="2" onPick={(id) => { setFretboardSkin(id); next(); }} />
          )}
          {step === 3 && (
            <Final key="3" onDone={finish} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Écran 1 : Welcome ────────────────────────────────────────────────

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <RiffLabLogo size={88} />
      </motion.div>
      <div className="eyebrow mt-6">Bienvenue dans RiffLab</div>
      <h1 className="display mt-3 text-display-md md:text-display-lg">
        Ton carnet du guitariste moderne
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-text-muted md:text-base">
        Sons, accords, gammes, riffs, plan de pratique — tout au même endroit,
        offline-first sur ton téléphone.
      </p>
      <button
        type="button"
        onClick={onNext}
        className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-[15px] font-semibold text-bg shadow-gold-strong hover:-translate-y-px"
      >
        Commencer
        <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}

// ─── Écran 2 : Level pick ─────────────────────────────────────────────

function LevelPick({ onPick }: { onPick: (l: PlayerLevel) => void }) {
  const levels: Array<{ id: PlayerLevel; label: string; desc: string }> = [
    {
      id: 'beginner',
      label: 'Débutant',
      desc: 'Je commence ou je revoie les bases. Accords ouverts, premiers patterns.',
    },
    {
      id: 'intermediate',
      label: 'Intermédiaire',
      desc: 'Je joue depuis un moment. Barrés, gammes, soloing.',
    },
    {
      id: 'advanced',
      label: 'Avancé',
      desc: 'Théorie, modes, jazz, compo. Je sais ce que je cherche.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col items-center text-center"
    >
      <Sparkles size={28} className="text-gold-bright" />
      <h2 className="display mt-4 text-display-md">Ton niveau ?</h2>
      <p className="mt-2 text-sm text-text-muted">
        Pour personnaliser tes recommandations quotidiennes.
      </p>
      <div className="mt-7 grid w-full gap-3">
        {levels.map((l) => (
          <motion.button
            key={l.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPick(l.id)}
            className="rounded-2xl border border-border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-gold-soft hover:bg-gold/5"
          >
            <div className="display text-display-sm">{l.label}</div>
            <p className="mt-1 text-xs text-text-muted md:text-sm">{l.desc}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Écran 3 : Skin pick ──────────────────────────────────────────────

function SkinPick({ onPick }: { onPick: (id: FretboardSkinId) => void }) {
  const nonPremium = SKIN_LIST.filter((s) => !s.premium);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col items-center text-center"
    >
      <h2 className="display text-display-md">Ton manche</h2>
      <p className="mt-2 text-sm text-text-muted">
        Le look de ton fretboard. Modifiable à tout moment dans Préférences.
      </p>
      <div className="mt-6 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3">
        {nonPremium.map((skin) => (
          <motion.button
            key={skin.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick(skin.id)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-3 text-left transition-all hover:border-gold-soft"
          >
            {/* Mini swatch SVG inline */}
            <svg
              viewBox="0 0 240 60"
              width="100%"
              height="42"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <defs>
                <linearGradient id={`onb-board-${skin.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={skin.board[0]} />
                  <stop offset="55%" stopColor={skin.board[1]} />
                  <stop offset="100%" stopColor={skin.board[2]} />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="240" height="60" rx="3" fill={`url(#onb-board-${skin.id})`} />
              {/* 3 frets */}
              <rect x="60" y="0" width="2" height="60" fill={skin.fret[1]} />
              <rect x="140" y="0" width="2" height="60" fill={skin.fret[1]} />
              <rect x="210" y="0" width="2" height="60" fill={skin.fret[1]} />
              {/* String */}
              <line x1="0" y1="30" x2="240" y2="30" stroke={skin.trebleString[1]} strokeWidth="1" />
            </svg>
            <div className="text-xs font-semibold text-text">{skin.short}</div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Écran 4 : Final ──────────────────────────────────────────────────

function Final({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.1 }}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-gold/10 text-gold-bright"
      >
        <Check size={32} strokeWidth={2.5} />
      </motion.div>
      <h2 className="display mt-5 text-display-md">Prêt à jouer.</h2>
      <p className="mt-3 max-w-md text-sm text-text-muted md:text-base">
        Ton carnet démarre avec 3 morceaux d'exemple — pioche dedans, ajoute
        les tiens, et lance ton premier Practice Plan pour structurer ta
        progression.
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-[15px] font-semibold text-bg shadow-gold-strong hover:-translate-y-px"
      >
        Vas-y
        <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
