import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import {
  emptySong,
  newSectionId,
  saveSong,
  type Section,
  type Song,
  type ChordRef,
} from '@/lib/db';
import { NOTE_NAMES, TUNING_LABELS, type NoteName, type TuningId } from '@/lib/theory';
import { CHORDS } from '@/lib/chordDatabase';
import { Plus, X, Trash2 } from 'lucide-react';

const COMMON_CHORDS = CHORDS.map((c) => c.name);

export function SongNew() {
  const navigate = useNavigate();
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
    navigate(`/songs/${song.id}`);
  };

  return (
    <>
      <Link to="/songs" className="text-sm text-text-muted hover:text-gold">
        ← Retour aux sons
      </Link>
      <h1 className="display mt-4 text-display-md">Nouveau son</h1>

      <div className="mt-8 grid gap-5">
        {/* Identité */}
        <Card>
          <div className="eyebrow mb-4">Identité</div>
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
        </Card>

        {/* Réglages musicaux */}
        <Card>
          <div className="eyebrow mb-4">Réglages</div>
          <div className="grid gap-4 md:grid-cols-4">
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
        </Card>

        {/* Sections */}
        <div className="flex items-center justify-between">
          <h2 className="display text-display-sm">Sections</h2>
          <button
            onClick={addSection}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-gold px-3 text-sm hover:bg-gold/5"
          >
            <Plus size={14} /> Section
          </button>
        </div>

        {song.sections.map((sec) => (
          <Card key={sec.id}>
            <div className="mb-4 flex items-center gap-3">
              <input
                type="text"
                value={sec.name}
                onChange={(e) => updateSection(sec.id, { name: e.target.value })}
                className="display flex-1 bg-transparent text-display-sm outline-none focus:border-b focus:border-gold-soft"
              />
              {song.sections.length > 1 && (
                <button
                  onClick={() => removeSection(sec.id)}
                  className="rounded p-1.5 text-text-soft hover:bg-surface-2 hover:text-danger"
                  aria-label="Supprimer la section"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {sec.chords.map((c, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-2 rounded-lg border border-border-gold bg-gold/5 px-3 py-1.5"
                >
                  <span className="font-mono text-sm font-bold text-gold">{c.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={c.beats}
                    onChange={(e) =>
                      updateChord(sec.id, i, { beats: parseInt(e.target.value) || 1 })
                    }
                    className="w-10 bg-transparent text-xs text-text-muted outline-none"
                    title="Nombre de temps"
                  />
                  <button
                    onClick={() => removeChord(sec.id, i)}
                    className="text-text-soft hover:text-danger"
                    aria-label="Retirer l'accord"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-text-soft">+ ajouter :</span>
              {COMMON_CHORDS.slice(0, 20).map((name) => (
                <button
                  key={name}
                  onClick={() => addChord(sec.id, name)}
                  className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-text-muted hover:border-gold-soft hover:text-gold"
                >
                  {name}
                </button>
              ))}
            </div>
          </Card>
        ))}

        <div className="flex justify-end gap-3 py-4">
          <Link
            to="/songs"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text"
          >
            Annuler
          </Link>
          <button
            onClick={submit}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Field components ─────────────────────────────────────────
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
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm placeholder:text-text-soft focus:border-gold-soft focus:outline-none"
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
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
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
        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
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
