/**
 * ProfileHero — hero de la page profil public et perso (sess PROFIL).
 *
 * Cover photo full-width + avatar overlap + display name + @username +
 * instruments badges + bio + 4 liens externes + bouton CTA Follow ou
 * Modifier mon profil.
 *
 * Mobile-first 375px : cover 140px, avatar 88px, padding compact.
 * Desktop ≥md : cover 240px, avatar 112px, padding plus généreux.
 */
import { Edit3, User, Instagram, Youtube, Globe } from 'lucide-react';
import clsx from 'clsx';
import { FollowButton } from '@/components/social/FollowButton';
import {
  INSTRUMENTS,
  resolveCoverUrl,
  type ProfileExtensions,
} from '@/lib/profileApi';
import type { Profile as SocialProfile } from '@/lib/socialApi';

/** Profile complet = base socialApi + extensions colonnes ajoutées sess PROFIL. */
export type FullProfile = SocialProfile & Partial<ProfileExtensions>;

interface ProfileHeroProps {
  profile: FullProfile;
  /** True si c'est le profil de l'user connecté (= afficher "Modifier"). */
  isMe: boolean;
  /** Callback ouverture drawer édition (uniquement si isMe). */
  onEdit?: () => void;
}

export function ProfileHero({ profile, isMe, onEdit }: ProfileHeroProps) {
  const coverSrc = resolveCoverUrl(profile.cover_url);
  const displayName = profile.display_name || profile.username;
  const initial = (profile.username[0] ?? '?').toUpperCase();

  const instrumentBadges = (profile.instruments ?? [])
    .map((id) => INSTRUMENTS.find((i) => i.id === id))
    .filter((i): i is (typeof INSTRUMENTS)[number] => Boolean(i));

  return (
    <section className="relative -mx-5 mb-5 md:mx-0">
      {/* Cover photo — bleed full-width mobile, rounded card desktop */}
      <div className="relative h-[140px] overflow-hidden border-b border-border bg-surface-2 md:h-[240px] md:rounded-2xl md:border md:border-border-gold">
        <img
          src={coverSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        {/* Dégradé bas pour lisibilité du texte qui chevauche */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>

      {/* Bloc identité (overlap sur cover) */}
      <div className="relative -mt-12 flex flex-col items-start gap-3 px-5 md:-mt-14 md:px-6">
        {/* Avatar overlap + bouton CTA aligné à droite mobile (stacked) */}
        <div className="flex w-full items-end justify-between gap-3">
          <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full border-4 border-bg bg-gold/10 md:h-[112px] md:w-[112px]">
            {profile.avatar_url ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-mono text-3xl font-bold text-gold">
                {initial === '?' ? <User size={36} /> : initial}
              </span>
            )}
          </div>

          {/* Bouton CTA */}
          {isMe ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border-gold bg-gold/10 px-3 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 active:scale-[0.98] md:h-11 md:px-4 md:text-sm"
            >
              <Edit3 size={14} />
              <span>Modifier</span>
            </button>
          ) : (
            <FollowButton userId={profile.id} username={profile.username} />
          )}
        </div>

        {/* Display name + @username */}
        <div className="min-w-0">
          <h1 className="display text-display-md leading-tight md:text-display-lg">
            {displayName}
          </h1>
          <p className="mt-0.5 font-mono text-sm text-text-muted">@{profile.username}</p>
        </div>

        {/* Instruments badges */}
        {instrumentBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {instrumentBadges.map((i) => (
              <span
                key={i.id}
                className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/8 px-2 py-0.5 text-[10px] font-medium text-gold-soft"
                title={i.label}
              >
                <span aria-hidden>{i.emoji}</span>
                <span>{i.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Bio (3 lignes max + clamp) */}
        {profile.bio && (
          <p className="line-clamp-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-text">
            {profile.bio}
          </p>
        )}

        {/* Liens externes — row 4 icônes max, h-11 tap target */}
        {(profile.instagram_url ||
          profile.youtube_url ||
          profile.soundcloud_url ||
          profile.website_url) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {profile.instagram_url && (
              <ExternalLink
                href={profile.instagram_url}
                label="Instagram"
                color="text-[#e1306c]"
              >
                <Instagram size={16} />
              </ExternalLink>
            )}
            {profile.youtube_url && (
              <ExternalLink
                href={profile.youtube_url}
                label="YouTube"
                color="text-[#ff0000]"
              >
                <Youtube size={16} />
              </ExternalLink>
            )}
            {profile.soundcloud_url && (
              <ExternalLink
                href={profile.soundcloud_url}
                label="SoundCloud"
                color="text-[#ff7700]"
              >
                {/* SoundCloud icon : pas de Lucide direct, on utilise un SVG path inline */}
                <SoundCloudIcon />
              </ExternalLink>
            )}
            {profile.website_url && (
              <ExternalLink
                href={profile.website_url}
                label="Site web"
                color="text-gold-bright"
              >
                <Globe size={16} />
              </ExternalLink>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function ExternalLink({
  href,
  label,
  color,
  children,
}: {
  href: string;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 transition-colors hover:border-gold-soft active:scale-95',
        color,
      )}
    >
      {children}
    </a>
  );
}

function SoundCloudIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2.5 14.5c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5s.5-.22.5-.5v-3c0-.28-.22-.5-.5-.5zm2 0c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5s.5-.22.5-.5v-3c0-.28-.22-.5-.5-.5zm2 0c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5s.5-.22.5-.5v-3c0-.28-.22-.5-.5-.5zm2 0c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5s.5-.22.5-.5v-3c0-.28-.22-.5-.5-.5zm2-3c-.28 0-.5.22-.5.5v6c0 .28.22.5.5.5s.5-.22.5-.5v-6c0-.28-.22-.5-.5-.5zm2 0c-.28 0-.5.22-.5.5v6c0 .28.22.5.5.5s.5-.22.5-.5v-6c0-.28-.22-.5-.5-.5zm9.5 5c0-2.21-1.79-4-4-4-.36 0-.71.05-1.04.14C16.4 9.84 14.4 8 12 8c-2.2 0-4 1.34-4.74 3.2.36-.13.74-.2 1.14-.2v7h11c1.66 0 3-1.34 3-3z" />
    </svg>
  );
}
