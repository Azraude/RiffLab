/**
 * DailyChallengeCard — défi du jour sur le Dashboard.
 *
 * Pick déterministe via `pickChallengeForDate(today)`. Le user clique
 * "Relever" → ouverture d'un Dialog full-screen avec TabPlayer + bouton
 * "✓ J'ai relevé le défi" qui écrit en Dexie (table dailyChallenges).
 *
 * Affiche un streak séparé du streak Practice (celui-ci = "n jours
 * consécutifs avec défi complété").
 */
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Target, Check, X, Play } from 'lucide-react';
import {
  getDailyChallengeState,
  completeDailyChallenge,
} from '@/lib/dailyChallenge';
import { TabPlayer } from '@/components/tabs/TabPlayer';

export function DailyChallengeCard() {
  const state = useLiveQuery(() => getDailyChallengeState(), []);
  const [open, setOpen] = useState(false);

  if (!state) {
    // Loading skeleton minimal
    return (
      <div className="mt-6 h-24 animate-pulse rounded-2xl border border-border bg-surface" />
    );
  }

  const { tab, completed, streak } = state;

  const handleComplete = async () => {
    await completeDailyChallenge();
    // Live-query repick automatiquement
  };

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-border-gold bg-gradient-to-br from-surface to-bg p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-gold" />
              <span className="eyebrow">Défi du jour</span>
              {streak > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                  🔥 {streak} d'affilée
                </span>
              )}
            </div>
            <h3 className="display mt-2 text-display-sm md:text-display-md">
              {tab.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
              {tab.artist && <span>{tab.artist}</span>}
              <span className="font-mono text-text-soft">·</span>
              <span className="font-mono">{tab.tempo} BPM</span>
              <span className="font-mono text-text-soft">·</span>
              <span className="font-mono text-text-soft">{tab.key}</span>
            </div>
          </div>

          {completed ? (
            <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 text-sm font-semibold text-success">
              <Check size={16} strokeWidth={2.5} />
              Défi relevé ✨
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright"
            >
              <Play size={14} strokeWidth={2.5} /> Relever
            </button>
          )}
        </div>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed inset-x-2 top-1/2 z-50 -translate-y-1/2 overflow-hidden rounded-2xl border border-border-gold bg-bg shadow-gold-strong sm:inset-x-auto sm:left-1/2 sm:max-w-3xl sm:-translate-x-1/2 sm:translate-y-[-50%]"
            aria-describedby={undefined}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-h-[88vh] overflow-y-auto p-4 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="eyebrow flex items-center gap-1.5">
                    <Target size={11} /> Défi du jour
                  </div>
                  <Dialog.Title className="display mt-1 text-display-sm">
                    {tab.name}
                  </Dialog.Title>
                  {tab.artist && (
                    <div className="text-sm text-text-muted">{tab.artist}</div>
                  )}
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text"
                    aria-label="Fermer le défi"
                  >
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </div>

              <div className="mt-5">
                <TabPlayer tab={tab} loop />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div className="text-xs text-text-soft">
                  Joue le riff au moins une fois proprement puis valide ton
                  défi pour augmenter ta série.
                </div>
                {completed ? (
                  <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 text-sm font-semibold text-success">
                    <Check size={16} strokeWidth={2.5} />
                    Défi relevé !
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright"
                  >
                    <Check size={16} strokeWidth={2.5} />
                    J'ai relevé le défi
                  </button>
                )}
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
