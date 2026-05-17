import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { KeyboardShortcutsProvider } from '@/hooks/useKeyboardShortcuts';

/**
 * Layout commun aux routes hors Landing. Wrap les pages dans
 * AnimatePresence + motion.div pour des transitions fade + slide 8px
 * (200ms ease-out-quart). `mode="wait"` pour que le sortant termine
 * avant que l'entrant arrive (évite le double-render visible).
 */
export function Layout() {
  const location = useLocation();

  return (
    <KeyboardShortcutsProvider>
    <div className="min-h-screen bg-bg">
      {/*
        IMPORTANT : grid-cols-[minmax(0,1fr)] explicite en mobile (pas
        seulement md:). Sans ça, en CSS Grid sans template, les items
        prennent leur `min-width: auto` qui = intrinsic content width →
        un chip-bar de 17 items en ligne pousse <main> bien au-delà de
        375px. Conséquence : le navigateur dézoome la page pour faire
        rentrer, les éléments deviennent minuscules, les strokes
        sub-pixel disparaissent (cordes du fretboard invisibles, etc.).
        minmax(0,1fr) force la colonne à pouvoir shrinker à 0.
      */}
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar />
        <main className="relative min-w-0 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mx-auto min-w-0 max-w-[1400px] px-5 py-7 md:px-12 md:py-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
    </KeyboardShortcutsProvider>
  );
}
