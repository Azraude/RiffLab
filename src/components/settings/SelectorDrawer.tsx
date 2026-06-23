/**
 * SelectorDrawer — sélecteur générique iOS-style (sess settings-polish).
 *
 * Pattern : une SettingsRow affiche la valeur courante en trailing/sub +
 * chevron ; au tap, ce drawer s'ouvre (bottom sheet plein écran mobile via
 * Sheet) avec les options en liste. Tap sur une option → onChange + close.
 *
 * Remplace les anciens carousels de cards (Langue, Son de strum, Thème,
 * Skin manche). Chaque option peut porter un `preview` (vignette thème,
 * swatch manche) et un flag `premium` (non sélectionnable, badge affiché).
 */
import { Sheet } from '@/components/ui/Sheet';
import { Check } from 'lucide-react';
import clsx from 'clsx';

export interface SelectorOption<T> {
  value: T;
  label: string;
  sublabel?: string;
  preview?: React.ReactNode;
  disabled?: boolean;
  /** Premium → non sélectionnable, badge "Premium" affiché. */
  premium?: boolean;
}

interface SelectorDrawerProps<T extends string | number> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: SelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Appelé quand une option premium est tapée (ex: ouvrir la modale RiffLab+). */
  onPremium?: (value: T) => void;
}

export function SelectorDrawer<T extends string | number>({
  open,
  onOpenChange,
  title,
  options,
  value,
  onChange,
  onPremium,
}: SelectorDrawerProps<T>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <div className="-mx-1 divide-y divide-border/40">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={opt.disabled}
              aria-pressed={selected}
              onClick={() => {
                if (opt.disabled) return;
                if (opt.premium) {
                  onPremium?.(opt.value);
                  onOpenChange(false);
                  return;
                }
                onChange(opt.value);
                onOpenChange(false);
              }}
              className={clsx(
                'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition-colors',
                opt.disabled || opt.premium
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:bg-surface-2',
                selected && 'bg-gold/5',
              )}
            >
              <div className="min-w-0 flex-1">
                <div
                  className={clsx(
                    'flex items-center gap-2 text-sm font-medium',
                    selected ? 'text-gold' : 'text-text',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.premium && (
                    <span className="shrink-0 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                      Premium
                    </span>
                  )}
                </div>
                {opt.sublabel && (
                  <div className="mt-0.5 text-xs text-text-muted">{opt.sublabel}</div>
                )}
                {opt.preview && <div className="mt-2">{opt.preview}</div>}
              </div>
              {selected && <Check size={18} className="shrink-0 text-gold" />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
