import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { usePrefs } from '@/stores/prefsStore';
import {
  GOAL_OPTIONS,
  generatePlan,
  getCurrentDayNumber,
  totalPlannedMinutes,
  completedMinutes,
  planProgress,
  type PracticeGoal,
} from '@/lib/practicePlan';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Flame,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';

const MINUTES_OPTIONS = [5, 10, 15] as const;
const DAYS_PER_WEEK_OPTIONS = [3, 5, 7] as const;

/**
 * /practice-plan — onboarding 3 questions ou affichage du plan actif.
 *
 * Le plan est stocké dans Zustand (persist), pas Dexie. Génération
 * déterministe par seed (goal + minutes + days/week + startDate).
 */
export function PracticePlan() {
  const plan = usePrefs((s) => s.practicePlan);
  const setPracticePlan = usePrefs((s) => s.setPracticePlan);

  if (!plan) return <Onboarding onCreate={setPracticePlan} />;
  return <PlanView />;
}

// ─── Onboarding ───────────────────────────────────────────────────────

function Onboarding({
  onCreate,
}: {
  onCreate: (plan: ReturnType<typeof generatePlan>) => void;
}) {
  const [goal, setGoal] = useState<PracticeGoal | null>(null);
  const [minutes, setMinutes] = useState<5 | 10 | 15>(10);
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 5 | 7>(5);

  const canSubmit = goal !== null;

  const handleSubmit = () => {
    if (!goal) return;
    const plan = generatePlan({ goal, minutesPerDay: minutes, daysPerWeek });
    onCreate(plan);
  };

  return (
    <>
      <PageHeader
        title="Practice Plan"
        subtitle="3 questions et on te génère un plan de 4 semaines, adapté à ton objectif."
      />

      <div className="grid gap-6">
        {/* Étape 1 : objectif */}
        <section>
          <div className="eyebrow mb-3">1. Ton objectif principal</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {GOAL_OPTIONS.map((g) => {
              const isActive = goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  aria-pressed={isActive}
                  className={clsx(
                    'rounded-2xl border p-4 text-left transition-all',
                    isActive
                      ? 'border-gold bg-gold/10 shadow-gold'
                      : 'border-border bg-surface hover:border-gold-soft hover:bg-gold/5'
                  )}
                >
                  <div className={clsx('font-semibold', isActive ? 'text-gold' : 'text-text')}>
                    {g.label}
                  </div>
                  <div className="mt-1 text-xs text-text-muted">{g.description}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Étape 2 : minutes/jour */}
        <section>
          <div className="eyebrow mb-3">2. Combien de minutes par jour ?</div>
          <div className="grid grid-cols-3 gap-2">
            {MINUTES_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                aria-pressed={minutes === m}
                className={clsx(
                  'flex flex-col items-center justify-center rounded-2xl border py-4 transition-all',
                  minutes === m
                    ? 'border-gold bg-gold/10 text-gold shadow-gold'
                    : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                )}
              >
                <span className="display text-display-sm">{m}</span>
                <span className="text-xs">min / jour</span>
              </button>
            ))}
          </div>
        </section>

        {/* Étape 3 : fréquence */}
        <section>
          <div className="eyebrow mb-3">3. Combien de jours par semaine ?</div>
          <div className="grid grid-cols-3 gap-2">
            {DAYS_PER_WEEK_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysPerWeek(d)}
                aria-pressed={daysPerWeek === d}
                className={clsx(
                  'flex flex-col items-center justify-center rounded-2xl border py-4 transition-all',
                  daysPerWeek === d
                    ? 'border-gold bg-gold/10 text-gold shadow-gold'
                    : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                )}
              >
                <span className="display text-display-sm">{d}</span>
                <span className="text-xs">jours / sem</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-soft">
            {daysPerWeek === 3 && 'Lundi, mercredi, vendredi'}
            {daysPerWeek === 5 && 'Lundi → vendredi, week-end OFF'}
            {daysPerWeek === 7 && 'Tous les jours — engagement total'}
          </p>
        </section>

        {/* CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={clsx(
            'inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all',
            canSubmit
              ? 'bg-gold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px'
              : 'bg-surface-2 text-text-soft opacity-50'
          )}
        >
          <Sparkles size={18} />
          Générer mon plan 4 semaines
        </button>
      </div>
    </>
  );
}

// ─── Plan view ────────────────────────────────────────────────────────

function PlanView() {
  const plan = usePrefs((s) => s.practicePlan)!;
  const toggleActivityDone = usePrefs((s) => s.toggleActivityDone);
  const setPracticePlan = usePrefs((s) => s.setPracticePlan);

  const [viewWeek, setViewWeek] = useState<number>(() => {
    const dayNum = getCurrentDayNumber(plan);
    return dayNum ? Math.ceil(dayNum / 7) : 1;
  });

  const currentDay = getCurrentDayNumber(plan);
  const progress = planProgress(plan);
  const totalMin = totalPlannedMinutes(plan);
  const doneMin = completedMinutes(plan);

  const goalLabel = useMemo(
    () => GOAL_OPTIONS.find((g) => g.id === plan.goal)?.label ?? plan.goal,
    [plan.goal]
  );

  const weekDays = plan.days.slice((viewWeek - 1) * 7, viewWeek * 7);
  const todayActivities =
    currentDay !== null
      ? plan.days.find((d) => d.dayNumber === currentDay)
      : null;

  const handleReset = () => {
    if (confirm('Supprimer ce plan et en créer un nouveau ?')) {
      setPracticePlan(null);
    }
  };

  const handleRegenerate = () => {
    if (
      confirm(
        'Régénérer le plan en gardant le même objectif ? Tu perdras les coches actuelles.'
      )
    ) {
      const fresh = generatePlan({
        goal: plan.goal,
        minutesPerDay: plan.minutesPerDay,
        daysPerWeek: plan.daysPerWeek,
        startDate: new Date().toISOString().slice(0, 10),
      });
      setPracticePlan(fresh);
    }
  };

  return (
    <>
      <PageHeader title="Practice Plan" subtitle={`Objectif : ${goalLabel}`}>
        <button
          type="button"
          onClick={handleRegenerate}
          aria-label="Régénérer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted hover:text-text"
        >
          <RefreshCw size={16} />
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Supprimer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-muted hover:text-danger"
        >
          <Trash2 size={16} />
        </button>
      </PageHeader>

      {/* Stats globales */}
      <Card className="mb-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="label-small">Avancement</div>
            <div className="display mt-1 text-display-sm text-gold">{progress}%</div>
            <div className="mt-0.5 text-xs text-text-soft">du plan terminé</div>
          </div>
          <div>
            <div className="label-small">Pratiqué</div>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="display text-display-sm text-gold">{doneMin}</span>
              <span className="text-sm text-text-soft">/ {totalMin} min</span>
            </div>
            <div className="mt-0.5 text-xs text-text-soft">total prévu</div>
          </div>
          <div>
            <div className="label-small">Jour</div>
            <div className="display mt-1 text-display-sm text-gold-soft">
              {currentDay ?? '—'}
              <span className="text-display-sm text-text-soft">/28</span>
            </div>
            <div className="mt-0.5 text-xs text-text-soft">
              {currentDay ? 'en cours' : 'pas commencé'}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-gradient-to-r from-gold-soft to-gold-bright transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Today's session (si on est dans le plan) */}
      {todayActivities && (
        <Card glow className="mb-5">
          <div className="flex items-center gap-2 text-gold">
            <Flame size={18} />
            <span className="eyebrow !text-gold">Aujourd'hui · Jour {currentDay}</span>
          </div>
          {todayActivities.rest ? (
            <div className="mt-3">
              <h2 className="display text-display-sm">Jour de repos</h2>
              <p className="mt-1 text-sm text-text-muted">
                Recharge les batteries. Le travail mental compte aussi — écoute de la
                musique active, regarde un guitariste que tu admires.
              </p>
            </div>
          ) : (
            <>
              <h2 className="display mt-2 text-display-sm">Ta séance du jour</h2>
              <div className="mt-3 grid gap-2">
                {todayActivities.activities.map((a) => (
                  <ActivityRow
                    key={a.templateId}
                    activity={a}
                    onToggle={() => toggleActivityDone(currentDay!, a.templateId)}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Week selector */}
      <div className="mb-4">
        <div className="label-small mb-2">Semaine</div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setViewWeek(w)}
              aria-pressed={viewWeek === w}
              className={clsx(
                'inline-flex h-10 items-center justify-center rounded-full border text-xs font-medium uppercase tracking-wider transition-colors',
                viewWeek === w
                  ? 'border-gold bg-gold text-bg'
                  : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
              )}
            >
              Sem. {w}
            </button>
          ))}
        </div>
      </div>

      {/* Days of the selected week */}
      <div className="grid gap-3">
        {weekDays.map((day) => {
          const isToday = currentDay === day.dayNumber;
          const allDone =
            !day.rest &&
            day.activities.length > 0 &&
            day.activities.every((a) => a.done);
          return (
            <div
              key={day.dayNumber}
              className={clsx(
                'rounded-2xl border p-4 transition-all',
                isToday
                  ? 'border-gold bg-gold/5 shadow-gold'
                  : day.rest
                    ? 'border-border bg-surface opacity-70'
                    : 'border-border bg-surface'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={16}
                    className={isToday ? 'text-gold' : 'text-text-soft'}
                  />
                  <span
                    className={clsx(
                      'text-sm font-semibold',
                      isToday ? 'text-gold' : day.rest ? 'text-text-soft' : 'text-text'
                    )}
                  >
                    Jour {day.dayNumber}
                    {isToday && ' · aujourd\'hui'}
                  </span>
                </div>
                {day.rest && (
                  <span className="text-xs uppercase tracking-wider text-text-soft">
                    Repos
                  </span>
                )}
                {allDone && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                    <Check size={12} strokeWidth={3} /> Validée
                  </span>
                )}
              </div>
              {!day.rest && (
                <div className="mt-3 grid gap-1.5">
                  {day.activities.map((a) => (
                    <ActivityRow
                      key={a.templateId}
                      activity={a}
                      compact
                      onToggle={() => toggleActivityDone(day.dayNumber, a.templateId)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function ActivityRow({
  activity,
  compact = false,
  onToggle,
}: {
  activity: ReturnType<typeof generatePlan>['days'][number]['activities'][number];
  compact?: boolean;
  onToggle: () => void;
}) {
  const done = !!activity.done;
  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors',
        done
          ? 'border-success/40 bg-success/5'
          : 'border-border bg-surface-2'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? 'Décocher' : 'Cocher comme fait'}
        className={clsx(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
          done
            ? 'border-success bg-success text-bg'
            : 'border-border-gold bg-transparent hover:bg-gold/5'
        )}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'font-semibold',
              compact ? 'text-sm' : 'text-base',
              done && 'text-text-soft line-through'
            )}
          >
            {activity.title}
          </span>
          <span className="font-mono text-xs text-text-soft">{activity.minutes}min</span>
        </div>
        {!compact && activity.detail && (
          <p className="mt-0.5 text-xs text-text-muted">{activity.detail}</p>
        )}
      </div>
      {activity.route && (
        <Link
          to={activity.route}
          aria-label="Lancer l'activité"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-muted hover:border-gold hover:text-gold"
        >
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
