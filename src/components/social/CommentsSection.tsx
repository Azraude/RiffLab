/**
 * CommentsSection — liste + post + delete commentaires d'un riff (sess 30).
 *
 * Wire socialApi.getComments / postComment / deleteComment.
 * Si pas connecté : remplace l'input par "Connecte-toi pour commenter".
 * Si !isSupabaseConfigured : message dégradé.
 *
 * Pattern réutilisable : peut être monté sur RiffDetail ou ailleurs.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, Trash2, User, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import {
  getComments,
  postComment,
  deleteComment,
  isSeedRiff,
  type Comment,
} from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { useAuthGate } from '@/hooks/useAuthGate';
import { LoginModal } from '@/components/auth/LoginModal';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { useSocialStreak } from '@/stores/socialStreakStore';

interface CommentsSectionProps {
  riffId: string;
  /** Callback optionnel pour record social activity (streak) après post. */
  onActivity?: () => void;
}

export function CommentsSection({ riffId, onActivity }: CommentsSectionProps) {
  const me = useAuth((s) => s.user);
  const toast = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const isSeed = isSeedRiff(riffId);

  const refresh = async () => {
    setLoading(true);
    const { data } = await getComments(riffId);
    setComments(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    // Riff seed (cr-iron, cr-sevennation, sw-stairway…) → skip le query
    // Supabase (riff_id UUID-only en DB, sinon 400 Bad Request en flood).
    if (isSeed) {
      setComments([]);
      setLoading(false);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riffId, isSeed]);

  // Gating soft (sess GATE) — handlePost passe par requireAuth qui toast +
  // ouvre LoginModal après 200ms si pas connecté. <LoginModal/> monté plus bas.
  const { requireAuth, loginOpen, setLoginOpen } = useAuthGate();

  const handlePost = async () => {
    if (!requireAuth('commenter')) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setPosting(true);
    const { error } = await postComment(riffId, trimmed);
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText('');
    toast.success('💬 Commentaire posté');
    useSocialStreak.getState().recordActivity();
    onActivity?.();
    void refresh();
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    const { error } = await deleteComment(commentId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.info('Commentaire supprimé');
    void refresh();
  };

  if (!isSupabaseConfigured) {
    return (
      <Card className="text-center">
        <MessageCircle size={24} className="mx-auto text-text-soft" strokeWidth={1.5} />
        <p className="mt-2 text-sm text-text-muted">
          Les commentaires nécessitent Supabase configuré.
        </p>
      </Card>
    );
  }

  // Riff seed (intégré au bundle, pas dans la DB) → message gracieux au lieu
  // d'un input vide / loading infini + lien vers le feed UGC.
  if (isSeed) {
    return (
      <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent text-center">
        <Sparkles size={22} className="mx-auto text-gold-soft" strokeWidth={1.5} />
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Les commentaires arrivent quand des utilisateurs partagent leurs propres
          riffs. Celui-ci est un exemple intégré.
        </p>
        <Link
          to="/riffs"
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-4 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
        >
          Voir des riffs partagés
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compose box */}
      {me ? (
        <Card>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Partage ton avis, demande des conseils…"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-gold-soft focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[10px] text-text-soft">{text.length}/500</span>
            <button
              type="button"
              onClick={() => void handlePost()}
              disabled={posting || !text.trim()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-4 text-sm font-semibold text-bg shadow-gold hover:-translate-y-px disabled:opacity-50"
            >
              <Send size={14} />
              {posting ? 'Envoi…' : 'Commenter'}
            </button>
          </div>
        </Card>
      ) : (
        <Card className="text-center">
          <p className="text-sm text-text-muted">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="text-gold underline hover:text-gold-bright"
            >
              Connecte-toi
            </button>{' '}
            pour commenter ce riff.
          </p>
        </Card>
      )}

      {/* Liste */}
      {loading ? (
        <p className="text-sm text-text-soft">Chargement…</p>
      ) : comments.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-2 px-4 py-6 text-center text-sm text-text-soft">
          Pas encore de commentaire. Sois le premier !
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              canDelete={me?.id === c.author_id}
              onDelete={() => void handleDelete(c.id)}
            />
          ))}
        </ul>
      )}

      {/* Soft gating LoginModal (sess GATE) — ouvert auto par useAuthGate
          si user clique submit/login sans être connecté. */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function CommentRow({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const author = comment.author;
  const initial = (author?.username?.[0] ?? '?').toUpperCase();
  return (
    <li className="flex gap-3 rounded-xl border border-border bg-surface-2 p-3">
      <Link
        to={author ? `/u/${author.username}` : '#'}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-gold/10 font-mono text-xs font-bold text-gold"
      >
        {author?.avatar_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : initial === '?' ? (
          <User size={12} />
        ) : (
          initial
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            to={author ? `/u/${author.username}` : '#'}
            className="truncate font-mono text-xs font-semibold text-text hover:text-gold"
          >
            @{author?.username ?? 'anonyme'}
          </Link>
          <span className="shrink-0 text-[10px] text-text-soft">
            {formatRelative(comment.created_at)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-text">{comment.text}</p>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer"
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-soft',
            'hover:bg-danger/10 hover:text-danger'
          )}
        >
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}j`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} sem.`;
  const mo = Math.floor(d / 30);
  return `${mo} mois`;
}
