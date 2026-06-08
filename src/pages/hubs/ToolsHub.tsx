/**
 * /tools — Hub "Outils" : tuner, métronome, ear training, fretboard
 * learner. Centralise tout ce qui est utilitaire de pratique.
 *
 * Refonte sidebar sess 26 : était éclaté en 3 entrées top-level
 * + nouveau /tools/fretboard-learner (sess 26 Phase 2).
 *
 * Note : les pages outils restent accessibles via leur ancienne URL
 * /tuner /metronome /ear-training pour pas casser les liens partagés
 * — les routes /tools/* sont des aliases qui rendent les mêmes pages.
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { HubCard } from '@/components/nav/HubCard';
import { Mic, Timer, Ear, Target } from 'lucide-react';

export function ToolsHub() {
  return (
    <>
      <PageHeader
        title="Outils"
        subtitle="Tuner, métronome, ear training… tout ce qui n'est pas un morceau mais qui aide ta pratique."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <HubCard
          to="/tools/tuner"
          icon={Mic}
          title="Tuner"
          description="Accordage live au micro avec détection de pitch YIN. Affichage à l'aiguille avec zones in/proche/loin."
          teaser="Précis à ±2 cents"
          hero
          index={0}
        />
        <HubCard
          to="/tools/metronome"
          icon={Timer}
          title="Métronome"
          description="40-220 BPM avec subdivisions. Visuel battant + click audio. Synchro tempo pour pratiquer."
          teaser="Tap tempo + presets"
          index={1}
        />
        <HubCard
          to="/tools/ear-training"
          icon={Ear}
          title="Entraînement oreille"
          description="Devine les intervalles, accords, progressions à l'oreille. Gradue ta difficulté."
          teaser="Joue plusieurs modes"
          index={2}
        />
        <HubCard
          to="/tools/fretboard-learner"
          icon={Target}
          title="Fretboard Learner"
          description="Mini-jeu pour apprendre les notes du manche. 4 niveaux du débutant au speed mode."
          teaser="🎯 Mémorise ton manche"
          badge="Nouveau"
          hero
          index={3}
        />
      </div>
    </>
  );
}
