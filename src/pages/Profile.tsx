/**
 * /profile — hub compte personnel (sess SET-MOBILENAV).
 *
 * Refonte : avant Profile.tsx faisait juste un Navigate vers
 * /u/<myUsername>?edit=1. Maintenant c'est un vrai HUB COMPTE
 * style iOS (sections empilées) pour pattern réseau social :
 * - Header : avatar + @username + "Voir mon profil public"
 * - Row "Modifier mon profil" → /u/<me>?edit=1 (drawer auto)
 * - Row "Préférences" → /settings (sess SET — déménage depuis MobileNav)
 * - Row "Se déconnecter" rouge
 *
 * Pas connecté → écran "Connecte-toi" gracieux (pas redirect home).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  Edit3,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { getProfile, type Profile as ProfileRow } from '@/lib/socialApi';
import { LoginModal } from '@/components/auth/LoginModal';

export function Profile() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null | undefined>(undefined);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(undefined);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await getProfile(user.id);
      if (cancelled) return;
      setProfile(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Loading auth
  if (loading) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  // === Pas connecté → écran gracieux ===
  if (!user) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
            <UserIcon size={36} className="text-gold/70" />
          </div>
          <h2 className="display mb-3 text-2xl">Pour voir ton profil</h2>
          <p className="mb-8 text-sm leading-relaxed text-text-muted">
            Connecte-toi pour customiser ton profil, suivre des riffeurs et
            partager tes riffs publiquement. RiffLab marche aussi en mode
            local sans compte — le profil sert juste à la dimension sociale.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
          >
            <LogIn size={16} />
            Se connecter
          </button>
        </div>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  // Connecté + profile fetch en cours
  if (profile === undefined) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = profile?.username ?? null;
  const initial = (username?.[0] ?? user.email?.[0] ?? '?').toUpperCase();

  // === Connecté → hub compte ===
  return (
    <>
      <PageHeader title="Mon profil" />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* ─── Section identité ─── */}
        <Card className="text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gold/15 ring-1 ring-gold/30">
            {profile?.avatar_url ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-mono text-3xl font-bold text-gold">{initial}</span>
            )}
          </div>
          <h2 className="display text-xl">
            {profile?.display_name || profile?.username || 'Mon compte'}
          </h2>
          {username && (
            <p className="mt-0.5 font-mono text-sm text-text-muted">@{username}</p>
          )}
          {user.email && (
            <p className="mt-0.5 break-all text-xs text-text-soft">{user.email}</p>
          )}

          {username && (
            <Link
              to={`/u/${username}`}
              className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-4 text-xs text-text-muted hover:border-gold-soft hover:text-text"
            >
              <ExternalLink size={13} />
              Voir mon profil public
            </Link>
          )}
        </Card>

        {/* ─── Section actions profil ─── */}
        <SettingsList>
          {username && (
            <SettingsRow
              icon={<Edit3 size={16} />}
              label="Modifier mon profil"
              to={`/u/${username}?edit=1`}
            />
          )}
          <SettingsRow
            icon={<SettingsIcon size={16} />}
            label="Préférences"
            sub="Audio, affichage, accordage, données"
            to="/settings"
          />
        </SettingsList>

        {/* ─── Section déconnexion ─── */}
        <SettingsList>
          <SettingsRow
            icon={<LogOut size={16} />}
            label="Se déconnecter"
            onClick={() => void handleSignOut()}
            danger
          />
        </SettingsList>
      </div>
    </>
  );
}

// ─── Sub-components (inline, pas extraits — usage local Profile only) ───

function SettingsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {children}
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  sub,
  to,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const className = clsx(
    'flex h-14 w-full items-center gap-3 border-b border-border/40 px-4 text-left transition-colors last:border-0',
    danger
      ? 'text-danger hover:bg-danger/5'
      : 'text-text hover:bg-surface-2',
  );

  const content = (
    <>
      <span
        className={clsx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          danger ? 'bg-danger/10 text-danger' : 'bg-gold/10 text-gold',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-text-soft">{sub}</div>}
      </div>
      {to && <ChevronRight size={16} className="text-text-soft" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
