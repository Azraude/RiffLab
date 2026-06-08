/**
 * RiffOfTheDayHero — card géante "🌟 Riff du jour" pour le top de /riffs.
 *
 * Sélection déterministe via getDailyRiff(now) : tous les users voient
 * le même riff le même jour.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import { getDailyRiff } from '@/lib/communityRiffs';

export function RiffOfTheDayHero() {
  const daily = getDailyRiff();
  if (!daily) return null;
  const { riff, tab, pitch } = daily;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-gold-soft bg-gradient-to-br from-gold/15 via-gold/5 to-transparent p-5 md:p-7"
    >
      {/* Halo gold décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--gold-glow) / 0.25) 0%, transparent 70%)',
        }}
      />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
          <Sparkles size={11} /> Riff du jour
        </div>
        <h2 className="display mt-3 text-display-md leading-tight md:text-display-lg">
          {tab.name}
        </h2>
        {tab.artist && (
          <p className="mt-0.5 text-sm text-text-muted">{tab.artist}</p>
        )}
        <p className="mt-3 max-w-md text-sm leading-relaxed text-text">{pitch}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to={`/riffs/${riff.id}`}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
          >
            Découvrir <ArrowRight size={14} />
          </Link>
          <div className="inline-flex items-center gap-3 text-xs text-text-muted">
            <span>
              <span className="font-mono text-gold">{tab.tempo}</span> BPM
            </span>
            <span>·</span>
            <span>{tab.key}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-0.5">
              {'⭐'.repeat(riff.difficulty)}
            </span>
          </div>
        </div>
      </div>

      {/* Icon Play décoratif coin bas-droit */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-2 -right-2 hidden h-32 w-32 items-center justify-center text-gold/15 md:flex"
      >
        <Play size={120} fill="currentColor" />
      </div>
    </motion.div>
  );
}
