import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toggle } from '@/components/ui/Toggle';
import { usePrefs } from '@/stores/prefsStore';
import { TUNING_LABELS, type TuningId } from '@/lib/theory';
import { db } from '@/lib/db';
import { SKIN_LIST, type FretboardSkin } from '@/lib/fretboardSkins';
import { THEMES, type Theme } from '@/lib/themes';
import { STRUM_SOUNDS, type StrumSound } from '@/lib/strumSounds';
import { useAudio } from '@/hooks/useAudio';
import { Check, Lock, Volume2, GraduationCap, Compass } from 'lucide-react';
import clsx from 'clsx';

export function Settings() {
  const prefs = usePrefs();
  const navigate = useNavigate();

  const replayTutorial = () => {
    prefs.setOnboardingCompleted(false);
    prefs.setTutorialCompleted(false);
    navigate('/dashboard');
  };

  const replayTutorialOnly = () => {
    prefs.setTutorialCompleted(false);
    navigate('/dashboard');
  };
  const { strum } = useAudio();

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
                className="w-full accent-gold"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Afficher les noms de notes sur le manche</span>
              <Toggle checked={prefs.showNoteNames} onChange={prefs.toggleNoteNames} />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="display text-display-sm mb-3">Affichage</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm">Effets 3D</div>
                <p className="mt-0.5 text-xs text-text-soft">
                  Hero studio, ampli, guitares flottantes décoratives. Désactive si
                  l'app rame sur ton appareil.
                </p>
              </div>
              <Toggle checked={prefs.effects3D} onChange={prefs.toggleEffects3D} />
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h3 className="display text-display-sm mb-1">Son de strum</h3>
          <p className="mb-4 text-sm text-text-muted">
            Le timbre des accords joués partout dans l'app. Clique sur un timbre pour le tester.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STRUM_SOUNDS.map((sound) => (
              <StrumSoundOption
                key={sound.id}
                sound={sound}
                active={prefs.strumSound === sound.id}
                onSelect={() => {
                  if (sound.premium) {
                    alert('Ce son est premium — disponible Phase 5 (cosmetics shop).');
                    return;
                  }
                  prefs.setStrumSound(sound.id);
                  // Preview après un court délai pour laisser le hot-swap rebuild
                  setTimeout(() => void strum('Em', 'down'), 80);
                }}
              />
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h3 className="display text-display-sm mb-1">Thème de l'app</h3>
          <p className="mb-4 text-sm text-text-muted">
            Switch instantané — toutes les couleurs s'adaptent (sauf le manche, qui a son propre skin ci-dessous).
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => (
              <ThemeOption
                key={theme.id}
                theme={theme}
                active={prefs.theme === theme.id}
                onSelect={() => {
                  if (theme.premium) {
                    alert('Ce thème est premium — disponible Phase 5 (cosmetics shop).');
                    return;
                  }
                  prefs.setTheme(theme.id);
                }}
              />
            ))}
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
                onSelect={() => {
                  if (skin.premium) {
                    alert('Ce skin est premium — disponible Phase 5 (cosmetics shop).');
                    return;
                  }
                  prefs.setFretboardSkin(skin.id);
                }}
              />
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap size={16} className="text-gold" />
            <h3 className="display text-display-sm">Tutoriel</h3>
          </div>
          <p className="mb-4 text-sm text-text-muted">
            Revoir la visite guidée de l'app (4 étapes spotlightées + outro).
            Pratique si tu veux montrer RiffLab à quelqu'un ou que tu as zappé
            au premier lancement.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={replayTutorialOnly}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10"
            >
              <Compass size={14} /> Refaire le tuto
            </button>
            <button
              type="button"
              onClick={replayTutorial}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5 md:h-10"
            >
              <GraduationCap size={14} /> Refaire onboarding + tuto
            </button>
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

/** Strum sound picker — icone Volume + nom + chips de caractère. */
function StrumSoundOption({
  sound,
  active,
  onSelect,
}: {
  sound: StrumSound;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Son ${sound.label}`}
      className={clsx(
        'group flex items-start gap-3 rounded-xl border bg-surface-2 p-3 text-left transition-all',
        active ? 'border-gold shadow-gold' : 'border-border hover:border-gold-soft'
      )}
    >
      <span
        className={clsx(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
          active ? 'border-gold bg-gold/10 text-gold' : 'border-border bg-surface text-text-muted'
        )}
      >
        <Volume2 size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
          {sound.label}
          {sound.recommended && (
            <span className="inline-flex items-center rounded-full border border-gold bg-gold/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
              Recommandé
            </span>
          )}
          {sound.premium && <Lock size={12} className="text-text-soft" />}
        </div>
        <div className="mt-0.5 line-clamp-2 text-xs text-text-soft">{sound.description}</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {sound.tags.map((t) => (
            <span key={t} className="chip text-[10px]">{t}</span>
          ))}
        </div>
      </div>
      {active && (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-bg">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** Theme selector — vignette colorée 3-stripes + nom + check si actif. */
function ThemeOption({
  theme,
  active,
  onSelect,
}: {
  theme: Theme;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Thème ${theme.label}`}
      className={clsx(
        'group flex flex-col gap-3 rounded-xl border bg-surface-2 p-3 text-left transition-all',
        active ? 'border-gold shadow-gold' : 'border-border hover:border-gold-soft'
      )}
    >
      {/* Vignette : 3 bandes horizontales bg / surface / accent + dot bright */}
      <div
        className="relative h-16 w-full overflow-hidden rounded-lg border border-border"
        style={{ backgroundColor: theme.preview.bg }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1/3"
          style={{ backgroundColor: theme.preview.bg }}
        />
        <div
          className="absolute inset-x-0 top-1/3 h-1/3"
          style={{ backgroundColor: theme.preview.surface }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 flex items-center justify-between px-3"
          style={{ backgroundColor: theme.preview.bg }}
        >
          <span
            className="font-serif text-base font-semibold"
            style={{ color: theme.preview.accent, textShadow: `0 0 12px ${theme.preview.accentBright}40` }}
          >
            RiffLab
          </span>
          <span
            className="h-3 w-3 rounded-full"
            style={{
              backgroundColor: theme.preview.accentBright,
              boxShadow: `0 0 8px ${theme.preview.accentBright}80`,
            }}
          />
        </div>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
            {theme.label}
            {theme.premium && <Lock size={12} className="text-text-soft" />}
          </div>
          <div className="mt-0.5 line-clamp-2 text-xs text-text-soft">{theme.description}</div>
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
          <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
            {skin.name}
            {skin.premium && <Lock size={12} className="text-text-soft" />}
          </div>
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
