/**
 * /riffs/editor-picks — historique des Editor's picks (sess 29 Phase 7).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { getEditorPicksHistory, type EditorPick } from '@/lib/socialApi';
import { isSupabaseConfigured } from '@/lib/supabase';

export function EditorPicks() {
  const [picks, setPicks] = useState<EditorPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    void (async () => {
      const { data } = await getEditorPicksHistory();
      setPicks(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Link
        to="/riffs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold"
      >
        <ArrowLeft size={14} /> Feed des riffs
      </Link>

      <PageHeader
        title="🏅 Editor's picks"
        subtitle="Les riffs sélectionnés à la main par Melvin parce qu'ils méritent ton attention."
      />

      {!isSupabaseConfigured ? (
        <Card>
          <p className="text-sm text-text-muted">
            Les editor's picks nécessitent Supabase configuré.
          </p>
        </Card>
      ) : loading ? (
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      ) : picks.length === 0 ? (
        <Card className="text-center">
          <Star size={32} className="mx-auto text-text-soft" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-text-muted">
            Pas encore d'editor's pick. Les premiers arrivent bientôt !
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {picks.map((p, i) => {
            if (!p.riff) return null;
            const author = (p.riff as { author?: { username?: string } }).author;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/riffs/${p.riff_id}`}
                  className="block rounded-2xl border border-border bg-surface-2 p-4 transition-colors hover:border-gold-soft"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="display truncate text-base text-text">
                      {p.riff.title}
                    </h3>
                    <span className="shrink-0 font-mono text-[10px] text-text-soft">
                      {new Date(p.start_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {author?.username && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      par <span className="font-mono text-gold-soft">@{author.username}</span>
                    </p>
                  )}
                  {p.editor_note && (
                    <p className="mt-2 text-sm italic text-text">
                      « {p.editor_note} »
                    </p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
