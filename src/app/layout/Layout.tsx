import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
// AnimatePresence + motion retirés — voir note dans le JSX (Hotfix écran noir).
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { KeyboardShortcutsProvider } from '@/hooks/useKeyboardShortcuts';
import { KonamiProvider } from '@/hooks/useKonamiCode';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { ToastViewport, useToast } from '@/hooks/useToast';
import { StickyPlayer } from '@/components/audio/StickyPlayer';
import { NotificationBell } from '@/components/social/NotificationBell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect } from 'react';

/** Écoute l'event 'rifflab-badge-unlocked' émis par socialStreakStore +
 *  affiche un toast pour chaque badge. Découplage : le store n'a pas
 *  accès à useToast (hors composant). */
function BadgeUnlockListener() {
  const toast = useToast();
  useEffect(() => {
    const onUnlock = (e: Event) => {
      const detail = (e as CustomEvent<{ labels: string[] }>).detail;
      if (!detail?.labels) return;
      detail.labels.forEach((label) => {
        toast.success(`Badge débloqué : ${label}`, { duration: 6000 });
      });
    };
    window.addEventListener('rifflab-badge-unlocked', onUnlock);
    return () => window.removeEventListener('rifflab-badge-unlocked', onUnlock);
  }, [toast]);
  return null;
}

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
    <KonamiProvider>
    <div className="min-h-screen bg-bg">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
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
        <main
          id="main-content"
          tabIndex={-1}
          className="relative min-w-0 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0"
        >
          <div className="mx-auto min-w-0 max-w-[1400px] px-5 py-7 md:px-12 md:py-9">
            {/* NOTE : l'AnimatePresence mode="wait" + motion.div avec
                initial:{opacity:0,y:8} a été RETIRÉ. Symptôme : sur certaines
                navigations (notamment click sur une card riff → RiffDetail),
                le motion.div restait bloqué à opacity:0 → écran noir alors que
                le DOM était bien rendu. Cause probable : Strict Mode double
                mount + mode="wait" qui attend un exit qui n'arrive jamais.
                Trade-off accepté : plus d'animation de transition entre pages,
                mais plus jamais d'écran noir bloquant. */}
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <MobileNav />
      <FeedbackButton />
      <ToastViewport />
      <BadgeUnlockListener />
      <StickyPlayer />
      {/* Scroll-to-top à la navigation + restauration de la position au
          retour (back/forward). Comportement « app » attendu sur mobile. */}
      <ScrollRestoration />
      {/* NotificationBell floating top-right (cohabite avec FeedbackButton bottom-right).
          Le composant se rend self-null si pas auth + Supabase configuré. */}
      <div
        className="fixed right-4 top-4 z-30 md:right-6 md:top-6"
        style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <NotificationBell />
      </div>
    </div>
    </KonamiProvider>
    </KeyboardShortcutsProvider>
  );
}
