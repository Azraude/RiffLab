/**
 * /settings — Réglages, refonte iOS épurée (2026-06-25).
 *
 * Structure validée par Melvin (verbatim) :
 *  - Préférences : Langue, Niveau (PAS d'accordage → vit dans /tuner, ni
 *    tempo → vit dans /metronome, par décision explicite)
 *  - Sons & Apparence : Son de la guitare, Style du manche, Thème
 *  - Notifications : toggle
 *  - Abonnement : RiffLab Gratuit / RiffLab+ (premium retiré → mock isPremium)
 *  - Aide : tutoriel, support, à propos
 *  - Connexion / déconnexion
 *
 * Purgé : éditer profil, username, accordage, tempo métronome, compte privé,
 * "mes données". Pas de liens Légal (routes /privacy /terms retirées).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  GraduationCap,
  Volume2,
  Music,
  Palette,
  Bell,
  Sparkles,
  Crown,
  Mail,
  Info,
  LogIn,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SelectorDrawer, type SelectorOption } from '@/components/settings/SelectorDrawer';
import { LoginModal } from '@/components/auth/LoginModal';
import { LOCALES, setLocale, type LocaleId } from '@/i18n';
import { usePrefs, type PlayerLevel } from '@/stores/prefsStore';
import { SKIN_LIST } from '@/lib/fretboardSkins';
import { THEMES } from '@/lib/themes';
import { STRUM_SOUNDS } from '@/lib/strumSounds';
import { useAudio } from '@/hooks/useAudio';
import { useAuth } from '@/stores/authStore';

const APP_VERSION = '1.0.0';

const LEVEL_LABELS: Record<PlayerLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};
const LEVEL_OPTIONS: SelectorOption[] = [
  { id: 'beginner', label: 'Débutant', sublabel: 'Je découvre la guitare' },
  { id: 'intermediate', label: 'Intermédiaire', sublabel: 'Je joue depuis un moment' },
  { id: 'advanced', label: 'Avancé', sublabel: 'Je maîtrise bien le manche' },
];

type DrawerKind = 'lang' | 'level' | 'sound' | 'skin' | 'theme';

export function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLocale: LocaleId = (i18n.resolvedLanguage as LocaleId) ?? 'fr';
  const prefs = usePrefs();
  const { strum } = useAudio();

  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  const [drawer, setDrawer] = useState<DrawerKind | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // Premium retiré au commit 9b5b335 → mock placeholder (Option A du brief).
  // TODO: recâbler quand la couche premium revient (Phase 5).
  const isPremium = false;

  // ─── Valeurs affichées dans les rows ───
  const currentLang = LOCALES.find((l) => l.id === currentLocale);
  const currentSound = STRUM_SOUNDS.find((s) => s.id === prefs.strumSound);
  const currentSkin = SKIN_LIST.find((s) => s.id === prefs.fretboardSkin);
  const currentTheme = THEMES.find((th) => th.id === prefs.theme);

  // ─── Options des drawers ───
  const langOptions: SelectorOption[] = LOCALES.map((l) => ({
    id: l.id,
    label: l.label,
    flag: l.flag,
  }));
  const soundOptions: SelectorOption[] = STRUM_SOUNDS.map((s) => ({
    id: s.id,
    label: s.label,
    sublabel: s.description,
    locked: s.premium,
  }));
  const skinOptions: SelectorOption[] = SKIN_LIST.map((s) => ({
    id: s.id,
    label: s.name,
    sublabel: s.description,
    locked: s.premium,
  }));
  const themeOptions: SelectorOption[] = THEMES.filter(
    (th) => !th.secret || prefs.unlockedSecretTheme
  ).map((th) => ({ id: th.id, label: th.label, sublabel: th.description, locked: th.premium }));

  const premiumBlock = (label: string) =>
    alert(`${label} est premium — disponible bientôt (cosmetics shop).`);

  const replayTutorial = () => {
    prefs.setTutorialCompleted(false);
    navigate('/dashboard');
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('settings.title')} showSettingsLink={false} />

      {/* === Carte connexion si déconnecté === */}
      {!user && (
        <section className="mb-6 rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/10 to-transparent p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold text-bg">
            <LogIn size={22} />
          </div>
          <h3 className="display text-lg text-text">Connecte-toi à RiffLab</h3>
          <p className="mt-1 text-sm text-text-muted">
            Sauvegarde ta progression, publie tes riffs et suis tes guitaristes préférés.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-b from-gold-bright to-gold px-6 font-bold text-bg active:scale-[0.98]"
          >
            Se connecter
          </button>
        </section>
      )}

      {/* === PRÉFÉRENCES === */}
      <SettingsGroup title="Préférences">
        <SettingsRow
          icon={Globe}
          label="Langue"
          value={currentLang ? `${currentLang.flag} ${currentLang.label}` : undefined}
          onClick={() => setDrawer('lang')}
        />
        <SettingsRow
          icon={GraduationCap}
          label="Niveau"
          value={LEVEL_LABELS[prefs.level]}
          onClick={() => setDrawer('level')}
          isLast
        />
      </SettingsGroup>

      {/* === SONS & APPARENCE === */}
      <SettingsGroup title="Sons & Apparence">
        <SettingsRow
          icon={Volume2}
          label="Son de la guitare"
          value={currentSound?.label}
          onClick={() => setDrawer('sound')}
        />
        <SettingsRow
          icon={Music}
          label="Style du manche"
          value={currentSkin?.name}
          onClick={() => setDrawer('skin')}
        />
        <SettingsRow
          icon={Palette}
          label="Thème de l'app"
          value={currentTheme?.label}
          onClick={() => setDrawer('theme')}
          isLast
        />
      </SettingsGroup>

      {/* === NOTIFICATIONS === */}
      <SettingsGroup title="Notifications">
        <SettingsRow
          icon={Bell}
          label="Activer les notifications"
          toggle={prefs.notificationsEnabled}
          onToggleChange={(v) => prefs.setNotificationsEnabled(v)}
          isLast
        />
      </SettingsGroup>

      {/* === ABONNEMENT === */}
      <SettingsGroup title="Abonnement">
        {!isPremium ? (
          <>
            <div className="px-4 py-3 text-sm text-text-muted">
              Tu utilises <span className="font-bold text-text">RiffLab Gratuit</span>
            </div>
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={() => premiumBlock('RiffLab+')}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold font-bold text-bg active:scale-[0.98]"
              >
                <Sparkles size={16} />
                Découvrir RiffLab+
              </button>
              <p className="mt-2 text-center text-[11px] text-text-soft">Bientôt disponible</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3 text-sm">
            <Crown size={16} className="text-gold" />
            <span className="font-bold text-text">RiffLab+ actif</span>
          </div>
        )}
      </SettingsGroup>

      {/* === AIDE === */}
      <SettingsGroup title="Aide">
        <SettingsRow icon={GraduationCap} label="Refaire le tutoriel" onClick={replayTutorial} />
        <SettingsRow
          icon={Mail}
          label="Contacter le support"
          onClick={() => {
            window.location.href = 'mailto:melvin.bruhat@gmail.com';
          }}
        />
        <SettingsRow icon={Info} label="À propos" value={`v${APP_VERSION}`} isLast disabled />
      </SettingsGroup>

      {/* === Déconnexion === */}
      {user && (
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-danger/50 font-bold text-danger transition-colors hover:bg-danger/5"
        >
          Se déconnecter
        </button>
      )}

      <div className="mt-4 text-center text-[10px] text-text-soft">RiffLab v{APP_VERSION}</div>

      {/* === Drawers de sélection === */}
      <SelectorDrawer
        open={drawer === 'lang'}
        onClose={() => setDrawer(null)}
        title="Langue"
        options={langOptions}
        currentId={currentLocale}
        onSelect={(id) => setLocale(id as LocaleId)}
      />
      <SelectorDrawer
        open={drawer === 'level'}
        onClose={() => setDrawer(null)}
        title="Niveau"
        options={LEVEL_OPTIONS}
        currentId={prefs.level}
        onSelect={(id) => prefs.setLevel(id as PlayerLevel)}
      />
      <SelectorDrawer
        open={drawer === 'sound'}
        onClose={() => setDrawer(null)}
        title="Son de la guitare"
        options={soundOptions}
        currentId={prefs.strumSound}
        onSelect={(id) => {
          const s = STRUM_SOUNDS.find((x) => x.id === id);
          if (s?.premium) return premiumBlock(s.label);
          prefs.setStrumSound(id as typeof prefs.strumSound);
          setTimeout(() => void strum('Em', 'down'), 80);
        }}
      />
      <SelectorDrawer
        open={drawer === 'skin'}
        onClose={() => setDrawer(null)}
        title="Style du manche"
        options={skinOptions}
        currentId={prefs.fretboardSkin}
        onSelect={(id) => {
          const s = SKIN_LIST.find((x) => x.id === id);
          if (s?.premium) return premiumBlock(s.name);
          prefs.setFretboardSkin(id as typeof prefs.fretboardSkin);
        }}
      />
      <SelectorDrawer
        open={drawer === 'theme'}
        onClose={() => setDrawer(null)}
        title="Thème de l'app"
        options={themeOptions}
        currentId={prefs.theme}
        onSelect={(id) => {
          const th = THEMES.find((x) => x.id === id);
          if (th?.premium) return premiumBlock(th.label);
          prefs.setTheme(id as typeof prefs.theme);
        }}
      />

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
