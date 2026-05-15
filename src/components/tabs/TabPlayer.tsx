/**
 * TabPlayer — TabReader + transport (play / pause / reset / tempo).
 *
 * Audio : schedule chaque note via setTimeout sur la chaîne useAudio
 * (playMidi). Loop optionnelle (par défaut OFF — joue 1 fois et stoppe).
 *
 * Le curseur visuel suit le beat absolu en cours, transmis à TabReader
 * pour highlight la note active.
 */
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { TabReader } from './TabReader';
import { flattenTab, tabNoteToMidi, type Tab } from '@/lib/tabsDatabase';
import { useAudio } from '@/hooks/useAudio';

interface TabPlayerProps {
  tab: Tab;
  /** Si true, la lecture loop indéfiniment. Défaut false. */
  loop?: boolean;
}

export function TabPlayer({ tab, loop = false }: TabPlayerProps) {
  const { playMidi } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(tab.tempo);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!playing) {
      cancelRef.current = true;
      setActiveBeat(null);
      return;
    }
    cancelRef.current = false;
    const flat = flattenTab(tab);
    if (flat.length === 0) {
      setPlaying(false);
      return;
    }
    // beatMs = durée d'une 16e à ce tempo
    // tempo BPM = noires par minute → 1 noire = 60/BPM secondes
    // 1 noire = 4 doubles-croches → 1 16e = 60/(BPM*4) = 15000/BPM ms
    const beatMs = 15000 / tempo;

    (async () => {
      let cycleCount = 0;
      do {
        for (const note of flat) {
          if (cancelRef.current) break;
          // Attendre jusqu'au startBeat absolu de la note
          // (gestion simple : on calcule le delta depuis la note précédente)
          setActiveBeat(note.absoluteBeat);
          const midi = tabNoteToMidi(note);
          void playMidi(midi);
          // Wait note.duration en 16e avant la prochaine
          await new Promise((r) => setTimeout(r, note.duration * beatMs));
        }
        cycleCount++;
      } while (loop && !cancelRef.current && cycleCount < 32);
      if (!cancelRef.current) {
        setPlaying(false);
        setActiveBeat(null);
      }
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [playing, tab, tempo, loop, playMidi]);

  const handleReset = () => {
    setPlaying(false);
    setActiveBeat(null);
  };

  return (
    <div className="grid gap-4">
      {/* Tab visual */}
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <TabReader tab={tab} activeAbsBeat={activeBeat} />
      </div>

      {/* Transport */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        {/* Tempo */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label-small">Tempo</span>
            <span className="font-mono text-sm font-bold text-gold">{tempo} BPM</span>
          </div>
          <input
            type="range"
            min={40}
            max={200}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="mt-1 flex justify-between text-[10px] text-text-soft">
            <span>40</span>
            <span>{tab.tempo} (original)</span>
            <span>200</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 sm:flex-col">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className={clsx(
              'inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-semibold transition-all',
              playing
                ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
                : 'bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong hover:-translate-y-px'
            )}
          >
            {playing ? (
              <>
                <Pause size={18} fill="currentColor" /> Pause
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Jouer
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-text-muted hover:border-gold-soft hover:text-text"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
