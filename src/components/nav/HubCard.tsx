/**
 * HubCard — card réutilisable pour les pages hub (/library /resources
 * /create /tools). Pattern : icône gold géante haut-gauche, titre
 * serif, description 1-2 lignes, teaser 1 ligne avec chip optionnelle,
 * full-card cliquable, hover gold glow.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface HubCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Teaser court (ex: "204 accords précodés") — affiché en chip gold/10 */
  teaser?: string;
  /** Badge optionnel coin top-droit (ex: "✨ NOUVEAU") */
  badge?: string;
  /** Effet hero (gradient backdrop) pour les cards principales */
  hero?: boolean;
  /** Index pour stagger d'entrée (optionnel, default 0) */
  index?: number;
}

export function HubCard({
  to,
  icon: Icon,
  title,
  description,
  teaser,
  badge,
  hero = false,
  index = 0,
}: HubCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 1, 0.5, 1],
      }}
    >
      <Link
        to={to}
        className={clsx(
          'group relative block h-full overflow-hidden rounded-2xl border bg-surface p-6 transition-all duration-200',
          'hover:-translate-y-0.5 hover:shadow-gold-strong',
          hero
            ? 'border-gold-soft hover:border-gold'
            : 'border-border hover:border-gold-soft',
        )}
      >
        {/* Hover glow halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse at top, rgb(var(--gold-glow) / 0.12), transparent 60%)',
          }}
        />

        {/* Header: icon + arrow */}
        <div className="relative flex items-start justify-between gap-3">
          <div
            className={clsx(
              'flex h-14 w-14 items-center justify-center rounded-2xl border transition-all',
              hero
                ? 'border-gold/40 bg-gradient-to-br from-gold/20 to-gold-soft/10 text-gold-bright'
                : 'border-gold/25 bg-gold/8 text-gold group-hover:border-gold/40 group-hover:bg-gold/12',
            )}
          >
            <Icon size={24} strokeWidth={1.6} />
          </div>
          <ArrowUpRight
            size={18}
            className="mt-2 text-text-soft transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
          />
        </div>

        {/* Badge top-right (optionnel) */}
        {badge && (
          <div className="absolute right-3 top-3 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-gold">
            {badge}
          </div>
        )}

        {/* Title + description */}
        <h3 className="display relative mt-5 text-[22px] leading-tight text-text">{title}</h3>
        <p className="relative mt-1.5 text-sm leading-relaxed text-text-muted">{description}</p>

        {/* Teaser chip */}
        {teaser && (
          <div className="relative mt-4">
            <span className="chip">{teaser}</span>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
