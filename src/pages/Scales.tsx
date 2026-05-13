import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Fretboard2D } from '@/components/fretboard/Fretboard2D';
import { SCALES } from '@/lib/scaleDatabase';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import { usePrefs } from '@/stores/prefsStore';

export function Scales() {
  const [key, setKey] = useState<NoteName>('A');
  const [scaleId, setScaleId] = useState(SCALES[2].id); // penta_minor default
  const tuning = usePrefs((s) => s.tuning);
  const showNoteNames = usePrefs((s) => s.showNoteNames);
  const toggleNoteNames = usePrefs((s) => s.toggleNoteNames);

  const current = SCALES.find((s) => s.id === scaleId)!;

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display text-display-md">Gammes</h1>
          <p className="mt-1 text-text-muted">
            Visualise n'importe quelle gamme sur le manche dans la tonalité de ton choix.
          </p>
        </div>
      </div>

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
          <button
            onClick={toggleNoteNames}
            className="h-10 self-end rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5"
          >
            {showNoteNames ? 'Masquer noms' : 'Afficher noms'}
          </button>
        </div>

        <div className="mt-6 -mx-2 overflow-x-auto pb-2">
          <Fretboard2D
            tuning={tuning}
            numFrets={15}
            scale={{ key, scaleId }}
            showNoteNames={showNoteNames}
            className="min-w-[640px]"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-xs text-text-muted">
          <Legend color="#d4b76a" label={`Tonique (${key})`} />
          <Legend color="#ffffff" label="Notes de la gamme" />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {SCALES.map((s) => (
          <Card
            key={s.id}
            hover
            className="cursor-pointer"
            onClick={() => setScaleId(s.id)}
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
        ))}
      </div>

      <style>{`
        .select {
          width: 100%;
          height: 40px;
          padding: 0 14px;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
        }
        .select:focus { outline: none; border-color: #9a8454; }
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
