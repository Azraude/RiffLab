import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  computeStreak,
  last30DaysPracticed,
  topPracticeItems,
} from '@/lib/db';
import { getChord } from '@/lib/chordDatabase';
import { getScale } from '@/lib/scaleDatabase';
import { Flame } from 'lucide-react';

export function Stats() {
  const streak = useLiveQuery(() => computeStreak(), []);
  const tops = useLiveQuery(() => topPracticeItems(5), []);
  const days = useLiveQuery(() => last30DaysPracticed(), []);

  const maxCount = Math.max(1, ...(days ?? []).map((d) => d.count));

  return (
    <>
      <PageHeader
        title="Stats"
        subtitle="Tes données de pratique depuis le début."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <div className="label-small">Série actuelle</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="display text-display-lg text-gold">{streak ?? 0}</div>
            {(streak ?? 0) > 0 && <Flame size={22} className="text-gold-bright" />}
          </div>
          <div className="mt-1 text-xs text-text-soft">
            jour{(streak ?? 0) > 1 ? 's' : ''} d'affilée
          </div>
        </Card>

        <Card>
          <div className="label-small">Total sessions</div>
          <div className="display text-display-lg mt-2 text-gold">
            {tops?.totalSessions ?? 0}
          </div>
          <div className="mt-1 text-xs text-text-soft">depuis toujours</div>
        </Card>

        <Card>
          <div className="label-small">Pratiqué cette semaine</div>
          <div className="display text-display-lg mt-2 text-gold">
            {days ? days.slice(-7).filter((d) => d.count > 0).length : 0}
            <span className="text-display-sm text-text-muted">/7</span>
          </div>
          <div className="mt-1 text-xs text-text-soft">jours sur 7</div>
        </Card>
      </div>

      {/* Courbe 30 jours */}
      <Card className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="eyebrow">30 derniers jours</div>
          <div className="text-xs text-text-soft">
            {days ? days.filter((d) => d.count > 0).length : 0} jours pratiqués
          </div>
        </div>
        <svg
          viewBox="0 0 300 80"
          width="100%"
          height="auto"
          aria-label="Courbe de pratique 30 jours"
          className="overflow-visible"
        >
          {/* Baseline */}
          <line x1="0" y1="76" x2="300" y2="76" stroke="#2a2a2a" strokeWidth="0.5" />

          {(days ?? []).map((d, i) => {
            const x = (i / 29) * 300;
            const h = (d.count / maxCount) * 60;
            const y = 76 - h;
            return (
              <g key={d.date}>
                <line
                  x1={x}
                  y1={76}
                  x2={x}
                  y2={y}
                  stroke={d.count > 0 ? '#d4b76a' : '#2a2a2a'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex justify-between text-[10px] text-text-soft">
          <span>il y a 30 j</span>
          <span>aujourd'hui</span>
        </div>
      </Card>

      {/* Tops */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card>
          <div className="eyebrow mb-3">Top 5 accords</div>
          {tops?.chords.length ? (
            <ul className="space-y-2">
              {tops.chords.map((entry) => {
                const chord = getChord(entry.name);
                return (
                  <li key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold text-gold">
                        {entry.name}
                      </span>
                      {chord && (
                        <span className="text-[10px] uppercase tracking-wider text-text-soft">
                          {chord.quality}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm text-text-muted">
                      {entry.count}×
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-text-soft">
              Pas encore de session — marque ta première pratique depuis le Dashboard.
            </p>
          )}
        </Card>

        <Card>
          <div className="eyebrow mb-3">Top 5 gammes</div>
          {tops?.scales.length ? (
            <ul className="space-y-2">
              {tops.scales.map((entry) => {
                const scale = getScale(entry.name as Parameters<typeof getScale>[0]);
                return (
                  <li key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-gold">
                        {scale?.shortName ?? entry.name}
                      </span>
                      {scale && (
                        <span className="text-[10px] uppercase tracking-wider text-text-soft">
                          {scale.category}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm text-text-muted">
                      {entry.count}×
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-text-soft">Pas encore de session.</p>
          )}
        </Card>
      </div>
    </>
  );
}
