import { Card } from '@/components/ui/Card';
import { usePrefs } from '@/stores/prefsStore';
import { TUNING_LABELS, type TuningId } from '@/lib/theory';
import { db } from '@/lib/db';

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
      <h1 className="display mb-9 text-display-md">Préférences</h1>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h3 className="display text-display-sm mb-3">Accordage par défaut</h3>
          <select
            value={prefs.tuning}
            onChange={(e) => prefs.setTuning(e.target.value as TuningId)}
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
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
            min={0}
            max={12}
            value={prefs.capo}
            onChange={(e) => prefs.setCapo(parseInt(e.target.value) || 0)}
            className="h-10 w-24 rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
          />
        </Card>

        <Card>
          <h3 className="display text-display-sm mb-3">Audio</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Activer le son au clic</span>
              <input
                type="checkbox"
                checked={prefs.audioEnabled}
                onChange={prefs.toggleAudio}
                className="h-5 w-5 accent-[#d4b76a]"
              />
            </label>
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
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Afficher les noms de notes sur le manche</span>
              <input
                type="checkbox"
                checked={prefs.showNoteNames}
                onChange={prefs.toggleNoteNames}
                className="h-5 w-5 accent-[#d4b76a]"
              />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="display text-display-sm mb-3">Export / Reset</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={exportLib}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5"
            >
              Exporter ma bibliothèque (JSON)
            </button>
            <button
              onClick={clearAll}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-danger/40 px-4 text-sm text-danger hover:bg-danger/5"
            >
              Vider la bibliothèque
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
