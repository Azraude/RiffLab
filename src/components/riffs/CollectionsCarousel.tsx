/**
 * CollectionsCarousel — scroll horizontal de cards collections.
 * Affiché sur /riffs entre le Riff du jour et le feed.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { COLLECTIONS, getCollectionRiffs, ACCENT_CLASSES } from '@/lib/riffCollections';

export function CollectionsCarousel() {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Collections curées</div>
          <h2 className="display text-display-sm">Sélections par thème</h2>
        </div>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-2 md:-mx-12 md:px-12">
        <div className="flex gap-4 [scrollbar-width:thin]">
          {COLLECTIONS.map((c, i) => {
            const count = getCollectionRiffs(c.slug).length;
            return (
              <motion.div
                key={c.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  to={`/riffs/collections/${c.slug}`}
                  className={clsx(
                    'group block w-[260px] shrink-0 overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg',
                    ACCENT_CLASSES[c.accent]
                  )}
                >
                  <div className="text-3xl">{c.emoji}</div>
                  <h3 className="display mt-3 text-lg leading-tight text-text">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">
                    {c.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-mono text-text-soft">{count} riffs</span>
                    <ChevronRight
                      size={14}
                      className="text-text-soft transition-transform group-hover:translate-x-1 group-hover:text-gold"
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
