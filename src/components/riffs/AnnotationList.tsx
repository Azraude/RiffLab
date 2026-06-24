/**
 * AnnotationList — annotations horodatées d'un riff (page détail).
 *
 * Chaque annotation est cliquable → seek l'audio à son timestamp (et scroll
 * la tab via le playhead synchronisé). L'annotation "active" (la plus récente
 * dont le timestamp est dépassé) est mise en surbrillance dorée.
 */
import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import clsx from 'clsx';
import type { RiffAnnotation } from '@/lib/communityRiffs';

interface AnnotationListProps {
  annotations: RiffAnnotation[];
  /** Seconde courante de l'horloge audio (pour highlight l'active). */
  currentTime: number;
  /** Seek l'audio au timestamp de l'annotation. */
  onSeek: (time: number) => void;
}

/** Formatte des secondes en m:ss. */
export function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export function AnnotationList({ annotations, currentTime, onSeek }: AnnotationListProps) {
  const activeId = useMemo(() => {
    const passed = annotations.filter((a) => a.timeSeconds <= currentTime);
    if (passed.length === 0) return null;
    return passed[passed.length - 1].id;
  }, [annotations, currentTime]);

  if (annotations.length === 0) return null;

  return (
    <section className="px-4 pt-6">
      <h3 className="display mb-3 text-lg text-text">Annotations</h3>
      <ul className="space-y-2">
        {annotations.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSeek(a.timeSeconds)}
              aria-current={a.id === activeId}
              className={clsx(
                'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                a.id === activeId
                  ? 'border-gold bg-gold/10'
                  : 'border-border bg-surface hover:border-gold-soft'
              )}
            >
              <Clock
                size={14}
                className={clsx('mt-0.5 shrink-0', a.id === activeId ? 'text-gold' : 'text-text-soft')}
              />
              <div className="min-w-0">
                <div className="font-mono text-xs text-text-muted">{fmtTime(a.timeSeconds)}</div>
                <p className={clsx('mt-0.5 text-sm', a.id === activeId ? 'text-gold' : 'text-text')}>
                  {a.text}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
