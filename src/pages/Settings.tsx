import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toggle } from '@/components/ui/Toggle';
import { usePrefs } from '@/stores/prefsStore';
import { TUNING_LABELS, type TuningId } from '@/lib/theory';
import { db } from '@/lib/db';
import { SKIN_LIST, type FretboardSkin } from '@/lib/fretboardSkins';
import { Check } from 'lucide-react';
import clsx from 'clsx';

export function Settings() {
  const prefs = usePrefs();

  const exportLib = async () => {
    const songs = await db.songs.toArray();
    const blob = new Blob([JSON.stringify(songs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rifflab-songs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = async () => {
    if (!confirm('Supprimer TOUS tes sons ? Cette action est irréversible.')) return;
    await db.songs.clear();
    alert('Bibliothèque vidée.');
  };

  return (
    <>
      <PageHeader title="Préférences" showSettingsLink={false} />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h3 className="display text-display-sm mb-3">Accordage par défaut</h3>
          <select
            value={prefs.tuning}
            onChange={(e) => prefs.setTuning(e.target.value as TuningId)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none md:h-10"
          >
            {Object.entries(TUNING_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Card>

        <Card>
          <h3 className="display text-display-sm mb-3">Capo par défaut</h3>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={12}
            value={prefs.capo}
            onChange={(e) => prefs.setCapo(parseInt(e.target.value) || 0)}
            className="h-11 w-24 rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none md:h-10"
          />
        </Card>

        <Card>
          <h3 className="display text-display-sm mb-3">Audio</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Activer le son au clic</span>
              <Toggle checked={prefs.audioEnabled} onChange={prefs.toggleAudio} />
            </div>
            <div>
              <div className="label-small mb-1">Volume ({Math.round(prefs.volume * 100)}%)</div>
              <input
                type="range"
                min={0}
                max={100}
                value={prefs.volume * 100}
                onChange={(e) => prefs.setVolume(parseInt(e.target.value) / 100)}
                className="w-full accent-[#d4b76a]"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Afficher les noms de notes sur le manche</span>
              <Toggle checked={prefs.showNoteNames} onChange={prefs.toggleNoteNames} />
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h3 className="display text-display-sm mb-1">Skin du manche</h3>
          <p className="mb-4 text-sm text-text-muted">
            La palette de couleurs du Fretboard. Tu peux aussi switcher en live sur la page Gammes.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SKIN_LIST.map((skin) => (
              <SkinOption
                key={skin.id}
                skin={skin}
                active={prefs.fretboardSkin === skin.id}
                onSelect={() => prefs.setFretboardSkin(skin.id)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="display text-display-sm mb-3">Export / Reset</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={exportLib}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5 md:h-10"
            >
              Exporter ma bibliothèque (JSON)
            </button>
            <button
              onClick={clearAll}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-danger/40 px-4 text-sm text-danger hover:bg-danger/5 md:h-10"
            >
              Vider la bibliothèque
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

/** Skin selector card option — preview swatch + name + check icon when active. */
function SkinOption({
  skin,
  active,
  onSelect,
}: {
  skin: FretboardSkin;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Skin ${skin.name}`}
      className={clsx(
        'group flex flex-col gap-3 rounded-xl border bg-surface-2 p-3 text-left transition-all',
        active
          ? 'border-gold shadow-gold'
          : 'border-border hover:border-gold-soft'
      )}
    >
      <SkinSwatch skin={skin} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text">{skin.name}</div>
          <div className="mt-0.5 line-clamp-2 text-xs text-text-soft">{skin.description}</div>
        </div>
        {active && (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-bg">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}

/** Mini fretboard swatch — 3 strings + 2 frets + 1 inlay to show the palette. */
function SkinSwatch({ skin }: { skin: FretboardSkin }) {
  const gid = `swatch-${skin.id}`;
  return (
    <svg
      viewBox="0 0 240 70"
      width="100%"
      height="56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-board`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin.board[0]} />
          <stop offset="55%" stopColor={skin.board[1]} />
          <stop offset="100%" stopColor={skin.board[2]} />
        </linearGradient>
        <linearGradient id={`${gid}-fret`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={skin.fret[0]} />
          <stop offset="50%" stopColor={skin.fret[1]} />
          <stop offset="100%" stopColor={skin.fret[2]} />
        </linearGradient>
        <linearGradient id={`${gid}-nut`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={skin.nut[0]} />
          <stop offset="50%" stopColor={skin.nut[1]} />
          <stop offset="100%" stopColor={skin.nut[2]} />
        </linearGradient>
        <radialGradient id={`${gid}-pearl`} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0%" stopColor={skin.pearl[0]} />
          <stop offset="55%" stopColor={skin.pearl[1]} />
          <stop offset="100%" stopColor={skin.pearl[2]} />
        </radialGradient>
        <linearGradient id={`${gid}-bass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin.bassString[0]} />
          <stop offset="50%" stopColor={skin.bassString[1]} />
          <stop offset="100%" stopColor={skin.bassString[2]} />
        </linearGradient>
        <linearGradient id={`${gid}-treble`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin.trebleString[0]} />
          <stop offset="50%" stopColor={skin.trebleString[1]} />
          <stop offset="100%" stopColor={skin.trebleString[2]} />
        </linearGradient>
      </defs>
      <rect x="10" y="6" width="220" height="58" rx="3" fill={`url(#${gid}-board)`} />
      <rect x="10" y="6" width="220" height="1.2" fill={skin.bindingTop} />
      <rect x="10" y="62.8" width="220" height="1.2" fill={skin.bindingBottom} />
      <rect x="12" y="6" width="5" height="58" fill={`url(#${gid}-nut)`} rx="0.5" />
      <circle cx="100" cy="35" r="4" fill={`url(#${gid}-pearl)`} />
      <rect x="68" y="6" width="2" height="58" fill={`url(#${gid}-fret)`} />
      <rect x="138" y="6" width="2" height="58" fill={`url(#${gid}-fret)`} />
      <rect x="200" y="6" width="2.2" height="58" fill={`url(#${gid}-fret)`} />
      {/* 3 bass + 3 treble strings, non-scaling stroke for crispness */}
      {[
        { y: 14, w: 1.8, bass: false },
        { y: 22, w: 1.0, bass: false },
        { y: 30, w: 0.9, bass: false },
        { y: 40, w: 1.4, bass: true },
        { y: 50, w: 1.7, bass: true },
        { y: 58, w: 2.0, bass: true },
      ].map((str, i) => (
        <line
          key={i}
          x1="17"
          y1={str.y}
          x2="230"
          y2={str.y}
          stroke={`url(#${gid}-${str.bass ? 'bass' : 'treble'})`}
          strokeWidth={str.w}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
