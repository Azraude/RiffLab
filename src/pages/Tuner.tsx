import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Mic } from 'lucide-react';

/**
 * Stub Tuner — l'implémentation complète arrive en Phase 2D :
 * pitchDetect YIN + usePitchDetector + UI aiguille cents.
 */
export function Tuner() {
  return (
    <>
      <PageHeader
        title="Tuner"
        subtitle="Accordage au micro avec détection de pitch précise. Bientôt."
      />
      <Card className="mx-auto max-w-xl text-center py-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
          <Mic size={28} strokeWidth={1.5} />
        </div>
        <h2 className="display text-display-sm">Phase 2D — en construction</h2>
        <p className="mt-2 text-sm text-text-muted">
          Le tuner utilisera l'algo YIN sur le micro pour détecter la fréquence,
          afficher la note + l'écart en cents, et indiquer quelle corde tu joues
          selon ton accordage actif.
        </p>
      </Card>
    </>
  );
}
