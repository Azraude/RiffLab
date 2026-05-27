/**
 * LanguageSwitcher — 2 drapeaux 🇫🇷 / 🇬🇧 côte à côte pour switch
 * langue rapide sans aller dans Settings.
 *
 * Le drapeau actif a une bordure gold + glow subtle. Tap target
 * 44x44 (touch-friendly mobile). Persistance via i18n localStorage
 * (cf src/i18n/index.ts setLocale).
 */
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { LOCALES, setLocale, type LocaleId } from '@/i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current: LocaleId = (i18n.resolvedLanguage as LocaleId) ?? 'fr';

  return (
    <div
      role="group"
      aria-label="Changer la langue"
      className="inline-flex w-full gap-1 rounded-xl border border-border bg-surface-2 p-1"
    >
      {LOCALES.map((loc) => {
        const active = current === loc.id;
        return (
          <button
            key={loc.id}
            type="button"
            onClick={() => setLocale(loc.id)}
            aria-label={loc.label}
            aria-pressed={active}
            title={loc.label}
            className={clsx(
              'flex h-9 flex-1 items-center justify-center rounded-lg text-lg leading-none transition-all',
              active
                ? 'bg-gold/15 ring-1 ring-gold shadow-[inset_0_0_8px_rgb(var(--gold-glow)/0.3)]'
                : 'text-text-muted hover:bg-surface'
            )}
          >
            <span aria-hidden="true">{loc.flag}</span>
          </button>
        );
      })}
    </div>
  );
}
