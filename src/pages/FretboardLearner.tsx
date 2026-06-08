/**
 * /tools/fretboard-learner — placeholder pour le mini-jeu.
 * Implémentation complète Phase 2 sess 26.
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Target } from 'lucide-react';

export function FretboardLearner() {
  return (
    <>
      <PageHeader
        title="Fretboard Learner"
        subtitle="Apprends ton manche — mini-jeu avec 4 niveaux de difficulté."
      />
      <Card>
        <div className="flex flex-col items-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
            <Target size={28} />
          </div>
          <h3 className="display mt-4 text-display-sm">Bientôt jouable</h3>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            Le mini-jeu d'apprentissage des notes du manche est en cours de
            construction (Phase 2 sess 26).
          </p>
        </div>
      </Card>
    </>
  );
}
