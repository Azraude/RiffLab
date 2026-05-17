/**
 * UgImportModal — fetch /api/import-ug?url=... pour importer depuis UG.
 *
 * Le user colle une URL Ultimate Guitar, on call la Vercel function qui
 * parse la page et retourne du texte chord-chart. On passe ensuite par
 * parseTabText pour structurer en sections + chord refs.
 *
 * ⚠️ Le endpoint /api/import-ug n'existe qu'en environnement Vercel
 * (prod ou `vercel dev`). En dev local Vite pur, la requête échouera
 * en 404. On affiche un message clair dans ce cas.
 */
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { parseTabText, type TabImportResult } from '@/lib/tabImporter';

type UgImportResult = {
  ok: true;
  source: string;
  title?: string;
  artist?: string;
  capo?: number;
  key?: string;
  body: string;
};

type UgImportError = { ok: false; error: string };

interface UgImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (parsed: TabImportResult) => void;
}

export function UgImportModal({ open, onClose, onImport }: UgImportModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setUrl('');
    setError(null);
    setLoading(false);
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/import-ug?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "La function /api/import-ug n'est dispo qu'en environnement Vercel — pas en dev local Vite.",
          );
        }
        const errData = (await res.json()) as UgImportError;
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as UgImportResult;
      if (!data.ok || !data.body) {
        throw new Error('Aucun contenu chord chart trouvé sur cette page.');
      }
      // Réutilise le parser existant pour structurer en sections
      const fullText = [data.title, data.artist, '', data.body]
        .filter(Boolean)
        .join('\n');
      const parsed = parseTabText(fullText);
      // Préserve titre/artiste de UG si parser n'a pas trouvé
      if (data.title && !parsed.title) parsed.title = data.title;
      if (data.artist && !parsed.artist) parsed.artist = data.artist;
      onImport(parsed);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-x-2 top-1/2 z-50 -translate-y-1/2 rounded-2xl border border-border-gold bg-bg p-6 shadow-gold-strong sm:inset-x-auto sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:translate-y-[-50%]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-gold">
                      <LinkIcon size={18} />
                      <Dialog.Title className="display text-display-sm">
                        Importer depuis Ultimate Guitar
                      </Dialog.Title>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      Colle l'URL de la page UG, on récupère le chord chart.
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Fermer"
                      className="flex h-9 w-9 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://tabs.ultimate-guitar.com/tab/..."
                    autoFocus
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading) handleFetch();
                    }}
                  />

                  {error && (
                    <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {error}
                    </div>
                  )}

                  <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-text-soft">
                    <strong className="text-text-muted">Limites :</strong>{' '}
                    UG bloque parfois les fetchs automatisés. Si ça échoue,
                    utilise plutôt le bouton "Importer depuis une tab" pour
                    coller le texte directement.
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      onClose();
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleFetch}
                    disabled={loading || !url.trim()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright disabled:opacity-60"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {loading ? 'Récupération…' : 'Importer'}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
