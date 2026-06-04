/**
 * SwipeableChordCard — affiche un accord avec son ChordDiagram, swipeable
 * horizontalement pour parcourir les différents voicings (open, barré,
 * 4e position, etc.).
 *
 * Extrait de src/pages/Chords.tsx (session compositeur) pour pouvoir être
 * réutilisé sur /composer sans dupliquer le code. Rendu identique au
 * comportement précédent.
 *
 * Pattern : AnimatePresence mode="popLayout" + variants slide directionnels.
 * popLayout (vs "wait") laisse l'enter mounter immédiatement avec son
 * animation pendant que l'exit fade out → SVG passe direct au bon voicing
 * sans flicker, contrairement à mode="wait" qui gardait le snapshot
 * exitant figé.
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import { QUALITY_LABELS, type Chord } from '@/lib/chordDatabase';
import { Volume2 } from 'lucide-react';
import clsx from 'clsx';

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export function SwipeableChordCard({
  chord,
  onPlay,
}: {
  chord: Chord;
  onPlay: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const voicing = chord.voicings[idx];
  const total = chord.voicings.length;
  const hasMultiple = total > 1;

  const goTo = (newIdx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, newIdx));
    if (clamped === idx) return;
    setDirection(clamped > idx ? 1 : -1);
    setIdx(clamped);
  };

  return (
    <Card hover className="group relative flex flex-col p-3">
      {/* Volume icon top-right : signale que le card est cliquable et
          qu'on l'entend. Pulse au hover. */}
      <span
        className="pointer-events-none absolute right-2.5 top-2.5 text-text-soft transition-all group-hover:scale-110 group-hover:text-gold"
        aria-hidden
      >
        <Volume2 size={14} strokeWidth={1.8} />
      </span>
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Jouer ${chord.name}`}
        className="flex items-baseline gap-2 text-left"
      >
        <span className="font-mono text-xl font-bold text-gold">{chord.name}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-soft">
          {QUALITY_LABELS[chord.quality] ?? chord.quality}
        </span>
      </button>

      {/* Zone swipe — drag horizontal pour changer de voicing. overflow-hidden
          contient les translations d'entrée/sortie. */}
      <div className="mt-2 select-none overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={idx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 360, damping: 32 }, opacity: { duration: 0.15 } }}
            drag={hasMultiple ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              const threshold = 50;
              if (info.offset.x < -threshold || info.velocity.x < -400) {
                goTo(idx + 1);
              } else if (info.offset.x > threshold || info.velocity.x > 400) {
                goTo(idx - 1);
              }
            }}
            className={clsx(
              'flex justify-center',
              hasMultiple && 'cursor-grab active:cursor-grabbing'
            )}
          >
            <ChordDiagram voicing={voicing} name={chord.name} size="md" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicateurs pagination — petits traits gold si plusieurs voicings */}
      {hasMultiple && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {chord.voicings.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              aria-label={`Voicing ${i + 1} sur ${total}`}
              aria-current={i === idx}
              className={clsx(
                'h-1 rounded-full transition-all',
                i === idx ? 'w-6 bg-gold' : 'w-2 bg-border hover:bg-gold-soft'
              )}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
