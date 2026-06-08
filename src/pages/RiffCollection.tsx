/**
 * /riffs/collections/:slug — page d'une collection curée (sess 27 Phase 3).
 *
 * Hero header avec emoji + titre + description, puis liste des riffs
 * avec la même RiffCard que le feed principal.
 */
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { RiffCard } from '@/components/riffs/RiffCard';
import { LearnRiffMode } from '@/components/riffs/LearnRiffMode';
import { RiffTabModal } from '@/components/riffs/RiffTabModal';
import { ShareDrawer } from '@/components/share/ShareDrawer';
import { getCollection, getCollectionRiffs, ACCENT_CLASSES } from '@/lib/riffCollections';
import { getTab } from '@/lib/tabsDatabase';
import { listMasteredRiffs } from '@/lib/db';
import type { CommunityRiff } from '@/lib/communityRiffs';
import { useAudio } from '@/hooks/useAudio';
import { useToast } from '@/hooks/useToast';

export function RiffCollection() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const collection = slug ? getCollection(slug) : undefined;
  const riffs = slug ? getCollectionRiffs(slug) : [];
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

  if (!collection) return <Navigate to="/riffs" replace />;

  const handleListen = (riff: CommunityRiff) => {
    const tab = getTab(riff.tabId);
    if (!tab) return;
    toast.info(`▶ Preview ${tab.name}`);
    const flat = tab.measures.flatMap((m) => m).slice(0, 8);
    for (let i = 0; i < flat.length; i++) {
      window.setTimeout(() => {
        const fbString = 5 - flat[i].string;
        const openTuning = [40, 45, 50, 55, 59, 64];
        void playMidi(openTuning[fbString] + flat[i].fret);
      }, i * 200);
    }
  };

  return (
    <>
      <Link
        to="/riffs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold"
      >
        <ArrowLeft size={14} /> Toutes les collections
      </Link>

      {/* === Hero collection === */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={clsx(
          'mb-7 overflow-hidden rounded-2xl border bg-gradient-to-br p-6 md:p-8',
          ACCENT_CLASSES[collection.accent]
        )}
      >
        <div className="text-5xl">{collection.emoji}</div>
        <h1 className="display mt-3 text-display-lg leading-tight md:text-display-xl">
          {collection.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
          {collection.description}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-bg/40 px-3 py-1 text-xs text-text-muted">
          <span className="font-mono text-gold">{riffs.length}</span> riff
          {riffs.length > 1 ? 's' : ''} dans cette collection
        </div>
      </motion.section>

      {/* === Liste === */}
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        {riffs.map((r) => {
          const tab = getTab(r.tabId);
          if (!tab) return null;
          return (
            <RiffCard
              key={r.id}
              riff={r}
              tab={tab}
              masteredAt={masteredMap.get(r.id) ?? null}
              onListen={() => handleListen(r)}
              onViewTab={() => setTabModalRiff(r)}
              onLearn={() => setLearnRiff(r)}
              onOpenDetail={() => navigate(`/riffs/${r.id}`)}
              onShare={() => setShareDrawerRiff(r)}
            />
          );
        })}
        {riffs.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface-2 px-6 py-12 text-center text-sm text-text-muted">
            Aucun riff dans cette collection pour l'instant.
          </p>
        )}
      </div>

      {/* === Modals & drawers === */}
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
