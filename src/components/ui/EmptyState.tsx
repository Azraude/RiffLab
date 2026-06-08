/**
 * EmptyState — composant réutilisable pour les listes vides.
 *
 * Pattern : icône Lucide géante en outline gold/30 + titre display +
 * sous-titre + CTA bouton primary + secondary action optionnelle.
 *
 * Utilisé sur Songs / Setlists / Recordings (par song). Garde un
 * design system cohérent et offre toujours une action concrète à
 * l'utilisateur (jamais juste "Aucun élément").
 */
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void; sublabel?: string };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-3xl border border-border bg-surface px-6 py-14 text-center"
    >
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-gold/25 bg-gold/5 text-gold">
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <h3 className="display text-display-sm">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">{description}</p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-6 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
        >
          {primaryAction.label}
        </button>
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface-2 px-5 text-sm font-medium text-text-muted hover:border-gold-soft hover:text-text"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
      {secondaryAction?.sublabel && (
        <p className="mt-2 text-xs text-text-soft">{secondaryAction.sublabel}</p>
      )}
    </motion.div>
  );
}
