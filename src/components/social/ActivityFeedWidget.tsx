/**
 * ActivityFeedWidget — feed des actions de ton réseau social (sess 30 T4).
 *
 * À mount dans Dashboard après merge feat/responsive-refonte.
 * Pour l'instant, accessible via /activity uniquement (coord 29bis).
 *
 * Types d'events affichés :
 *  - 🎸 @user a publié X (un user follow)
 *  - ❤️ @user a aimé X (sur un de mes riffs)
 *  - 💬 @user a commenté X (sur un de mes riffs)
 *  - ➕ @user te suit
 *
 * Polling au mount seulement (refresh manuel via le composant parent).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Heart, MessageCircle, UserPlus, Music2, User, Globe } from 'lucide-react';
import { getActivityFeed, type ActivityEvent } from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';

interface ActivityFeedWidgetProps {
  /** Limit nombre d'events. Default 10. */
  limit?: number;
}

export function ActivityFeedWidget({ limit = 10 }: ActivityFeedWidgetProps) {
  const me = useAuth((s) => s.user);
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !me) {
      setEvents([]);
      return;
    }
    void (async () => {
      const { data } = await getActivityFeed(me.id, limit);
      setEvents(data ?? []);
    })();
  }, [me?.id, limit]);

  return (
    <Card>
      <header className="mb-3 flex items-center gap-2">
        <Globe size={14} className="text-gold" />
        <h3 className="display text-base">Activité récente</h3>
      </header>
      <p className="-mt-1 mb-3 text-xs text-text-soft">Tes potes ont fait…</p>

      {!isSupabaseConfigured ? (
        <p className="text-sm text-text-muted">
          Connecte-toi à Supabase pour voir ton réseau social.
        </p>
      ) : !me ? (
        <p className="text-sm text-text-muted">
          <Link to="/login" className="text-gold underline hover:text-gold-bright">
            Connecte-toi
          </Link>{' '}
          pour voir l'activité de ton réseau.
        </p>
      ) : events === null ? (
        <p className="text-sm text-text-soft">Chargement…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-text-muted">
          Personne dans ton réseau n'a fait d'activité récemment. Suis quelques
          riffeurs pour voir leurs actus ici.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {events.map((e, i) => (
            <ActivityRow key={i} event={e} />
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function ActivityRow({ event }: { event: ActivityEvent }) {
  const meta = renderEventMeta(event);
  return (
    <li>
      <Link
        to={meta.link}
        className="flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-gold">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-text">{meta.text}</div>
          <div className="mt-0.5 text-[10px] text-text-soft">
            {formatRelative(event.created_at)}
          </div>
        </div>
      </Link>
    </li>
  );
}

function renderEventMeta(event: ActivityEvent): {
  icon: React.ReactNode;
  text: React.ReactNode;
  link: string;
} {
  const actor = event.actor;
  const actorName = actor ? `@${actor.username}` : 'Quelqu\'un';
  const riff = event.riff;
  const riffTitle = riff?.title ?? 'un riff';
  const riffLink = riff ? `/riffs/${riff.id}` : '/riffs';
  const actorLink = actor ? `/u/${actor.username}` : '/riffs';

  switch (event.type) {
    case 'publish':
      return {
        icon: <Music2 size={13} />,
        text: (
          <>
            <strong>{actorName}</strong> a publié{' '}
            <span className="text-gold">{riffTitle}</span>
          </>
        ),
        link: riffLink,
      };
    case 'like':
      return {
        icon: <Heart size={13} fill="currentColor" className="text-danger" />,
        text: (
          <>
            <strong>{actorName}</strong> a aimé ton riff{' '}
            <span className="text-gold">{riffTitle}</span>
          </>
        ),
        link: riffLink,
      };
    case 'comment': {
      const txt = event.comment_text ?? '';
      return {
        icon: <MessageCircle size={13} />,
        text: (
          <>
            <strong>{actorName}</strong> a commenté{' '}
            <span className="text-gold">{riffTitle}</span> : «{' '}
            {txt.slice(0, 50)}
            {txt.length > 50 ? '…' : ''} »
          </>
        ),
        link: riffLink,
      };
    }
    case 'follow':
      return {
        icon: <UserPlus size={13} />,
        text: (
          <>
            <strong>{actorName}</strong> te suit
          </>
        ),
        link: actorLink,
      };
    default:
      return {
        icon: <User size={13} />,
        text: 'Nouvelle activité',
        link: '/riffs',
      };
  }
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
