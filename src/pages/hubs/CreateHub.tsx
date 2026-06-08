/**
 * /create — Hub "Créer" : compose et capture rapide.
 *
 * Compositeur (suite d'accords générée) + raccourci nouveau morceau.
 * Refonte sidebar sess 26.
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { HubCard } from '@/components/nav/HubCard';
import { Wand2, Plus } from 'lucide-react';

export function CreateHub() {
  return (
    <>
      <PageHeader
        title="Créer"
        subtitle="Génère une suite d'accords théorie-validée, ou démarre un nouveau morceau."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <HubCard
          to="/composer"
          icon={Wand2}
          title="Compositeur"
          description="Générateur de suites d'accords théorie-validées. Choisis clé + style + mood, génère une prog, swap intelligent, ajoute à un song."
          teaser="🪄 Algo théorie codée — pas du AI fluff"
          hero
          index={0}
        />
        <HubCard
          to="/songs/new"
          icon={Plus}
          title="Nouveau morceau"
          description="Démarre une nouvelle entrée vide dans ton carnet — titre, artiste, accords, sections."
          teaser="2 minutes pour la première version"
          index={1}
        />
      </div>
    </>
  );
}
