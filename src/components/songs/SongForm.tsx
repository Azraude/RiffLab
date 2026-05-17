import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
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
import { parseTabText } from '@/lib/tabImporter';
import { Plus, Upload, X, Trash2, Wand2, Link as LinkIcon } from 'lucide-react';
import { SectionStrumEditor } from './SectionStrumEditor';
import { UgImportModal } from './UgImportModal';

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

  const [importOpen, setImportOpen] = useState(false);
  const [ugImportOpen, setUgImportOpen] = useState(false);

  const handleImport = (parsed: ReturnType<typeof parseTabText>) => {
    setSong((s) => ({
      ...s,
      title: parsed.title ?? s.title,
      artist: parsed.artist ?? s.artist,
      sections: parsed.sections.length > 0 ? parsed.sections : s.sections,
    }));
    setImportOpen(false);
    setUgImportOpen(false);
  };

  return (
    <div className="grid gap-5">
      {/* Import — 2 options : paste tab ou URL UG */}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-gold bg-gold/5 text-sm font-semibold text-text transition-all hover:bg-gold/10"
        >
          <Upload size={14} className="transition-transform group-hover:-translate-y-0.5" />
          Coller une tab (texte)
        </button>
        <button
          type="button"
          onClick={() => setUgImportOpen(true)}
          className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-gold bg-gold/5 text-sm font-semibold text-text transition-all hover:bg-gold/10"
        >
          <LinkIcon size={14} className="transition-transform group-hover:-translate-y-0.5" />
          Importer URL Ultimate Guitar
        </button>
      </div>

      <TabImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
      <UgImportModal
        open={ugImportOpen}
        onClose={() => setUgImportOpen(false)}
        onImport={handleImport}
      />

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

              <SectionStrumEditor
                value={sec.strumPattern}
                onChange={(strumPattern) => updateSection(sec.id, { strumPattern })}
              />
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

// ─── Tab import modal ────────────────────────────────────────────────

const EXAMPLE_TAB = `Wonderwall
Oasis

[Intro]
Em7  G  Dsus4  A7sus4

[Verse 1]
Em7              G              Dsus4         A7sus4
Today is gonna be the day that they're gonna throw it back to you
Em7              G              Dsus4         A7sus4
By now you should've somehow realised what you gotta do

[Chorus]
C    D    Em7
And all the roads we have to walk are winding`;

function TabImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (parsed: ReturnType<typeof parseTabText>) => void;
}) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof parseTabText> | null>(null);

  const handleParse = () => {
    if (!text.trim()) return;
    setPreview(parseTabText(text));
  };

  const handleConfirm = () => {
    if (!preview) return;
    onImport(preview);
    setText('');
    setPreview(null);
  };

  const handleClose = () => {
    setText('');
    setPreview(null);
    onClose();
  };

  const sectionsCount = preview?.sections.length ?? 0;
  const chordsCount = preview?.allChords.length ?? 0;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
                <motion.div
                  className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface shadow-2xl md:max-w-2xl md:rounded-3xl md:border"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                >
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Fermer"
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
                  >
                    <X size={16} />
                  </button>
                  <div className="px-5 py-6 md:px-8 md:py-8">
                    <Dialog.Title className="display text-display-sm">
                      Importer une tab
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-text-muted">
                      Colle un chord chart depuis Ultimate Guitar / Songsterr /
                      n'importe où. On parse les sections + accords + titre/artiste.
                    </p>

                    <textarea
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setPreview(null);
                      }}
                      placeholder={EXAMPLE_TAB}
                      rows={12}
                      className="mt-4 w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs text-text placeholder:text-text-soft focus:border-gold-soft focus:outline-none"
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleParse}
                        disabled={!text.trim()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-gold bg-gold/5 px-4 text-sm font-semibold text-text hover:bg-gold/10 disabled:opacity-50"
                      >
                        <Wand2 size={14} /> Analyser
                      </button>
                      <button
                        type="button"
                        onClick={() => setText(EXAMPLE_TAB)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-xs text-text-muted hover:text-text"
                      >
                        Voir un exemple
                      </button>
                    </div>

                    {preview && (
                      <div className="mt-5 rounded-xl border border-border-gold bg-gold/5 p-4">
                        <div className="text-sm font-semibold text-text">
                          Aperçu
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-text-muted">
                          {preview.title && (
                            <div>
                              <span className="text-text-soft">Titre :</span>{' '}
                              <span className="text-text">{preview.title}</span>
                            </div>
                          )}
                          {preview.artist && (
                            <div>
                              <span className="text-text-soft">Artiste :</span>{' '}
                              <span className="text-text">{preview.artist}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-text-soft">Sections :</span>{' '}
                            <span className="text-text">{sectionsCount}</span>{' '}
                            <span className="text-text-soft">·</span>{' '}
                            <span className="text-text-soft">Accords uniques :</span>{' '}
                            <span className="font-mono text-gold">{chordsCount}</span>
                          </div>
                          {chordsCount > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {preview.allChords.slice(0, 12).map((c) => (
                                <span key={c} className="chip">{c}</span>
                              ))}
                              {preview.allChords.length > 12 && (
                                <span className="text-text-soft">
                                  +{preview.allChords.length - 12}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleConfirm}
                          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold font-semibold text-bg hover:-translate-y-px"
                        >
                          Remplir le formulaire
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
