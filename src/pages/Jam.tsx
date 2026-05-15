import { PageHeader } from '@/components/ui/PageHeader';
import { FloatingGuitar3DLazy } from '@/components/three/FloatingGuitar3DLazy';
import { Disc3, Sparkles } from 'lucide-react';

/**
 * /jam — Page placeholder du Mode Jam. La feature (génération auto de
 * progressions avec drums + bass) arrive plus tard. En attendant, on
 * met en valeur la promesse via la Fender Classic en hero central.
 */
export function Jam() {
  return (
    <>
      <PageHeader
        title="Mode jam"
        subtitle="Bientôt — choisis une tonalité et une gamme, RiffLab génère une progression avec drums + bass pour improviser dessus."
      />

      {/* Hero 3D central */}
      <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-3xl border border-border-gold bg-gradient-to-b from-bg via-surface to-bg">
        <FloatingGuitar3DLazy
          model="classic"
          rotationSpeed={0.003}
          cameraDistance={5}
          cameraY={0.3}
          intensity="normal"
        />

        {/* Overlay textuel par-dessus la 3D */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
            <Disc3 size={22} strokeWidth={1.5} />
          </div>
          <h2 className="display mt-4 text-display-md md:text-display-lg">
            <span className="text-gold text-gold-glow">Jamme</span> sans limite
          </h2>
          <p className="mt-2 max-w-md text-sm text-text-muted md:text-base">
            Backing track généré par RiffLab, tonalité au choix, vitesse
            modulable. Ferme les yeux et joue.
          </p>
        </div>
      </div>

      {/* Note "bientôt" */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border-gold bg-gold/5 px-4 py-2 text-sm text-text-muted">
        <Sparkles size={14} className="text-gold" />
        En cours de développement
      </div>
    </>
  );
}
