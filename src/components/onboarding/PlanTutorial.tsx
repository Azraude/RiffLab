/**
 * PlanTutorial — tour guidé spécifique à /plan, déclenché au PREMIER
 * click sur n'importe quel node du path Duolingo.
 *
 * Stocke `prefs.planTutorialSeen` au finish/skip pour ne pas le rejouer.
 * Réutilise le composant TutorialOverlay pour la primitive (spotlight +
 * tooltip + confetti outro).
 *
 * Steps (4 spotlights + 1 outro) :
 * 1. Path zigzag SVG = "ton parcours d'apprentissage"
 * 2. Un node = "chaque étape = un module à débloquer"
 * 3. Drawer chips chord/scale = "clique pour explorer — interactions = progression"
 * 4. Progress bar sticky = "suis ton avancée globale ici"
 * 5. Outro CTA "Vas-y, débloque ton premier niveau 🎸"
 */
import { TutorialOverlay, type TutorialStep } from './Tutorial';
import { usePrefs } from '@/stores/prefsStore';

const PLAN_STEPS: TutorialStep[] = [
  {
    targetId: 'plan-progress-bar',
    title: "Suis ton avancée globale",
    body: "Cette barre sticky te dit où tu en es sur les 10 niveaux. Toujours visible en haut.",
    prefer: 'bottom',
  },
  {
    targetId: 'plan-path',
    title: "Ton parcours d'apprentissage",
    body: "10 niveaux en zigzag, chacun débloque le suivant. Inspiration Duolingo — un module à la fois.",
    prefer: 'top',
  },
  {
    targetId: 'plan-node-active',
    title: "Chaque étape = un module",
    body: "Click sur un node pour ouvrir son drawer. Tu y trouveras les accords et gammes à travailler.",
    prefer: 'top',
  },
  {
    targetId: 'plan-drawer-chips',
    title: "Clique pour explorer",
    body: "Chaque chord ou scale est cliquable — ça t'amène directement sur la page accord/gamme. Chaque interaction te fait avancer dans le module.",
    prefer: 'top',
  },
  {
    targetId: null,
    title: "Allez, vas-y",
    body: "Débloque ton premier niveau et lance ton parcours. La régularité paye plus que l'intensité.",
    cta: 'Débloque ton premier niveau 🎸',
    confetti: true,
  },
];

export function PlanTutorial({ onDone }: { onDone: () => void }) {
  const setPlanTutorialSeen = usePrefs((s) => s.setPlanTutorialSeen);
  return (
    <TutorialOverlay
      steps={PLAN_STEPS}
      label="Mon plan — tour guidé"
      onDone={() => {
        setPlanTutorialSeen(true);
        onDone();
      }}
    />
  );
}
