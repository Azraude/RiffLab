/**
 * /resources — Hub "Bibliothèque" : référence publique.
 *
 * Accords, gammes, progressions, rythmiques. Volontairement SÉPARÉ de
 * /library qui contient les données perso de l'user.
 * Refonte sidebar sess 26.
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { HubCard } from '@/components/nav/HubCard';
import { CHORDS } from '@/lib/chordDatabase';
import { SCALES } from '@/lib/scaleDatabase';
import { PROGRESSIONS } from '@/lib/progressionDatabase';
import { Grid3x3, Waves, Workflow, Activity } from 'lucide-react';

export function ResourcesHub() {
  return (
    <>
      <PageHeader
        title="Bibliothèque"
        subtitle="La référence — accords, gammes, progressions, rythmiques. Pour quand tu cherches l'inspi ou un voicing précis."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <HubCard
          to="/chords"
          icon={Grid3x3}
          title="Accords"
          description="Voicings CAGED, diagrammes propres, son réaliste. Tap pour entendre, swipe pour d'autres positions."
          teaser={`${CHORDS.length}+ accords précodés`}
          hero
          index={0}
        />
        <HubCard
          to="/scales"
          icon={Waves}
          title="Gammes"
          description="Visualiseur fretboard SVG, intervals colorisés, transpose dans n'importe quelle tonalité."
          teaser={`${SCALES.length} gammes & modes`}
          hero
          index={1}
        />
        <HubCard
          to="/progressions"
          icon={Workflow}
          title="Progressions"
          description="Progressions classiques taggées par mood. Transpose live, écoute en boucle, ajoute à un song."
          teaser={`${PROGRESSIONS.length}+ progressions populaires`}
          index={2}
        />
        <HubCard
          to="/strum-patterns"
          icon={Activity}
          title="Rythmiques"
          description="Patterns folk / rock / funk / reggae pour donner du groove à tes morceaux."
          teaser="Patterns visualisés"
          index={3}
        />
      </div>
    </>
  );
}
