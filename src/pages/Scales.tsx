import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Fretboard2D } from '@/components/fretboard/Fretboard2D';
import { Fretboard3DLazy } from '@/components/three/Fretboard3DLazy';
import { TiltCard } from '@/components/ui/TiltCard';
import { SCALES } from '@/lib/scaleDatabase';
import { markInteraction } from '@/lib/db';
import { NOTE_NAMES, type NoteName, type ScaleId } from '@/lib/theory';
import { usePrefs } from '@/stores/prefsStore';
import { SKIN_LIST } from '@/lib/fretboardSkins';
import { Box, Square } from 'lucide-react';
import clsx from 'clsx';

export function Scales() {
  const [key, setKey] = useState<NoteName>('A');
  const [scaleId, setScaleId] = useState(SCALES[2].id); // penta_minor default
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const tuning = usePrefs((s) => s.tuning);
  const showNoteNames = usePrefs((s) => s.showNoteNames);
  const toggleNoteNames = usePrefs((s) => s.toggleNoteNames);
  const fretboardSkin = usePrefs((s) => s.fretboardSkin);
  const setFretboardSkin = usePrefs((s) => s.setFretboardSkin);

  const current = SCALES.find((s) => s.id === scaleId)!;

  return (
    <>
      <PageHeader
        title="Gammes"
        subtitle="Visualise n'importe quelle gamme sur le manche dans la tonalité de ton choix."
      />

      <Card className="mb-8">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="Tonalité">
            <select
              value={key}
              onChange={(e) => setKey(e.target.value as NoteName)}
              className="select"
            >
              {NOTE_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gamme">
            <select
              value={scaleId}
              onChange={(e) => setScaleId(e.target.value as typeof scaleId)}
              className="select"
            >
              {SCALES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-2 self-end">
            {/* Toggle 2D / 3D — off par défaut, 2D = vue de travail */}
            <div className="inline-flex rounded-xl border border-border-gold p-0.5">
              <button
                type="button"
                onClick={() => setView('2d')}
                aria-pressed={view === '2d'}
                className={clsx(
                  'inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors md:h-9',
                  view === '2d' ? 'bg-gold text-bg' : 'text-text-muted hover:text-text'
                )}
                title="Vue plate, idéale pour scanner les notes"
              >
                <Square size={14} /> 2D
              </button>
              <button
                type="button"
                onClick={() => setView('3d')}
                aria-pressed={view === '3d'}
                className={clsx(
                  'inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors md:h-9',
                  view === '3d' ? 'bg-gold text-bg' : 'text-text-muted hover:text-text'
                )}
                title="Vue 3D décorative (la 2D reste recommandée pour le travail)"
              >
                <Box size={14} /> 3D
              </button>
            </div>
            <button
              onClick={toggleNoteNames}
              className="h-11 rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5 md:h-10"
            >
              {showNoteNames ? 'Masquer noms' : 'Afficher noms'}
            </button>
          </div>
        </div>

        {/* Live skin switcher — horizontal scroll on mobile */}
        <div className="mt-6 -mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            {SKIN_LIST.map((s) => (
              <button
                key={s.id}
                onClick={() => setFretboardSkin(s.id)}
                aria-pressed={fretboardSkin === s.id}
                className={clsx(
                  'inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors',
                  fretboardSkin === s.id
                    ? 'border-gold bg-gold text-bg'
                    : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                )}
              >
                {s.short}
              </button>
            ))}
          </div>
        </div>

        {view === '2d' ? (
          <div className="relative mt-4 -mx-2 overflow-x-auto pb-2">
            <Fretboard2D
              tuning={tuning}
              numFrets={15}
              scale={{ key, scaleId }}
              showNoteNames={showNoteNames}
              skin={fretboardSkin}
              className="min-w-[640px]"
            />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-surface to-transparent md:hidden" />
          </div>
        ) : (
          <div className="mt-4">
            <Fretboard3DLazy
              tuning={tuning}
              numFrets={15}
              scaleKey={key}
              scaleId={scaleId as ScaleId}
            />
            <p className="mt-2 text-center text-xs text-text-soft">
              Vue 3D décorative — la 2D reste recommandée pour le scan rapide en répèt.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-5 text-xs text-text-muted">
          <Legend color="#d4b76a" label={`Tonique (${key})`} />
          <Legend color="#ffffff" label="Notes de la gamme" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {SCALES.map((s) => (
          <TiltCard key={s.id}>
            <Card
              hover
              className="cursor-pointer"
              onClick={() => {
                setScaleId(s.id);
                void markInteraction('scale', s.id);
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="display text-display-sm">{s.name}</h3>
                {scaleId === s.id && (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                    Actif
                  </span>
                )}
              </div>
              <div className="mt-1 font-mono text-sm text-gold">{s.intervals}</div>
              <p className="mt-3 text-sm text-text-muted">{s.mood}</p>
              <p className="mt-2 text-xs text-text-soft">{s.example}</p>
            </Card>
          </TiltCard>
        ))}
      </div>

      <style>{`
        .select {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
        }
        .select:focus { outline: none; border-color: #9a8454; }
        @media (min-width: 768px) {
          .select { height: 40px; }
        }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-small mb-2">{label}</div>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color, border: color === '#ffffff' ? '1px solid #404040' : 'none' }}
      />
      {label}
    </span>
  );
}
