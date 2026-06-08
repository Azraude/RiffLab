/**
 * ShareDrawer — Sheet réutilisable pour partager un contenu RiffLab.
 *
 * Boutons :
 * - Copy link (clipboard + toast)
 * - WhatsApp (wa.me intent)
 * - Discord (clipboard avec format "🎸 <title> — joue avec moi sur RiffLab : <url>")
 * - X / Twitter (tweet intent)
 * - Plus (Web Share API native — uniquement si supporté, typiquement mobile)
 *
 * Utilisé sur /songs/:id, /setlists/:id, /riffs detail, /progressions.
 */
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { ClipboardCopy, MessageCircle, Twitter, MoreHorizontal, Check } from 'lucide-react';
import clsx from 'clsx';

export type ShareItem = {
  title: string;
  url: string;
  /** Type pour customiser le caption (song / setlist / riff / progression) */
  type?: 'song' | 'setlist' | 'riff' | 'progression' | 'other';
};

interface ShareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShareItem;
}

function buildCaption(item: ShareItem): string {
  const emoji =
    item.type === 'setlist'
      ? '🎵'
      : item.type === 'riff'
      ? '🎸'
      : item.type === 'progression'
      ? '🎼'
      : '🎶';
  return `${emoji} ${item.title} — joue avec moi sur RiffLab : ${item.url}`;
}

export function ShareDrawer({ open, onOpenChange, item }: ShareDrawerProps) {
  const [copied, setCopied] = useState<null | 'link' | 'discord'>(null);
  const hasWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const flash = (kind: 'link' | 'discord') => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      flash('link');
    } catch {
      // ignore — clipboard non dispo (http context, browser perms)
    }
  };

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText(buildCaption(item));
      flash('discord');
    } catch {
      // ignore
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildCaption(item));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`🎸 ${item.title} sur RiffLab`);
    const url = encodeURIComponent(item.url);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const handleNativeShare = async () => {
    if (!hasWebShare) return;
    try {
      await navigator.share({
        title: item.title,
        text: buildCaption(item),
        url: item.url,
      });
    } catch {
      // user cancelled, ignore
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="📤 Partager"
      description={item.title}
    >
      <div className="space-y-2">
        {/* Copy link */}
        <ShareButton
          icon={<ClipboardCopy size={16} />}
          label={copied === 'link' ? 'Lien copié ✓' : 'Copier le lien'}
          sublabel={item.url}
          active={copied === 'link'}
          onClick={() => void handleCopyLink()}
        />

        {/* WhatsApp */}
        <ShareButton
          icon={<MessageCircle size={16} className="text-[#25D366]" />}
          label="WhatsApp"
          sublabel="Ouvre wa.me avec le message prérempli"
          onClick={handleWhatsApp}
        />

        {/* Discord */}
        <ShareButton
          icon={<DiscordIcon />}
          label={copied === 'discord' ? 'Format Discord copié ✓' : 'Discord (copier format prêt)'}
          sublabel="🎸 Title — joue avec moi sur RiffLab : URL"
          active={copied === 'discord'}
          onClick={() => void handleCopyDiscord()}
        />

        {/* Twitter / X */}
        <ShareButton
          icon={<Twitter size={16} className="text-[#1DA1F2]" />}
          label="X / Twitter"
          sublabel="Tweet intent avec lien"
          onClick={handleTwitter}
        />

        {/* Web Share API natif (mobile) */}
        {hasWebShare && (
          <ShareButton
            icon={<MoreHorizontal size={16} />}
            label="Plus…"
            sublabel="Ouvre les options de partage du système"
            onClick={() => void handleNativeShare()}
          />
        )}
      </div>
    </Sheet>
  );
}

function ShareButton({
  icon,
  label,
  sublabel,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 rounded-xl border bg-surface-2 p-3 text-left transition-colors',
        active
          ? 'border-success/40 bg-success/10'
          : 'border-border hover:border-gold-soft hover:bg-gold/5',
      )}
    >
      <span
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
          active
            ? 'border-success/40 bg-success/15 text-success'
            : 'border-border bg-surface text-text-muted',
        )}
      >
        {active ? <Check size={16} strokeWidth={3} /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={clsx('block text-sm font-semibold', active ? 'text-success' : 'text-text')}>
          {label}
        </span>
        {sublabel && (
          <span className="block truncate text-xs text-text-soft">{sublabel}</span>
        )}
      </span>
    </button>
  );
}

/** Discord brand mark SVG inline (5865F2 simplifié). */
function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
