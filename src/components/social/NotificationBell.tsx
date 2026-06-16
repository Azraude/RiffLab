/**
 * NotificationBell — cloche notifications dans le header (sess 29 Phase 6).
 *
 * Compte non-lues, drawer liste des notifs, mark as read au click.
 *
 * Types supportés (cf SUPABASE-MIGRATIONS-SESSION-29.sql triggers) :
 *  - 'like' : payload { from_user, riff_id }
 *  - 'comment' : payload { from_user, riff_id, comment_id, text }
 *  - 'follow' : payload { from_user }
 *  - 'badge' : payload { badge_slug }
 *  - 'editor_pick' : payload { riff_id }
 *  - 'top_week' : payload { riff_id }
 *
 * Polling toutes les 60s. À l'avenir : Supabase Realtime channel.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Award,
  Trophy,
  Star,
  X,
  CheckCheck,
} from 'lucide-react';
import {
  getMyNotifications,
  markNotificationsRead,
  getUnreadNotifCount,
  getProfile,
  type NotificationRow,
  type Profile,
} from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getBadgeMeta } from '@/lib/badges';

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const me = useAuth((s) => s.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>({});

  // Polling unread count
  useEffect(() => {
    if (!isSupabaseConfigured || !me) {
      setUnreadCount(0);
      return;
    }
    const tick = async () => {
      const n = await getUnreadNotifCount();
      setUnreadCount(n);
    };
    void tick();
    const interval = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [me?.id]);

  // Load liste au open + resolve profiles des from_user
  useEffect(() => {
    if (!open || !me) return;
    void (async () => {
      const { data } = await getMyNotifications();
      const rows = data ?? [];
      setNotifs(rows);
      // Resolve les profiles from_user uniques
      const uniqUserIds = new Set<string>();
      for (const n of rows) {
        const fromId = (n.payload as { from_user?: string })?.from_user;
        if (fromId && !profileCache[fromId]) uniqUserIds.add(fromId);
      }
      if (uniqUserIds.size > 0) {
        const fetched = await Promise.all(
          [...uniqUserIds].map((id) => getProfile(id))
        );
        const updates: Record<string, Profile> = {};
        fetched.forEach((res) => {
          if (res.data) updates[res.data.id] = res.data;
        });
        if (Object.keys(updates).length > 0) {
          setProfileCache((prev) => ({ ...prev, ...updates }));
        }
      }
      // Auto mark as read au load (UX standard Twitter/Insta)
      const unreadIds = rows.filter((r) => !r.read_at).map((r) => r.id);
      if (unreadIds.length > 0) {
        await markNotificationsRead(unreadIds);
        setUnreadCount(0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, me?.id]);

  if (!me || !isSupabaseConfigured) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-bg bg-danger px-1 font-mono text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild aria-describedby={undefined}>
                <motion.div
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl"
                  style={{ paddingTop: 'env(safe-area-inset-top)' }}
                >
                  <header className="flex items-center justify-between border-b border-border px-5 py-4">
                    <Dialog.Title className="display text-display-sm">
                      Notifications
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:border-gold-soft hover:text-text"
                    >
                      <X size={16} />
                    </button>
                  </header>

                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    {notifs.length === 0 ? (
                      <div className="px-5 py-12 text-center">
                        <Bell size={28} className="mx-auto text-text-soft" strokeWidth={1.5} />
                        <p className="mt-3 text-sm text-text-muted">
                          Pas encore de notification. Tu seras alerté quand on
                          like / commente / follow / etc.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {notifs.map((n) => (
                          <NotificationItem
                            key={n.id}
                            notif={n}
                            profileCache={profileCache}
                            onClose={() => setOpen(false)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>

                  {notifs.length > 0 && (
                    <footer className="border-t border-border px-3 py-2 text-center text-[10px] text-text-soft">
                      <CheckCheck size={11} className="mr-1 inline" />
                      Marquées comme lues automatiquement
                    </footer>
                  )}
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function NotificationItem({
  notif,
  profileCache,
  onClose,
}: {
  notif: NotificationRow;
  profileCache: Record<string, Profile>;
  onClose: () => void;
}) {
  const payload = notif.payload as {
    from_user?: string;
    riff_id?: string;
    text?: string;
    badge_slug?: string;
  };
  const fromUser = payload.from_user ? profileCache[payload.from_user] : null;
  const fromLabel = fromUser
    ? `@${fromUser.username}`
    : payload.from_user
      ? 'Quelqu\'un'
      : '';

  const meta = renderNotifMeta(notif.type, fromLabel, payload);
  const link = computeNotifLink(notif.type, payload);

  return (
    <li>
      <Link
        to={link}
        onClick={onClose}
        className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2 ${
          notif.read_at ? '' : 'bg-gold/5'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-gold">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-text">{meta.text}</div>
          <div className="mt-0.5 text-[10px] text-text-soft">
            {formatRelative(notif.created_at)}
          </div>
        </div>
      </Link>
    </li>
  );
}

function renderNotifMeta(
  type: NotificationRow['type'],
  fromLabel: string,
  payload: Record<string, unknown>
): { icon: React.ReactNode; text: React.ReactNode } {
  switch (type) {
    case 'like':
      return {
        icon: <Heart size={14} fill="currentColor" className="text-danger" />,
        text: (
          <>
            <strong>{fromLabel}</strong> a aimé ton riff
          </>
        ),
      };
    case 'comment': {
      const text = String(payload.text ?? '');
      return {
        icon: <MessageCircle size={14} />,
        text: (
          <>
            <strong>{fromLabel}</strong> a commenté : « {text.slice(0, 60)}
            {text.length > 60 ? '…' : ''} »
          </>
        ),
      };
    }
    case 'follow':
      return {
        icon: <UserPlus size={14} />,
        text: (
          <>
            <strong>{fromLabel}</strong> te suit
          </>
        ),
      };
    case 'badge': {
      const slug = String(payload.badge_slug ?? '');
      const meta = getBadgeMeta(slug);
      return {
        icon: <Award size={14} />,
        text: (
          <>
            Badge débloqué : <strong>{meta?.emoji} {meta?.title ?? slug}</strong>
          </>
        ),
      };
    }
    case 'editor_pick':
      return {
        icon: <Star size={14} fill="currentColor" />,
        text: <>🏅 Ton riff a été choisi comme Editor's pick !</>,
      };
    case 'top_week':
      return {
        icon: <Trophy size={14} />,
        text: <>🏆 Ton riff est dans le Top de la semaine !</>,
      };
    default:
      return {
        icon: <Bell size={14} />,
        text: <>Nouvelle notification</>,
      };
  }
}

function computeNotifLink(
  type: NotificationRow['type'],
  payload: Record<string, unknown>
): string {
  if (type === 'follow') {
    return payload.from_user ? `/u/${payload.from_user}` : '/riffs';
  }
  if (type === 'like' || type === 'comment' || type === 'editor_pick' || type === 'top_week') {
    return payload.riff_id ? `/riffs/${payload.riff_id}` : '/riffs';
  }
  return '/riffs';
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
