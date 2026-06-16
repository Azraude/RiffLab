/**
 * /activity — page pleine largeur affichant l'ActivityFeedWidget.
 *
 * Sert de point d'accès en attendant que le widget soit mount dans
 * Dashboard (post-merge feat/responsive-refonte).
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActivityFeedWidget } from '@/components/social/ActivityFeedWidget';

export function Activity() {
  return (
    <>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold">
        <ArrowLeft size={14} /> Aujourd'hui
      </Link>

      <PageHeader
        title="🌐 Activité"
        subtitle="Ce qui se passe dans ton réseau de riffeurs."
      />

      <div className="mx-auto max-w-2xl">
        <ActivityFeedWidget limit={20} />
      </div>
    </>
  );
}
