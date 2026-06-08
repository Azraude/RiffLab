/**
 * Breadcrumb — lien discret "← Parent" en haut d'une page sous-route.
 *
 * Pattern utilisé sur les pages outils (/tools/tuner, /tools/metronome,
 * etc.) pour permettre de revenir au hub /tools en 1 tap.
 *
 * Le hub est aussi accessible via la sidebar/MobileNav (highlight
 * "Outils" actif sur ces pages), donc le breadcrumb est juste un
 * raccourci ergonomique, pas un fallback navigation.
 */
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BreadcrumbProps {
  to: string;
  label: string;
}

export function Breadcrumb({ to, label }: BreadcrumbProps) {
  return (
    <Link
      to={to}
      className="mb-3 inline-flex items-center gap-1 text-sm text-text-soft transition-colors hover:text-gold"
    >
      <ChevronLeft size={14} /> {label}
    </Link>
  );
}
