import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { FloatingGuitar3DLazy } from '@/components/three/FloatingGuitar3DLazy';
import {
  CalendarDays,
  Flame,
  Music2,
  Target,
  Sparkles,
  Zap,
  X,
  Lock,
} from 'lucide-react';

/**
 * /plan — Mockup statique de plan 4 semaines.
 *
 * La génération personnalisée est mise en pause (modal "Bientôt
 * disponible — Phase 5"). La page existe pour montrer la forme et
 * laisser le user se projeter. Le moteur (src/lib/practicePlan.ts) et
 * le state Zustand `practicePlan` restent en place — on les rebranchera
 * quand la feature sera prête.
 */
export function PracticePlan() {
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Mon plan"
        subtitle="Un plan d'entraînement de 4 semaines, calibré sur ton objectif."
      />

      {/* Hero 3D : Fender Rose comme signature "ton parcours d'apprentissage" */}
      <div className="relative mb-8 h-[280px] overflow-hidden rounded-3xl border border-border-gold bg-gradient-to-b from-bg via-surface to-bg md:h-[340px]">
        <FloatingGuitar3DLazy
          model="rose"
          rotationSpeed={0.0025}
          cameraDistance={4.2}
          cameraY={0.15}
          intensity="normal"
        />
        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-end px-6 pb-8 text-center">
          <div className="eyebrow !text-gold-soft">Ton parcours</div>
          <h2 className="display mt-2 text-display-sm md:text-display-md">
            4 semaines pour <span className="text-gold text-gold-glow">progresser</span>
          </h2>
        </div>
      </div>

      {/* Hero : mockup des 4 semaines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MOCK_WEEKS.map((w, idx) => (
          <WeekCard key={w.label} week={w} isLast={idx === MOCK_WEEKS.length - 1} />
        ))}
      </div>

      {/* CTA Génère mon plan */}
      <div className="mt-8 rounded-2xl border border-border-gold bg-surface p-6 text-center md:p-8">
        <Target size={26} className="mx-auto mb-3 text-gold" />
        <h2 className="display text-display-sm md:text-display-md">
          Génère ton plan personnalisé
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted md:text-base">
          Trois questions : ton objectif, ta durée par jour, ta fréquence par
          semaine. On te bâtit un plan calibré tiré de toutes les bibliothèques
          de l'app (accords, gammes, rythmiques, ear training).
        </p>
        <button
          type="button"
          onClick={() => setComingSoonOpen(true)}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 font-semibold text-bg shadow-gold transition-all hover:-translate-y-px hover:bg-gold-bright"
        >
          <Sparkles size={16} />
          Génère mon plan personnalisé
        </button>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-soft">
          <Lock size={11} /> Disponible bientôt
        </p>
      </div>

      {/* Coming-soon modal */}
      <Dialog.Root open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <AnimatePresence>
          {comingSoonOpen && (
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
                <motion.div
                  className="fixed left-1/2 top-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border-gold bg-surface p-7 shadow-2xl"
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 12 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                >
                  <button
                    type="button"
                    onClick={() => setComingSoonOpen(false)}
                    aria-label="Fermer"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
                    <Sparkles size={22} />
                  </div>
                  <Dialog.Title className="display mt-4 text-display-sm">
                    Bientôt disponible — Phase 5
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-text-muted">
                    La génération automatique de plan personnalisé arrive en
                    Phase 5, avec l'AI assistant. En attendant, le mockup ci-dessus
                    donne la forme du livrable final.
                  </p>
                  <button
                    type="button"
                    onClick={() => setComingSoonOpen(false)}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gold font-semibold text-bg hover:bg-gold-bright"
                  >
                    OK, compris
                  </button>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}

// ─── Mockup data ──────────────────────────────────────────────────────

type MockActivity = { title: string; minutes: number };
type MockWeek = {
  label: string;
  theme: string;
  icon: React.ReactNode;
  pitch: string;
  activities: MockActivity[];
};

const MOCK_WEEKS: MockWeek[] = [
  {
    label: 'Semaine 1',
    theme: 'Warm-up & fondamentaux',
    icon: <Flame size={20} strokeWidth={1.5} />,
    pitch: 'Remettre les bases en place — accords ouverts, transitions, métronome lent.',
    activities: [
      { title: 'Accordage + chromatique 1-2-3-4', minutes: 5 },
      { title: 'Transitions Em ↔ G ↔ C ↔ D', minutes: 6 },
      { title: 'Pattern basique tout-en-bas', minutes: 4 },
    ],
  },
  {
    label: 'Semaine 2',
    theme: 'Gammes & oreille',
    icon: <Music2 size={20} strokeWidth={1.5} />,
    pitch: 'Penta mineure, gamme majeure, intervalles au son. Ouvrir le manche.',
    activities: [
      { title: 'Penta mineure Em, position 1', minutes: 5 },
      { title: 'Intervalles débutant (10 questions)', minutes: 5 },
      { title: 'Improvisation libre sur Em / G / C / D', minutes: 5 },
    ],
  },
  {
    label: 'Semaine 3',
    theme: 'Vitesse & technique',
    icon: <Zap size={20} strokeWidth={1.5} />,
    pitch: 'Speed trainer sur tes phrases difficiles. Monter de 60 → 90 %.',
    activities: [
      { title: 'Speed trainer sur une section', minutes: 8 },
      { title: 'Métronome : monter 10 BPM par bloc', minutes: 5 },
      { title: 'Voicings maj7 / m7', minutes: 4 },
    ],
  },
  {
    label: 'Semaine 4',
    theme: 'Live & setlist',
    icon: <Sparkles size={20} strokeWidth={1.5} />,
    pitch: 'Run de setlist enchaîné, recorder un essai, debrief.',
    activities: [
      { title: 'Run de la setlist (mode lecture)', minutes: 12 },
      { title: 'Enregistrer un essai', minutes: 6 },
      { title: 'Progressions au son', minutes: 5 },
    ],
  },
];

// ─── Week card ────────────────────────────────────────────────────────

function WeekCard({ week, isLast }: { week: MockWeek; isLast: boolean }) {
  return (
    <div className="relative rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-gold-soft">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
        {week.icon}
      </div>
      <div className="eyebrow !text-gold-soft">{week.label}</div>
      <h3 className="display mt-1 text-display-sm">{week.theme}</h3>
      <p className="mt-2 text-xs text-text-muted">{week.pitch}</p>
      <div className="mt-4 grid gap-1.5">
        {week.activities.map((a) => (
          <div
            key={a.title}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2"
          >
            <span className="truncate text-xs text-text">{a.title}</span>
            <span className="shrink-0 font-mono text-[10px] text-text-soft">{a.minutes}min</span>
          </div>
        ))}
      </div>
      {!isLast && (
        <div className="hidden lg:block">
          <CalendarDays
            size={14}
            className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-text-soft lg:block"
          />
        </div>
      )}
    </div>
  );
}
