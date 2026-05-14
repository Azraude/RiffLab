import { Link } from 'react-router-dom';
import { Hero3DLazy } from '@/components/three/Hero3DLazy';

export function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Décor 3D / fallback CSS — décoratif, pointer-events-none */}
      <Hero3DLazy />

      <div className="relative z-10 max-w-2xl">
        <div className="eyebrow mb-6">Le carnet du guitariste</div>
        <h1 className="display text-display-lg md:text-display-xl mb-6">
          Pratique. <span className="text-gold text-gold-glow">Compose.</span> Joue.
        </h1>
        <p className="mx-auto mb-10 max-w-lg text-base text-text-muted md:text-lg">
          Garde tous tes sons, tes accords, tes gammes en un seul endroit. Et reçois chaque jour
          un programme d'entraînement adapté à ce que tu joues.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 text-[15px] font-semibold text-bg transition-all duration-200 ease-out-quart hover:-translate-y-px hover:bg-gold-bright hover:shadow-gold"
          >
            Commencer
          </Link>
          <Link
            to="/riff-of-the-week"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border-gold px-6 text-[15px] text-text transition-all hover:border-gold-soft hover:bg-gold/5"
          >
            Riff de la semaine
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 z-10 text-xs text-text-soft">RiffLab — v0.4</div>
    </div>
  );
}
