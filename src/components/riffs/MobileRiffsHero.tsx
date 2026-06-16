/**
 * MobileRiffsHero — sections empilées au-dessus du feed sur mobile
 * (sess 30bis Phase 1).
 *
 * Visible UNIQUEMENT mobile/tablet (< xl). Desktop xl+ continue à
 * utiliser RiffsSidebarRight.
 *
 * Sections (toutes en carrousels horizontaux avec edge fade right) :
 *  1. 📅 Riff du jour (banner full-width, 1 card)
 *  2. 🏆 Top semaine (carrousel cards 240px)
 *  3. 📚 Collections (carrousel cards 200px)
 *  4. 👤 À suivre (carrousel user cards 180px)
 *  5. ⚔️ Battle de la semaine (1 card full-width)
 *
 * Pattern UX : Instagram Explore / Spotify mobile. Une card légèrement
 * tronquée à droite signifie "swipe →".
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Library, Users, Swords, ChevronRight, User } from 'lucide-react';
import { COLLECTIONS, ACCENT_CLASSES } from '@/lib/riffCollections';
import { getDailyRiff } from '@/lib/communityRiffs';
import {
  getTopOfWeek,
  getSuggestedRiffeurs,
  getCurrentBattle,
  type PublicRiff,
  type Profile,
  type BattleWithRiffs,
} from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { FollowButton } from '@/components/social/FollowButton';

export function MobileRiffsHero() {
  const daily = getDailyRiff();
  const me = useAuth((s) => s.user);
  const [topWeek, setTopWeek] = useState<Array<PublicRiff & { likes_count: number }>>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [battle, setBattle] = useState<BattleWithRiffs | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void (async () => {
      const [top, sug, bat] = await Promise.all([
        getTopOfWeek(5),
        getSuggestedRiffeurs(me?.id ?? null, 5),
        getCurrentBattle(),
      ]);
      setTopWeek(top.data ?? []);
      setSuggested(sug.data ?? []);
      setBattle(bat.data);
    })();
  }, [me?.id]);

  return (
    // Hidden xl+ : à partir de 1280px, la sidebar droite prend le relais.
    // Ces sections doublonnent en desktop pour éviter conflits visuels.
    <div className="space-y-7 xl:hidden">
      {/* === 1. Riff du jour === */}
      {daily && (
        <section>
          <SectionTitle icon={<Sparkles size={13} />} accent>
            Riff du jour
          </SectionTitle>
          <Link
            to={`/riffs/${daily.riff.id}`}
            className="block overflow-hidden rounded-2xl border border-gold-soft bg-gradient-to-br from-gold/15 via-gold/5 to-transparent p-4 transition-colors hover:border-gold"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/15 text-gold">
                <Sparkles size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="display truncate text-lg leading-tight text-text">
                  {daily.tab.name}
                </h3>
                {daily.tab.artist && (
                  <p className="truncate text-xs text-text-muted">{daily.tab.artist}</p>
                )}
              </div>
              <ChevronRight size={18} className="shrink-0 text-gold" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-text">{daily.pitch}</p>
          </Link>
        </section>
      )}

      {/* === 2. Top semaine carrousel === */}
      {topWeek.length > 0 && (
        <CarouselSection
          icon={<Trophy size={13} />}
          title="Top de la semaine"
          link={{ to: '/leaderboard', label: 'Tout voir' }}
        >
          {topWeek.map((r, i) => (
            <Link
              key={r.id}
              to={`/riffs/${r.id}`}
              className="block w-[240px] shrink-0 rounded-xl border border-border bg-surface-2 p-3 transition-colors hover:border-gold-soft"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-mono text-[10px] font-bold text-gold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-text">{r.title}</div>
                  {r.artist && (
                    <div className="truncate text-[10px] text-text-muted">{r.artist}</div>
                  )}
                </div>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-gold">
                ❤️ {r.likes_count}
              </div>
            </Link>
          ))}
        </CarouselSection>
      )}

      {/* === 3. Collections carrousel === */}
      <CarouselSection icon={<Library size={13} />} title="Collections">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.slug}
            to={`/riffs/collections/${c.slug}`}
            className={`block w-[200px] shrink-0 rounded-xl border bg-gradient-to-br ${ACCENT_CLASSES[c.accent]} p-3 transition-all hover:-translate-y-0.5`}
          >
            <div className="text-2xl">{c.emoji}</div>
            <h3 className="display mt-2 line-clamp-1 text-sm leading-tight text-text">
              {c.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-text-muted">
              {c.description}
            </p>
          </Link>
        ))}
      </CarouselSection>

      {/* === 4. À suivre carrousel === */}
      {suggested.length > 0 && (
        <CarouselSection icon={<Users size={13} />} title="À suivre">
          {suggested.map((p) => (
            <UserCard key={p.id} profile={p} />
          ))}
        </CarouselSection>
      )}

      {/* === 5. Battle de la semaine === */}
      {battle && battle.riff_a && battle.riff_b && (
        <section>
          <SectionTitle icon={<Swords size={13} />}>Battle de la semaine</SectionTitle>
          <BattleMiniCard battle={battle} />
        </section>
      )}
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function SectionTitle({
  icon,
  accent,
  children,
}: {
  icon: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-2.5 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider ${
        accent ? 'text-gold' : 'text-text-soft'
      }`}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

function CarouselSection({
  icon,
  title,
  link,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  link?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-soft">
          {icon}
          <span>{title}</span>
        </div>
        {link && (
          <Link
            to={link.to}
            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gold hover:text-gold-bright"
          >
            {link.label} <ChevronRight size={12} />
          </Link>
        )}
      </div>
      {/* Scroll horizontal natif. Bord left/right négatif pour bleed
          jusqu'aux bords de viewport (le container parent a padding 16). */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3 pb-1 pr-4">{children}</div>
      </div>
    </section>
  );
}

function UserCard({ profile }: { profile: Profile }) {
  const initial = (profile.username[0] ?? '?').toUpperCase();
  return (
    <div className="flex w-[180px] shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-surface-2 p-3 text-center">
      <Link
        to={`/u/${profile.username}`}
        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-gold/30 bg-gold/10 font-mono text-base font-bold text-gold"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : initial === '?' ? (
          <User size={20} />
        ) : (
          initial
        )}
      </Link>
      <div className="min-w-0">
        <Link
          to={`/u/${profile.username}`}
          className="block truncate text-xs font-semibold text-text"
        >
          {profile.display_name || profile.username}
        </Link>
        <div className="truncate text-[10px] text-text-soft">@{profile.username}</div>
      </div>
      <FollowButton userId={profile.id} username={profile.username} variant="compact" />
    </div>
  );
}

function BattleMiniCard({ battle }: { battle: BattleWithRiffs }) {
  const total = battle.votes_a + battle.votes_b;
  const pctA = total > 0 ? Math.round((battle.votes_a / total) * 100) : 50;
  const pctB = 100 - pctA;
  return (
    <Link
      to="/battle"
      className="block overflow-hidden rounded-2xl border border-border bg-surface-2 p-4 transition-colors hover:border-gold-soft"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs font-bold text-gold">A</div>
          <div className="mt-0.5 truncate text-sm font-semibold text-text">
            {battle.riff_a?.title}
          </div>
        </div>
        <div className="display text-base text-text-soft">VS</div>
        <div className="min-w-0 text-right">
          <div className="font-mono text-xs font-bold text-danger">B</div>
          <div className="mt-0.5 truncate text-sm font-semibold text-text">
            {battle.riff_b?.title}
          </div>
        </div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-bg">
        <motion.div
          className="bg-gradient-to-r from-gold to-gold-bright"
          initial={{ width: 0 }}
          animate={{ width: `${pctA}%` }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className="bg-gradient-to-r from-danger to-[#e8a04b]"
          initial={{ width: 0 }}
          animate={{ width: `${pctB}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
        <span className="text-gold">{pctA}%</span>
        <span className="text-text-soft">{total} votes</span>
        <span className="text-danger">{pctB}%</span>
      </div>
    </Link>
  );
}
