/**
 * ComposerTutorial — tour guidé spécifique à /composer, déclenché au
 * premier affichage de la page (prefs.composerTutorialSeen false).
 *
 * Stocke `prefs.composerTutorialSeen` au finish/skip pour ne pas le rejouer.
 * Réutilise TutorialOverlay (spotlight + tooltip + confetti outro).
 *
 * Steps (4 spotlights + 1 outro) :
 * 1. Selector key/mode → "Choisis ta tonalité"
 * 2. Selector style → "Choisis ton style"
 * 3. Bouton Générer → "Génère une progression qui sonne bien"
 * 4. Grid chord slots → "Chaque accord est évalué en live (great/good/risky)"
 * 5. Outro CTA "Lance ta première progression 🎼"
 */
import { TutorialOverlay, type TutorialStep } from './Tutorial';
import { usePrefs } from '@/stores/prefsStore';

const COMPOSER_STEPS: TutorialStep[] = [
  {
    targetId: 'composer-key',
    title: 'Choisis ta tonalité',
    body: "Sélectionne la tonalité dans laquelle composer (C, A, F#…) et le mode (majeur ou mineur).",
    prefer: 'bottom',
  },
  {
    targetId: 'composer-style',
    title: 'Choisis ton style',
    body: "Pop, rock, jazz, blues, mélancolique, épique — chaque style a ses progressions favorites.",
    prefer: 'bottom',
  },
  {
    targetId: 'composer-generate',
    title: 'Génère une progression',
    body: "Tap pour piocher une progression cohérente dans le pool du style. Re-tap pour varier.",
    prefer: 'bottom',
  },
  {
    targetId: 'composer-slots',
    title: 'Évaluation live de chaque accord',
    body: "Chaque slot affiche le degré roman + un badge 🟢 great / 🟡 good (emprunt) / 🟠 risky. Click ✏ pour changer un accord.",
    prefer: 'top',
  },
  {
    targetId: null,
    title: 'C\'est parti !',
    body: 'Joue, échange des accords, sauve tes progressions favorites. La théorie te guide, ton oreille décide.',
    cta: 'Composer ma première progression 🎼',
    confetti: true,
  },
];

export function ComposerTutorial({ onDone }: { onDone: () => void }) {
  const setComposerTutorialSeen = usePrefs((s) => s.setComposerTutorialSeen);
  return (
    <TutorialOverlay
      steps={COMPOSER_STEPS}
      label="Compositeur — tour guidé"
      onDone={() => {
        setComposerTutorialSeen(true);
        onDone();
      }}
    />
  );
}
