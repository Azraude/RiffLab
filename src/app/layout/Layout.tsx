import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function Layout() {
  return (
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
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
