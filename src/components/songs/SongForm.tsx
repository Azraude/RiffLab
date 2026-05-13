import { useState } from 'react';
import {
  emptySong,
  newSectionId,
  saveSong,
  type Section,
  type Song,
  type ChordRef,
} from '@/lib/db';
import { NOTE_NAMES, TUNING_LABELS, type NoteName, type TuningId } from '@/lib/theory';
import { COMMON_CHORD_NAMES } from '@/lib/chordDatabase';
import { Plus, X, Trash2 } from 'lucide-react';

interface SongFormProps {
  /** Appelé après save réussi avec l'id du song créé. */
  onSaved: (songId: string) => void;
  /** Appelé quand l'utilisateur annule. */
  onCancel: () => void;
}

// Keeps the focused input visible above the mobile keyboard.
function focusScroll(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

export function SongForm({ onSaved, onCancel }: SongFormProps) {
  const [song, setSong] = useState<Song>(() => emptySong());

  const update = <K extends keyof Song>(key: K, val: Song[K]) =>
    setSong((s) => ({ ...s, [key]: val }));

  const addSection = () =>
    setSong((s) => ({
      ...s,
      sections: [
        ...s.sections,
        { id: newSectionId(), name: 'Nouvelle section', chords: [] },
      ],
    }));

  const removeSection = (id: string) =>
    setSong((s) => ({ ...s, sections: s.sections.filter((sec) => sec.id !== id) }));

  const updateSection = (id: string, patch: Partial<Section>) =>
    setSong((s) => ({
      ...s,
      sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec)),
    }));

  const addChord = (sectionId: string, chordName: string) => {
    if (!chordName) return;
    setSong((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, chords: [...sec.chords, { name: chordName, beats: 4 }] }
          : sec
      ),
    }));
  };

  const removeChord = (sectionId: string, idx: number) => {
    setSong((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, chords: sec.chords.filter((_, i) => i !== idx) }
          : sec
      ),
    }));
  };

  const updateChord = (sectionId: string, idx: number, patch: Partial<ChordRef>) => {
    setSong((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              chords: sec.chords.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
            }
          : sec
      ),
    }));
  };

  const submit = async () => {
    if (!song.title.trim()) {
      alert('Donne un titre à ton son.');
      return;
    }
    await saveSong(song);
    onSaved(song.id);
  };

  return (
    <div className="grid gap-5">
      {/* Identité */}
      <section>
        <div className="eyebrow mb-3">Identité</div>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldText
            label="Titre"
            value={song.title}
            onChange={(v) => update('title', v)}
            placeholder="ex: Wonderwall"
          />
          <FieldText
            label="Artiste"
            value={song.artist ?? ''}
            onChange={(v) => update('artist', v)}
            placeholder="ex: Oasis"
          />
        </div>
      </section>

      {/* Réglages musicaux */}
      <section>
        <div className="eyebrow mb-3">Réglages</div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <FieldSelect
            label="Tonalité"
            value={song.key}
            onChange={(v) => update('key', v as NoteName)}
            options={NOTE_NAMES.map((n) => ({ value: n, label: n }))}
          />
          <FieldSelect
            label="Mode"
            value={song.mode}
            onChange={(v) => update('mode', v as 'major' | 'minor')}
            options={[
              { value: 'major', label: 'Majeur' },
              { value: 'minor', label: 'Mineur' },
            ]}
          />
          <FieldNumber
            label="Tempo (BPM)"
            value={song.tempo}
            onChange={(v) => update('tempo', v)}
            min={40}
            max={240}
          />
          <FieldNumber
            label="Capo"
            value={song.capo}
            onChange={(v) => update('capo', v)}
            min={0}
            max={12}
          />
          <FieldSelect
            label="Accordage"
            value={song.tuning}
            onChange={(v) => update('tuning', v as TuningId)}
            options={Object.entries(TUNING_LABELS).map(([id, label]) => ({ value: id, label }))}
          />
          <FieldSelect
            label="Statut"
            value={song.status}
            onChange={(v) => update('status', v as Song['status'])}
            options={[
              { value: 'à bosser', label: 'À bosser' },
              { value: 'intermédiaire', label: 'Intermédiaire' },
              { value: 'maîtrisé', label: 'Maîtrisé' },
            ]}
          />
        </div>
      </section>

      {/* Sections */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="eyebrow">Sections</div>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-gold px-3 text-xs hover:bg-gold/5"
          >
            <Plus size={14} /> Section
          </button>
        </div>

        <div className="grid gap-4">
          {song.sections.map((sec) => (
            <div key={sec.id} className="rounded-xl border border-border bg-surface-2 p-4">
              <div className="mb-3 flex items-center gap-3">
                <input
                  type="text"
                  value={sec.name}
                  onChange={(e) => updateSection(sec.id, { name: e.target.value })}
                  onFocus={focusScroll}
                  aria-label="Nom de la section"
                  className="display flex-1 bg-transparent text-display-sm outline-none focus:border-b focus:border-gold-soft"
                />
                {song.sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(sec.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-danger"
                    aria-label="Supprimer la section"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {sec.chords.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {sec.chords.map((c, i) => (
                    <div
                      key={i}
                      className="group flex h-10 items-center gap-2 rounded-lg border border-border-gold bg-gold/5 px-3"
                    >
                      <span className="font-mono text-sm font-bold text-gold">{c.name}</span>
                      <label className="flex items-center gap-1 text-[10px] text-text-soft">
                        <span aria-hidden>×</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={16}
                          value={c.beats}
                          onChange={(e) =>
                            updateChord(sec.id, i, { beats: parseInt(e.target.value) || 1 })
                          }
                          onFocus={focusScroll}
                          className="w-7 bg-transparent text-xs font-medium text-text-muted outline-none"
                          aria-label="Nombre de temps"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeChord(sec.id, i)}
                        className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-danger"
                        aria-label="Retirer l'accord"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="label-small mb-2">+ ajouter un accord</div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {COMMON_CHORD_NAMES.slice(0, 18).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addChord(sec.id, name)}
                      className="flex h-10 items-center justify-center rounded-lg border border-border bg-surface font-mono text-sm text-text-muted hover:border-gold-soft hover:text-gold"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer actions */}
      <div className="sticky bottom-0 -mx-1 mt-2 flex justify-end gap-3 bg-gradient-to-t from-surface via-surface to-transparent py-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text md:h-10"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─── Field components ─────────────────────────────────────────

const fieldInputClass =
  'h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm placeholder:text-text-soft focus:border-gold-soft focus:outline-none md:h-10';

function FieldText({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="label-small mb-2">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={focusScroll}
        placeholder={placeholder}
        className={fieldInputClass}
      />
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <div className="label-small mb-2">{label}</div>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        onFocus={focusScroll}
        className={fieldInputClass}
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="label-small mb-2">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={focusScroll}
        className={fieldInputClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
