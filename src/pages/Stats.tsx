import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  computeStreak,
  last30DaysPracticed,
  lastYearPracticed,
  bestStreakEver,
  monthVsPreviousMonth,
  topPracticeItems,
} from '@/lib/db';
import { getChord } from '@/lib/chordDatabase';
import { getScale } from '@/lib/scaleDatabase';
import { Flame, TrendingUp, TrendingDown, Trophy, Minus } from 'lucide-react';
import { PracticeHeatmap } from '@/components/stats/PracticeHeatmap';

export function Stats() {
  const streak = useLiveQuery(() => computeStreak(), []);
  const tops = useLiveQuery(() => topPracticeItems(5), []);
  const days = useLiveQuery(() => last30DaysPracticed(), []);
  const yearDays = useLiveQuery(() => lastYearPracticed(), []);
  const bestStreak = useLiveQuery(() => bestStreakEver(), []);
  const monthCmp = useLiveQuery(() => monthVsPreviousMonth(), []);

  const maxCount = Math.max(1, ...(days ?? []).map((d) => d.count));

  return (
    <>
      <PageHeader
        title="Stats"
        subtitle="Tes données de pratique depuis le début."
      />

      <div className="grid gap-5 md:grid-cols-4">
        <Card>
          <div className="label-small">Série actuelle</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="display text-display-lg text-gold">{streak ?? 0}</div>
            {(streak ?? 0) > 0 && (
              <Flame
                size={22}
                className="text-gold-bright"
                fill="currentColor"
                style={{ filter: 'drop-shadow(0 0 4px rgb(var(--gold-glow) / 0.5))' }}
              />
            )}
          </div>
          <div className="mt-1 text-xs text-text-soft">
            jour{(streak ?? 0) > 1 ? 's' : ''} d'affilée
          </div>
        </Card>

        <Card>
          <div className="label-small flex items-center gap-1">
            <Trophy size={11} className="text-gold-soft" /> Record
          </div>
          <div className="display text-display-lg mt-2 text-gold">
            {bestStreak ?? 0}
          </div>
          <div className="mt-1 text-xs text-text-soft">meilleure série jamais</div>
        </Card>

        <Card>
          <div className="label-small">Total sessions</div>
          <div className="display text-display-lg mt-2 text-gold">
            {tops?.totalSessions ?? 0}
          </div>
          <div className="mt-1 text-xs text-text-soft">depuis toujours</div>
        </Card>

        <Card>
          <div className="label-small">Cette semaine</div>
          <div className="display text-display-lg mt-2 text-gold">
            {days ? days.slice(-7).filter((d) => d.count > 0).length : 0}
            <span className="text-display-sm text-text-muted">/7</span>
          </div>
          <div className="mt-1 text-xs text-text-soft">jours pratiqués</div>
        </Card>
      </div>

      {/* Comparaison mois sur mois */}
      {monthCmp && (
        <Card className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="eyebrow">Ce mois vs mois précédent</div>
              <div className="mt-2 flex items-baseline gap-3">
                <div className="display text-display-md text-gold">
                  {monthCmp.current.uniqueDays}
                </div>
                <span className="text-sm text-text-muted">
                  jour{monthCmp.current.uniqueDays > 1 ? 's' : ''} ce mois (
                  {monthCmp.previous.uniqueDays} le mois précédent)
                </span>
              </div>
            </div>
            <MonthDelta diff={monthCmp.diff} diffPct={monthCmp.diffPct} />
          </div>
        </Card>
      )}

      {/* Heatmap calendaire 365 jours */}
      <Card className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="eyebrow">Année calendaire</div>
          <div className="text-xs text-text-soft">
            {yearDays ? yearDays.filter((d) => d.count > 0).length : 0} jours sur 365
          </div>
        </div>
        {yearDays && yearDays.length > 0 ? (
          <PracticeHeatmap days={yearDays} />
        ) : (
          <div className="py-6 text-center text-sm text-text-soft">
            Pas encore de pratique enregistrée.
          </div>
        )}
      </Card>

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

function MonthDelta({ diff, diffPct }: { diff: number; diffPct: number }) {
  if (diff === 0) {
    return (
      <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 text-sm text-text-muted">
        <Minus size={14} />
        Égal
      </div>
    );
  }
  const isPositive = diff > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <div
      className={
        'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ' +
        (isPositive
          ? 'border-success/40 bg-success/15 text-success'
          : 'border-danger/40 bg-danger/15 text-danger')
      }
    >
      <Icon size={14} />
      {isPositive ? '+' : ''}
      {diff} ({isPositive ? '+' : ''}
      {diffPct}%)
    </div>
  );
}
