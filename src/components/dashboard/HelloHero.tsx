/**
 * HelloHero — hero salutation du Dashboard (refonte home 2026-06-25).
 *
 * Salutation dynamique (pickGreeting) avec le prénom en or serif italique
 * + halo, et badge "Mon plan" à droite (jour courant du parcours 28j).
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HelloHeroProps {
  /** Titre complet issu de pickGreeting (contient déjà le prénom). */
  title: string;
  /** Sous-titre issu de pickGreeting. */
  subtitle: string;
  /** Prénom — surligné en or italique dans le titre. */
  userName: string;
  /** Jour courant du parcours (badge). null = pas de badge. */
  planDay: number | null;
}

export function HelloHero({ title, subtitle, userName, planDay }: HelloHeroProps) {
  // Découpe le titre autour de la DERNIÈRE occurrence du prénom : les
  // templates placent {name} en fin de phrase, et un prénom qui collisionne
  // avec un mot du template ("On", "Bon"...) matcherait la 1re occurrence.
  const idx = title.lastIndexOf(userName);
  const before = idx >= 0 ? title.slice(0, idx) : title;
  const after = idx >= 0 ? title.slice(idx + userName.length) : '';

  return (
    <section className="flex items-start justify-between gap-4 pb-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="min-w-0"
      >
        <h1 className="display text-display-sm leading-tight text-text">
          {before}
          {idx >= 0 && <span className="text-gold-glow italic text-gold">{userName}</span>}
          {after}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
      </motion.div>

      {planDay != null && (
        <Link
          to="/plan"
          className="flex shrink-0 flex-col items-center gap-0.5"
          aria-label={`Mon plan — jour ${planDay}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-br from-gold/20 to-transparent">
            <span className="display text-lg tabular-nums text-gold">{planDay}</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-text-muted">Mon plan</span>
        </Link>
      )}
    </section>
  );
}
