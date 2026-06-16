/**
 * /riffs/tag/:tag — feed des riffs avec un tag spécifique (sess 29 Phase 6).
 *
 * Combine 2 sources :
 *  - COMMUNITY_RIFFS locaux (seedés) matchant le tag
 *  - PublicRiffs Supabase via filter tags array contains
 *
 * Pour l'instant on affiche juste les locaux. Wiring Supabase quand
 * il y aura assez de riffs publics.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Hash } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { RiffCard } from '@/components/riffs/RiffCard';
import { RiffTabModal } from '@/components/riffs/RiffTabModal';
import { LearnRiffMode } from '@/components/riffs/LearnRiffMode';
import { ShareDrawer } from '@/components/share/ShareDrawer';
import { COMMUNITY_RIFFS, type CommunityRiff } from '@/lib/communityRiffs';
import { getTab } from '@/lib/tabsDatabase';
import { listMasteredRiffs } from '@/lib/db';
import { useAudio } from '@/hooks/useAudio';
import { useToast } from '@/hooks/useToast';

export function RiffsByTag() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [tabModalRiff, setTabModalRiff] = useState<CommunityRiff | null>(null);
  const [shareDrawerRiff, setShareDrawerRiff] = useState<CommunityRiff | null>(null);
  const [learnRiff, setLearnRiff] = useState<CommunityRiff | null>(null);

  const { playMidi } = useAudio();
  const toast = useToast();

  const masteredRows = useLiveQuery(() => listMasteredRiffs(), []) ?? [];
  const masteredMap = useMemo(
    () => new Map(masteredRows.map((m) => [m.id, m.masteredAt] as const)),
    [masteredRows]
  );

  const filteredRiffs = useMemo(() => {
    if (!tag) return [];
    return COMMUNITY_RIFFS.filter(
      (r) =>
        r.tags.some((t) => t.toLowerCase() === tag.toLowerCase()) ||
        r.techniques?.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
  }, [tag]);

  const handleListen = (riff: CommunityRiff) => {
    const t = getTab(riff.tabId);
    if (!t) return;
    toast.info(`▶ Preview ${t.name}`);
    const flat = t.measures.flatMap((m) => m).slice(0, 8);
    for (let i = 0; i < flat.length; i++) {
      window.setTimeout(() => {
        const fbString = 5 - flat[i].string;
        const openTuning = [40, 45, 50, 55, 59, 64];
        void playMidi(openTuning[fbString] + flat[i].fret);
      }, i * 200);
    }
  };

  if (!tag) {
    return (
      <>
        <PageHeader title="Tag" />
        <Card>
          <p className="text-sm text-text-muted">Tag manquant dans l'URL.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <Link
        to="/riffs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold"
      >
        <ArrowLeft size={14} /> Feed des riffs
      </Link>

      <PageHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            <Hash size={28} className="text-gold" />
            <span>{tag}</span>
          </span>
        }
        subtitle={`${filteredRiffs.length} riff${filteredRiffs.length > 1 ? 's' : ''} avec ce tag.`}
      />

      {filteredRiffs.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-text-muted">
            Aucun riff avec ce tag pour l'instant. Sois le premier à en
            publier un avec ce hashtag !
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRiffs.map((r) => {
            const t = getTab(r.tabId);
            if (!t) return null;
            return (
              <RiffCard
                key={r.id}
                riff={r}
                tab={t}
                compact
                masteredAt={masteredMap.get(r.id) ?? null}
                onListen={() => handleListen(r)}
                onViewTab={() => setTabModalRiff(r)}
                onLearn={() => setLearnRiff(r)}
                onOpenDetail={() => navigate(`/riffs/${r.id}`)}
                onShare={() => setShareDrawerRiff(r)}
              />
            );
          })}
        </div>
      )}

      <RiffTabModal
        open={!!tabModalRiff}
        onClose={() => setTabModalRiff(null)}
        riff={tabModalRiff}
        tab={tabModalRiff ? getTab(tabModalRiff.tabId) ?? null : null}
        onListen={() => tabModalRiff && handleListen(tabModalRiff)}
        onLearn={() => {
          if (tabModalRiff) {
            const r = tabModalRiff;
            setTabModalRiff(null);
            setLearnRiff(r);
          }
        }}
        onShare={() => {
          if (tabModalRiff) {
            const r = tabModalRiff;
            setShareDrawerRiff(r);
            setTabModalRiff(null);
          }
        }}
      />
      <ShareDrawer
        open={!!shareDrawerRiff}
        onOpenChange={(o) => !o && setShareDrawerRiff(null)}
        item={{
          type: 'riff',
          title: shareDrawerRiff ? getTab(shareDrawerRiff.tabId)?.name ?? 'Riff' : '',
          url: shareDrawerRiff
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/riffs/${shareDrawerRiff.id}`
            : '',
        }}
      />
      <LearnRiffMode
        open={!!learnRiff}
        onClose={() => setLearnRiff(null)}
        riff={learnRiff}
        tab={learnRiff ? getTab(learnRiff.tabId) ?? null : null}
      />
    </>
  );
}
