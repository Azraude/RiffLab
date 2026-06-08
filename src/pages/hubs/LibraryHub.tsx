/**
 * /library — Hub "Ma musique" : tout ce qui est personnel à l'user.
 *
 * Sons, setlists, riffs, recordings. Volontairement SÉPARÉ de la
 * Bibliothèque (/resources) qui est la ref publique (accords, gammes).
 * Refonte sidebar sess 26 : 17 items → 8 + hubs.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/components/ui/PageHeader';
import { HubCard } from '@/components/nav/HubCard';
import { db } from '@/lib/db';
import { Music2, ListMusic, Flame, Sparkles } from 'lucide-react';

export function LibraryHub() {
  const songsCount = useLiveQuery(() => db.songs.count(), []) ?? 0;
  const setlistsCount = useLiveQuery(() => db.setlists.count(), []) ?? 0;
  const recordingsCount = useLiveQuery(() => db.recordings.count(), []) ?? 0;

  return (
    <>
      <PageHeader
        title="Ma musique"
        subtitle="Tes morceaux, tes setlists, tes idées de riffs. Tout au même endroit."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <HubCard
          to="/songs"
          icon={Music2}
          title="Mes sons"
          description="Tes covers, compos, idées de riffs avec accords, sections et paroles."
          teaser={
            songsCount > 0
              ? `${songsCount} morceau${songsCount > 1 ? 'x' : ''}`
              : 'Vide pour l\'instant'
          }
          hero
          index={0}
        />
        <HubCard
          to="/setlists"
          icon={ListMusic}
          title="Setlists"
          description="Groupe tes morceaux pour ta répèt ou ton prochain bar."
          teaser={
            setlistsCount > 0
              ? `${setlistsCount} setlist${setlistsCount > 1 ? 's' : ''}`
              : 'PDF export inclus'
          }
          index={1}
        />
        <HubCard
          to="/riffs"
          icon={Flame}
          title="Riffs"
          description="Le feed communautaire — joue, like, sauve, partage les meilleurs riffs."
          teaser="🔥 Riff du moment dispo"
          index={2}
        />
        <HubCard
          to="/riff-of-the-week"
          icon={Sparkles}
          title="Riff de la semaine"
          description="Découverte hebdo — un riff sélectionné à apprendre cette semaine."
          teaser="Une découverte par semaine"
          index={3}
        />
        {recordingsCount > 0 && (
          <HubCard
            to="/songs"
            icon={Music2}
            title="Mes enregistrements"
            description="Réécoute tes essais audio enregistrés directement depuis l'app."
            teaser={`${recordingsCount} essai${recordingsCount > 1 ? 's' : ''} enregistré${recordingsCount > 1 ? 's' : ''}`}
            index={4}
          />
        )}
      </div>
    </>
  );
}
