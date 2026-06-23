import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toggle } from '@/components/ui/Toggle';
import { LOCALES, setLocale, type LocaleId } from '@/i18n';
import { usePrefs } from '@/stores/prefsStore';
import { useAuth } from '@/stores/authStore';
import { TUNING_LABELS, type TuningId } from '@/lib/theory';
import { db } from '@/lib/db';
import { SKIN_LIST, type FretboardSkin } from '@/lib/fretboardSkins';
import { THEMES, type Theme } from '@/lib/themes';
import { STRUM_SOUNDS } from '@/lib/strumSounds';
import { useAudio } from '@/hooks/useAudio';
import { GraduationCap, Compass, User as UserIcon } from 'lucide-react';
import { SettingsGroup, SettingsRow } from '@/components/settings/SettingsRow';
import { SelectorDrawer } from '@/components/settings/SelectorDrawer';

export function Settings() {
  const prefs = usePrefs();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLocale: LocaleId = (i18n.resolvedLanguage as LocaleId) ?? 'fr';
  const { strum } = useAudio();
  const user = useAuth((s) => s.user);

  // Drawers iOS-style — chaque sélecteur complexe (Langue, Son, Thème, Skin)
  // s'ouvre dans un bottom sheet plein écran mobile.
  const [langDrawerOpen, setLangDrawerOpen] = useState(false);
  const [strumDrawerOpen, setStrumDrawerOpen] = useState(false);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [skinDrawerOpen, setSkinDrawerOpen] = useState(false);

  // Valeurs courantes affichées en sous-titre des rows.
  const currentLang = LOCALES.find((l) => l.id === currentLocale);
  const currentStrum = STRUM_SOUNDS.find((s) => s.id === prefs.strumSound);
  const currentTheme = THEMES.find((th) => th.id === prefs.theme);
  const currentSkin = SKIN_LIST.find((sk) => sk.id === prefs.fretboardSkin);

  const replayTutorial = () => {
    prefs.setOnboardingCompleted(false);
    prefs.setTutorialCompleted(false);
    navigate('/dashboard');
  };

  const replayTutorialOnly = () => {
    prefs.setTutorialCompleted(false);
    navigate('/dashboard');
  };

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
      <PageHeader title={t('settings.title')} showSettingsLink={false} />

      {/* Mon compte (sess SET-NEXT) — header iOS-style en tête de Settings,
          renvoie vers /profile pour le hub compte (modification profil +
          déconnexion). Si pas connecté → row qui propose connexion. */}
      <div className="mb-5">
        <SettingsGroup label="MON COMPTE">
          <SettingsRow
            icon={<UserIcon size={16} />}
            label={user ? 'Mon profil' : 'Pas connecté'}
            sub={
              user
                ? user.email ?? 'Voir mes infos compte'
                : 'Connecte-toi pour publier, liker, suivre'
            }
            to="/profile"
          />
        </SettingsGroup>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Langue — SettingsRow + SelectorDrawer (sess settings-polish) */}
        <div className="md:col-span-2">
          <SettingsGroup label="LANGUE">
            <SettingsRow
              label={t('settings.language')}
              sub={currentLang ? `${currentLang.flag} ${currentLang.label}` : undefined}
              onClick={() => setLangDrawerOpen(true)}
              chevron
            />
          </SettingsGroup>
        </div>

        {/* Instrument — accordage + capo (sess SET-NEXT2 iOS-style) */}
        <div className="md:col-span-2">
          <SettingsGroup label="INSTRUMENT">
            <SettingsRow
              label={t('settings.tuning')}
              sub="Accordage par défaut pour toutes les nouvelles songs"
              trailing={
                <select
                  value={prefs.tuning}
                  onChange={(e) => prefs.setTuning(e.target.value as TuningId)}
                  aria-label={t('settings.tuning')}
                  className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-xs focus:border-gold-soft focus:outline-none"
                >
                  {Object.entries(TUNING_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              }
            />
            <SettingsRow
              label="Capo par défaut"
              sub={`Frette ${prefs.capo}`}
              trailing={
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={12}
                  value={prefs.capo}
                  onChange={(e) => prefs.setCapo(parseInt(e.target.value) || 0)}
                  aria-label="Capo par défaut"
                  className="h-9 w-16 rounded-lg border border-border bg-surface-2 px-2 text-center text-xs focus:border-gold-soft focus:outline-none"
                />
              }
            />
          </SettingsGroup>
        </div>

        {/* Audio — toggles + volume slider + son de strum (iOS-style) */}
        <div className="md:col-span-2">
          <SettingsGroup label="AUDIO">
            <SettingsRow
              label="Son au clic"
              sub="Joue un son quand tu cliques sur un accord ou une gamme"
              trailing={<Toggle checked={prefs.audioEnabled} onChange={prefs.toggleAudio} />}
            />
            <SettingsRow
              label="Volume"
              sub={`${Math.round(prefs.volume * 100)}%`}
              trailing={
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={prefs.volume * 100}
                  onChange={(e) => prefs.setVolume(parseInt(e.target.value) / 100)}
                  aria-label="Volume"
                  className="w-28 accent-gold"
                />
              }
            />
            <SettingsRow
              label="Noms de notes sur le manche"
              sub="Affiche C, D, E... sur les frets dans le fretboard"
              trailing={<Toggle checked={prefs.showNoteNames} onChange={prefs.toggleNoteNames} />}
            />
            <SettingsRow
              label="Son de strum"
              sub={currentStrum?.label ?? 'Auto'}
              onClick={() => setStrumDrawerOpen(true)}
              chevron
            />
          </SettingsGroup>
        </div>

        {/* Apparence — thème + skin manche + effets 3D (iOS-style) */}
        <div className="md:col-span-2">
          <SettingsGroup label="APPARENCE">
            <SettingsRow
              label="Thème"
              sub={currentTheme?.label ?? 'Dark Gold'}
              onClick={() => setThemeDrawerOpen(true)}
              chevron
            />
            <SettingsRow
              label="Skin manche"
              sub={currentSkin?.name ?? 'Noir mat'}
              onClick={() => setSkinDrawerOpen(true)}
              chevron
            />
            <SettingsRow
              label="Effets 3D"
              sub="Hero studio, ampli, guitares flottantes. Désactive si l'app rame."
              trailing={<Toggle checked={prefs.effects3D} onChange={prefs.toggleEffects3D} />}
            />
          </SettingsGroup>
        </div>

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

      {/* ─── Drawers de sélection (sess settings-polish) ─────────────── */}

      <SelectorDrawer
        open={langDrawerOpen}
        onOpenChange={setLangDrawerOpen}
        title={t('settings.language')}
        value={currentLocale}
        onChange={(v) => setLocale(v)}
        options={LOCALES.map((loc) => ({
          value: loc.id,
          label: `${loc.flag} ${loc.label}`,
        }))}
      />

      <SelectorDrawer
        open={strumDrawerOpen}
        onOpenChange={setStrumDrawerOpen}
        title="Son de strum"
        value={prefs.strumSound}
        onChange={(v) => {
          prefs.setStrumSound(v);
          // Preview après un court délai pour laisser le hot-swap rebuild.
          setTimeout(() => void strum('Em', 'down'), 80);
        }}
        options={STRUM_SOUNDS.map((s) => ({
          value: s.id,
          label: s.label,
          sublabel: s.description,
          premium: s.premium,
        }))}
      />

      <SelectorDrawer
        open={themeDrawerOpen}
        onOpenChange={setThemeDrawerOpen}
        title="Thème de l'app"
        value={prefs.theme}
        onChange={(v) => prefs.setTheme(v)}
        options={THEMES.filter((th) => !th.secret || prefs.unlockedSecretTheme).map((theme) => ({
          value: theme.id,
          label: theme.label,
          sublabel: theme.description,
          premium: theme.premium,
          preview: <ThemeSwatch theme={theme} />,
        }))}
      />

      <SelectorDrawer
        open={skinDrawerOpen}
        onOpenChange={setSkinDrawerOpen}
        title="Skin du manche"
        value={prefs.fretboardSkin}
        onChange={(v) => prefs.setFretboardSkin(v)}
        options={SKIN_LIST.map((skin) => ({
          value: skin.id,
          label: skin.name,
          sublabel: skin.description,
          premium: skin.premium,
          preview: <SkinSwatch skin={skin} />,
        }))}
      />
    </>
  );
}

/** Vignette thème — 3 bandes bg/surface/accent + mot RiffLab + dot bright. */
function ThemeSwatch({ theme }: { theme: Theme }) {
  return (
    <div
      className="relative h-16 w-full overflow-hidden rounded-lg border border-border"
      style={{ backgroundColor: theme.preview.bg }}
    >
      <div className="absolute inset-x-0 top-0 h-1/3" style={{ backgroundColor: theme.preview.bg }} />
      <div
        className="absolute inset-x-0 top-1/3 h-1/3"
        style={{ backgroundColor: theme.preview.surface }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 flex h-1/3 items-center justify-between px-3"
        style={{ backgroundColor: theme.preview.bg }}
      >
        <span
          className="font-serif text-base font-semibold"
          style={{
            color: theme.preview.accent,
            textShadow: `0 0 12px ${theme.preview.accentBright}40`,
          }}
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
