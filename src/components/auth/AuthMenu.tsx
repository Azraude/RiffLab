/**
 * AuthMenu — composant réutilisable entre Sidebar desktop et MobileNav.
 *
 * Si not logged in → bouton "Se connecter" qui ouvre le LoginModal.
 * Si logged in → avatar (initiale) + email truncated + chevron, click
 * ouvre un dropdown Radix avec "Mon profil" + "Se déconnecter".
 *
 * Props `compact` : layout réduit pour le mobile (icone only sans email).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogIn, LogOut, User as UserIcon, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/stores/authStore';
import { LoginModal } from './LoginModal';

interface AuthMenuProps {
  /** Layout compact pour mobile sheet (sans email visible). */
  compact?: boolean;
}

export function AuthMenu({ compact = false }: AuthMenuProps) {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-10 w-full animate-pulse rounded-lg bg-surface-2" aria-hidden />
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-gold bg-gold/5 px-3 text-sm font-semibold text-text transition-colors hover:bg-gold/10"
        >
          <LogIn size={14} />
          Se connecter
        </button>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  const email = user.email ?? '';
  const initial = (email[0] ?? '?').toUpperCase();
  const displayEmail = email.length > 18 ? email.slice(0, 15) + '…' : email;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Compte connecté : ${email}`}
          className={clsx(
            'inline-flex h-10 w-full items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-2 transition-colors hover:border-gold-soft',
            compact ? 'justify-center' : 'justify-start'
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-mono text-xs font-bold text-gold">
            {initial}
          </span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1 truncate text-left font-mono text-xs text-text-muted">
                {displayEmail}
              </span>
              <ChevronUp size={14} className="shrink-0 text-text-soft" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          side="top"
          sideOffset={6}
          className="z-50 w-56 rounded-xl border border-border-gold bg-surface p-1 shadow-gold-strong"
        >
          <div className="border-b border-border px-3 py-2.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-text-soft">
              Connecté en tant que
            </div>
            <div className="mt-0.5 truncate font-mono text-xs text-text" title={email}>
              {email}
            </div>
          </div>
          <DropdownMenu.Item asChild>
            <Link
              to="/profile"
              className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm text-text outline-none hover:bg-surface-2 focus:bg-surface-2"
            >
              <UserIcon size={14} />
              Mon profil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => void handleSignOut()}
            className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm text-danger outline-none hover:bg-danger/10 focus:bg-danger/10"
          >
            <LogOut size={14} />
            Se déconnecter
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
