import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X, Flame } from 'lucide-react';
import clsx from 'clsx';
import { usePrefs } from '@/stores/prefsStore';

const SLIDES = [
  {
    id: 'welcome',
    eyebrow: 'Bienvenue 🎸',
    title: 'Salut. Tu joues de la\nguitare, on a fait ça\npour toi.',
    body: 'Pas de pub. Pas de paywall agressif. Pas de bullshit.',
    cta: 'Découvrir',
    illustration: <WelcomeIllustration />,
  },
  {
    id: 'practice',
    eyebrow: '🎯 Pratique quotidienne',
    title: 'Un accord et une gamme\npar jour. C\'est tout.',
    body: 'On track ta progression sans te harceler de notifs.',
    cta: 'Suivant',
    illustration: <PracticeIllustration />,
  },
  {
    id: 'studio',
    eyebrow: '🎼 Studio de composition',
    title: 'Trouve ta prochaine\nprogression en 30\nsecondes.',
    body: 'Lock ceux que tu aimes, l\'algo te propose la suite.',
    cta: 'Suivant',
    illustration: <StudioIllustration />,
  },
  {
    id: 'community',
    eyebrow: '🔥 Feed communautaire',
    title: 'Partage tes riffs.\nJoue ceux des autres.',
    body: 'Comme TikTok mais pour guitaristes (et sans le contenu débile).',
    cta: 'Suivant',
    illustration: <CommunityIllustration />,
  },
  {
    id: 'start',
    eyebrow: null,
    title: 'C\'est parti.',
    body: null,
    cta: 'Commencer ma première session',
    illustration: <StartIllustration />,
  },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 80, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: -dir * 80, opacity: 0, scale: 0.98 }),
};

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const setOnboardingCompleted = usePrefs((s) => s.setOnboardingCompleted);

  const finish = () => {
    setOnboardingCompleted(true);
    onDone();
  };

  const goNext = () => {
    if (step < SLIDES.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center bg-bg/90 backdrop-blur-md">
      {/* Ambient halo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgb(var(--gold-glow) / 0.10) 0%, transparent 60%)',
        }}
      />

      {/* Skip — top-right */}
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 z-10 inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface/60 px-3 text-xs text-text-muted backdrop-blur-sm hover:text-text"
      >
        <X size={12} /> Skip
      </button>

      {/* Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-[1] w-full overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl lg:mb-0 lg:max-w-xl lg:rounded-3xl"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60 && step < SLIDES.length - 1) {
            setDirection(1);
            setStep((s) => s + 1);
          } else if (info.offset.x > 60 && step > 0) {
            setDirection(-1);
            setStep((s) => s - 1);
          }
        }}
      >
        {/* Illustration zone */}
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-b from-bg to-surface lg:h-52">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step + '-ill'}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {slide.illustration}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pt-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDirection(i > step ? 1 : -1);
                setStep(i);
              }}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-6 bg-gold' : 'w-1.5 bg-border hover:bg-border-gold'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-5 lg:px-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step + '-content'}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            >
              {slide.eyebrow && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  className="eyebrow"
                >
                  {slide.eyebrow}
                </motion.div>
              )}

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                className="display mt-2 whitespace-pre-line text-display-sm leading-tight md:text-display-md"
              >
                {slide.title}
              </motion.h2>

              {slide.body && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  className="mt-3 text-sm text-text-muted md:text-base"
                >
                  {slide.body}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="mt-6 flex flex-col gap-3"
              >
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-[15px] font-semibold text-bg shadow-gold-strong transition-transform hover:-translate-y-px active:scale-[0.98]"
                  style={{ height: 52 }}
                >
                  {slide.cta}
                  {!isLast && <ArrowRight size={16} />}
                </button>

                {isLast && (
                  <button
                    type="button"
                    onClick={finish}
                    className="text-center text-xs text-text-soft hover:text-text-muted"
                  >
                    Skip pour les pros
                  </button>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Illustrations ─────────────────────────────────────────────────────

function WelcomeIllustration() {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-7xl select-none"
        style={{ filter: 'drop-shadow(0 4px 16px rgb(var(--gold-glow) / 0.5))' }}
      >
        🎸
      </motion.div>
      <div className="flex gap-1">
        {['R', 'i', 'f', 'f', 'L', 'a', 'b'].map((c, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="font-serif font-semibold text-gold text-display-sm"
          >
            {c}
          </motion.span>
        ))}
      </div>
      <motion.div
        animate={{
          boxShadow: [
            '0 0 0 0 rgb(var(--gold-glow) / 0)',
            '0 0 24px 6px rgb(var(--gold-glow) / 0.35)',
            '0 0 0 0 rgb(var(--gold-glow) / 0)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="h-0.5 w-24 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent"
      />
    </div>
  );
}

function PracticeIllustration() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mini streak card */}
      <div className="rounded-2xl border border-gold/40 bg-bg px-6 py-4 text-center shadow-gold-strong">
        <div className="label-small">Série en cours</div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="display text-[36px] leading-none text-gold-bright">7</span>
          <motion.span
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flame size={22} className="text-gold-bright" fill="currentColor" />
          </motion.span>
        </div>
        <div className="mt-2 flex gap-1.5 justify-center">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div
              key={i}
              className={clsx(
                'h-5 w-5 rounded-full text-[9px] flex items-center justify-center font-semibold',
                i < 6
                  ? 'bg-gradient-to-b from-gold-bright to-gold text-bg'
                  : 'border border-gold-soft/40 text-text-soft'
              )}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudioIllustration() {
  const chords = ['Am', 'F', 'C', 'G'];
  return (
    <div className="flex items-center gap-2">
      {chords.map((c, i) => (
        <motion.div
          key={c}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className={clsx(
            'relative flex h-12 w-12 items-center justify-center rounded-xl font-mono text-sm font-semibold transition-all lg:h-14 lg:w-14',
            i === 1
              ? 'border-2 border-gold bg-gold/10 text-gold-bright shadow-[0_0_12px_rgb(var(--gold-glow)/0.4)]'
              : 'border border-border bg-surface text-text'
          )}
        >
          {c}
          {i === 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8px] text-bg"
            >
              🔒
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function CommunityIllustration() {
  return (
    <div className="w-64 space-y-2">
      {[
        { title: 'Hotel California intro', likes: 142, user: 'guitarvibe' },
        { title: 'Stairway to Heaven riff', likes: 98, user: 'riffmaster' },
      ].map((riff, i) => (
        <motion.div
          key={riff.title}
          initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-base">
            🎵
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-text">{riff.title}</div>
            <div className="text-[10px] text-text-soft">@{riff.user} · 🔥 {riff.likes}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StartIllustration() {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
        className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gold/10"
        style={{ boxShadow: '0 0 32px rgb(var(--gold-glow) / 0.4)' }}
      >
        <span className="text-4xl">🚀</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex gap-2"
      >
        {['electric-clean', 'acoustic-warm', 'jazz'].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: [16, 28 + i * 8, 16],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              delay: 0.6 + i * 0.15,
              repeat: Infinity,
              repeatDelay: 0.4,
              ease: 'easeInOut',
            }}
            className="w-2 rounded-full bg-gold"
            style={{ height: 16 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
