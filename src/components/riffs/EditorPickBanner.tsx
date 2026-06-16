/**
 * EditorPickBanner — bannière dorée sticky en haut du feed Riffs.
 *
 * Affichée quand un editor_pick est actif (entre start_date et end_date).
 * Click → /riffs/:id du riff choisi.
 *
 * Dégrade gracefully : ne rend rien si Supabase pas configuré, ou pas
 * de pick actif, ou erreur fetch.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';
import { getCurrentEditorPicks, type EditorPick } from '@/lib/socialApi';
import { isSupabaseConfigured } from '@/lib/supabase';

export function EditorPickBanner() {
  const [pick, setPick] = useState<EditorPick | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void (async () => {
      const { data } = await getCurrentEditorPicks();
      // On affiche le 1er pick actif type 'week' en priorité
      if (data && data.length > 0) {
        const weekPick = data.find((p) => p.type === 'week');
        setPick(weekPick ?? data[0]);
      }
    })();
  }, []);

  if (!pick || !pick.riff) return null;

  const author = (pick.riff as { author?: { username?: string } }).author;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-4 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 via-gold/8 to-transparent"
    >
      <Link
        to={`/riffs/${pick.riff_id}`}
        className="flex items-center gap-3 p-4 transition-opacity hover:opacity-90 md:gap-4 md:p-5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-gold/15 text-gold">
          <Star size={18} fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-bg/40 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gold">
            🏅 Editor's pick
            {pick.type === 'week' && ' · semaine'}
            {pick.type === 'month' && ' · mois'}
          </div>
          <h3 className="display mt-1 truncate text-base text-text md:text-lg">
            {pick.riff.title}
          </h3>
          {pick.editor_note && (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
              <span className="text-gold-soft">@rifflab :</span> {pick.editor_note}
            </p>
          )}
          {!pick.editor_note && author?.username && (
            <p className="mt-0.5 text-xs text-text-muted">
              par <span className="font-mono text-gold-soft">@{author.username}</span>
            </p>
          )}
        </div>
        <ChevronRight size={18} className="shrink-0 text-gold" />
      </Link>
    </motion.div>
  );
}
