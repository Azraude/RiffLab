import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toggle } from '@/components/ui/Toggle';
import { useMetronome } from '@/stores/metronomeStore';
import { Play, Square, Smartphone, Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

export function Metronome() {
  const bpm = useMetronome((s) => s.bpm);
  const running = useMetronome((s) => s.running);
  const currentBeat = useMetronome((s) => s.currentBeat);
  const beatsPerMeasure = useMetronome((s) => s.beatsPerMeasure);
  const vibrateOnDownbeat = useMetronome((s) => s.vibrateOnDownbeat);
  const setBpm = useMetronome((s) => s.setBpm);
  const toggle = useMetronome((s) => s.toggle);
  const toggleVibrate = useMetronome((s) => s.toggleVibrate);

  return (
    <>
      <PageHeader
        title="Métronome"
        subtitle="Garde le tempo. Tape Démarrer, ajuste le BPM en live."
      />

      <Card className="mx-auto max-w-2xl">
        {/* BPM display */}
        <div className="text-center">
          <div className="label-small">Tempo</div>
          <div className="display mt-2 leading-none text-gold text-gold-glow text-[96px] md:text-[128px]">
            {bpm}
          </div>
          <div className="label-small mt-2">BPM</div>
        </div>

        {/* −/+ buttons + slider */}
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBpm(bpm - 1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted hover:border-gold-soft hover:text-text active:scale-95"
            aria-label="Diminuer le tempo"
          >
            <Minus size={18} />
          </button>
          <input
            type="range"
            min={40}
            max={220}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="metronome-slider flex-1"
            aria-label="Tempo BPM"
          />
          <button
            type="button"
            onClick={() => setBpm(bpm + 1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted hover:border-gold-soft hover:text-text active:scale-95"
            aria-label="Augmenter le tempo"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="mt-1 flex justify-between px-12 text-xs text-text-soft">
          <span>40</span>
          <span>220</span>
        </div>

        {/* Beat indicator (4 LEDs, le 1 plus brillant) */}
        <div className="mt-10 flex justify-center gap-4" aria-hidden>
          {Array.from({ length: beatsPerMeasure }).map((_, i) => {
            const active = running && currentBeat === i;
            const isDownbeat = i === 0;
            return (
              <div
                key={i}
                className={clsx(
                  'rounded-full transition-all duration-100 ease-out',
                  active
                    ? isDownbeat
                      ? 'h-8 w-8 bg-gold shadow-gold-strong'
                      : 'h-6 w-6 bg-gold-soft shadow-gold'
                    : isDownbeat
                      ? 'h-7 w-7 border border-border-gold bg-transparent'
                      : 'h-5 w-5 border border-border bg-transparent'
                )}
              />
            );
          })}
        </div>
        <div className="mt-2 text-center text-[10px] uppercase tracking-[2px] text-text-soft">
          {beatsPerMeasure}/4
        </div>

        {/* Start/Stop tap-friendly button */}
        <button
          type="button"
          onClick={toggle}
          className={clsx(
            'mt-10 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-semibold transition-all ease-out-quart active:scale-[0.99]',
            running
              ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
              : 'bg-gold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px'
          )}
          aria-pressed={running}
        >
          {running ? (
            <>
              <Square size={20} fill="currentColor" /> Arrêter
            </>
          ) : (
            <>
              <Play size={20} fill="currentColor" /> Démarrer
            </>
          )}
        </button>

        {/* Vibrate toggle */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
          <span className="flex items-center gap-2 text-sm">
            <Smartphone size={16} className="text-text-soft" />
            Vibration sur le 1 (mobile)
          </span>
          <Toggle checked={vibrateOnDownbeat} onChange={toggleVibrate} />
        </div>
      </Card>

      <style>{`
        .metronome-slider {
          appearance: none;
          -webkit-appearance: none;
          height: 8px;
          background: linear-gradient(
            to right,
            rgba(212, 183, 106, 0.5),
            rgba(154, 132, 84, 0.3)
          );
          border-radius: 999px;
          outline: none;
          cursor: pointer;
        }
        .metronome-slider::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f5d97a, #d4b76a 60%, #9a8454);
          border: 2px solid #0a0a0a;
          box-shadow: 0 0 12px rgba(245, 217, 122, 0.45);
          cursor: pointer;
        }
        .metronome-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(180deg, #f5d97a, #d4b76a 60%, #9a8454);
          border: 2px solid #0a0a0a;
          box-shadow: 0 0 12px rgba(245, 217, 122, 0.45);
          cursor: pointer;
        }
        .metronome-slider:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px rgba(245, 217, 122, 0.25),
            0 0 12px rgba(245, 217, 122, 0.6);
        }
      `}</style>
    </>
  );
}
