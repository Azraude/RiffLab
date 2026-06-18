import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Target,
  Wand2,
  Users,
  Grid3x3,
  Drum,
  BarChart3,
  Sparkles,
  ArrowRight,
  LogIn,
  Check,
  Music2,
} from 'lucide-react';
import { HeroScene3DLazy } from '@/components/three/HeroScene3DLazy';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
import { LoginModal } from '@/components/auth/LoginModal';

/**
 * Landing publique de RiffLab.
 *
 * Refonte session 2026-06-17 (copy + mobile-first) : la copy ne parle plus
 * de "carnet du guitariste" générique. RiffLab est désormais positionné
 * comme une plateforme guitare complète — studio de compo, feed de riffs
 * communautaire, bibliothèques accords/gammes, pratique quotidienne trackée.
 *
 * Layout MOBILE-FIRST : hero plein écran (90vh) avec CTA above-the-fold,
 * sections 1 colonne qui passent en grille ≥sm, glassy cards backdrop-blur.
 * La scène 3D (HeroScene3DLazy) ne s'affiche que sur desktop capable —
 * useCanRender3D renvoie le fallback gradient sur mobile / reduced-motion.
 *
 * Toutes les animations Framer Motion + les particules CSS respectent
 * prefers-reduced-motion (useReducedMotion + media query dans FloatingDots).
 */
export function Landing() {
  const { t } = useTranslation();
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient halo gold derrière le hero — pure CSS, accompagne la 3D */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[80vh]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgb(var(--gold-glow) / 0.10) 0%, transparent 60%)',
        }}
      />

      {/* Particules CSS — 30 dots flottent verticalement avec délais aléatoires */}
      <FloatingDots />

      {/* Header sticky */}
      <header className="relative z-20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8 md:py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <RiffLabLogo size={26} />
            <span className="display text-[22px] tracking-wide md:text-[26px]">RiffLab</span>
          </Link>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-gold bg-surface/60 px-4 text-sm text-text backdrop-blur-md transition-all hover:bg-gold/10"
          >
            <LogIn size={15} />
            {t('landing.signIn')}
          </button>
        </div>
      </header>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* ─── HERO ─── plein écran mobile, CTA above-the-fold ─────────────── */}
      <section className="relative flex min-h-[88vh] flex-col md:min-h-[90vh]">
        {/* 3D scene en background ABSOLU FULL HERO (sess LANDING refonte) —
            avant la scène était ancrée moitié basse seulement, maintenant
            elle TRAVERSE le titre pour effet profondeur. opacity 0.85 pour
            laisser respirer le texte par-dessus.
            Desktop only — useCanRender3D renvoie un fallback gradient sur
            mobile et reduced-motion. */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-85">
          <HeroScene3DLazy />
        </div>
        {/* Halo gold radial centré sur le tiers haut, là où le titre vit.
            Renforce la lisibilité du texte par-dessus la 3D + ajoute du
            "poids" lumineux au centre du hero. */}
        <div
          className="pointer-events-none absolute left-1/2 top-[10%] z-[1] h-[60vh] w-[120%] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse at center, rgb(var(--gold-glow) / 0.16) 0%, rgba(0,0,0,0.45) 35%, transparent 70%)',
          }}
        />
        {/* Vignette top : sombre subtil au top pour pop le titre */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[40vh]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)',
          }}
        />
        {/* Gradient bottom fade pour empêcher la 3D de manger la section suivante */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-t from-bg to-transparent" />

        {/* Hero text — z-10 au-dessus de la 3D, ancré dans le tiers haut */}
        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pt-6 text-center md:px-8 md:pt-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="eyebrow mb-4 md:mb-6"
          >
            {t('landing.kicker')}
          </motion.div>
          <HeroTitle text={t('landing.headline')} goldWord="guitare" />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto mt-5 max-w-xl text-base text-text-muted md:mt-7 md:text-lg"
          >
            Studio de compo, feed de riffs, accords &amp; gammes, mode jam,
            pratique trackée.{' '}
            <span className="text-text">Le tout sans pub.</span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-[15px] font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
            >
              Commencer — gratuit, sans inscription
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/riffs"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border-gold bg-surface/40 px-7 text-[15px] text-text backdrop-blur-md transition-all hover:bg-gold/10"
            >
              Voir le feed de riffs
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.95 }}
            className="mt-6 text-xs text-text-soft"
          >
            100 % local par défaut. Tes données restent sur ton téléphone.
          </motion.p>
        </div>

        {/* Spacer flex pour réserver la moitié basse du hero à la 3D */}
        <div className="flex-1" aria-hidden />
      </section>

      {/* ─── Ce que tu peux faire ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-16 pb-16 md:px-8 md:pt-24 md:pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="display mb-2 text-center text-display-md md:text-display-lg"
        >
          Tout ce qu'il te faut, rien que tu paies en double.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-10 max-w-2xl text-center text-sm text-text-muted md:mb-14 md:text-base"
        >
          Pensé pour le téléphone sur le stand : lisible à 50 cm, tout au pouce,
          zéro friction.
        </motion.p>
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </motion.div>
      </section>

      {/* ─── Pourquoi pas Ultimate Guitar / Songsterr / Yousician ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 md:px-8 md:pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="display mb-2 text-center text-display-md md:text-display-lg"
        >
          Pourquoi pas juste Ultimate Guitar&nbsp;?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-10 max-w-2xl text-center text-sm text-text-muted md:mb-14 md:text-base"
        >
          Pas de "on est meilleurs". Juste trois trucs qu'on a décidé de pas
          faire.
        </motion.p>
        <motion.div
          className="grid gap-3 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
          }}
        >
          {COMPARISON.map((c) => (
            <ComparisonCard key={c.title} {...c} />
          ))}
        </motion.div>
      </section>

      {/* ─── Sons & visuels ─── */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-16 md:px-8 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-border-gold bg-surface/50 p-7 text-center backdrop-blur-md md:p-12"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgb(var(--gold-glow) / 0.10) 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
              <Music2 size={22} strokeWidth={1.5} />
            </div>
            <h2 className="display text-display-md md:text-display-lg">
              Des vraies guitares, pas des bips.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted md:text-base">
              Samples HQ de vraies guitares, 5 amplis modélisés, et un manche
              interactif que tu peux lire à bout de bras en pleine répèt.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer CTA ─── glassy ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-3xl px-5 pb-16 text-center md:px-8 md:pb-24"
      >
        <div className="relative overflow-hidden rounded-3xl border border-border-gold bg-surface/50 p-7 backdrop-blur-md md:p-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 30%, rgb(var(--gold-glow) / 0.10) 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <Sparkles size={22} className="mx-auto mb-3 text-gold" />
            <h2 className="display text-display-md md:text-display-lg">
              Prends ta guitare.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-text-muted md:text-base">
              Le carnet démarre vide ou avec quelques exemples. Tout reste sur
              ton tél — pas de cloud tant que tu ne le décides pas.
            </p>
            <Link
              to="/dashboard"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-[15px] font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
            >
              Ouvrir mon carnet
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-text-soft md:px-8">
          <span className="flex items-center gap-2">
            <RiffLabLogo size={16} />
            RiffLab — v0.4 · local-first · open source
          </span>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-text">
              À propos
            </Link>
            <a
              href="https://github.com/Azraude/RiffLab"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Hero title — stagger PAR MOT + text-shadow glow par-dessus 3D ────
//
// Refonte sess LANDING : avant on splittait par LETTRE et chaque
// `motion.span inline-block` avec un caractère espace simple collapsait
// au rendu (whitespace collapse entre inline-blocks adjacents). Résultat :
// "L'appguitarequetuattendais." mots collés sans espaces.
//
// Fix : split par MOT, chaque mot en `motion.span inline-block` avec un
// vrai espace HTML séparateur entre les spans. Plus simple, plus rapide
// à render, et zéro risque de mot collé. L'anim entry reste théâtrale
// (letter-spacing parent + per-word stagger blur/y/opacity).
//
// Plus : text-shadow gold + dark drop-shadow pour pop sur la scène 3D
// qui passe DERRIÈRE le titre (z-10 above z-0).

function HeroTitle({ text, goldWord }: { text: string; goldWord: string }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');

  const titleClass =
    'display text-display-lg md:text-display-xl [text-shadow:0_0_24px_rgba(0,0,0,0.8),0_0_60px_rgba(212,183,106,0.18)]';

  // Reduced-motion : titre statique, mot doré conservé, zéro animation.
  if (reduce) {
    return (
      <h1 className={titleClass}>
        {words.map((word, i) => (
          <span key={i}>
            {word === goldWord || word.replace(/[.,!?;:]$/, '') === goldWord ? (
              <span className="text-gold text-gold-glow">{word}</span>
            ) : (
              word
            )}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </h1>
    );
  }

  return (
    <motion.h1
      className={titleClass}
      initial={{ letterSpacing: '0.12em' }}
      animate={{ letterSpacing: '0.005em' }}
      transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
      aria-label={text}
    >
      {words.map((word, i) => {
        // Match goldWord même si suivi d'une ponctuation (".", ",", etc.)
        const cleanWord = word.replace(/[.,!?;:]$/, '');
        const isGold = cleanWord === goldWord || word === goldWord;
        return (
          <span key={i} className="inline-block whitespace-nowrap">
            <motion.span
              initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.55,
                delay: 0.15 + i * 0.09,
                ease: [0.25, 1, 0.5, 1],
              }}
              className={
                isGold ? 'inline-block text-gold text-gold-glow' : 'inline-block'
              }
              aria-hidden
            >
              {word}
            </motion.span>
            {/* Espace explicite entre mots — un vrai caractère espace dans un
                span sans inline-block respecte le whitespace inter-mots. */}
            {i < words.length - 1 ? <span aria-hidden>{' '}</span> : null}
          </span>
        );
      })}
    </motion.h1>
  );
}

// ─── Features data ────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Target size={22} strokeWidth={1.5} />,
    title: 'Pratique quotidienne',
    text: 'Coche tes séances, regarde ta série grandir, repère les accords que tu fuis.',
  },
  {
    icon: <Wand2 size={22} strokeWidth={1.5} />,
    title: 'Studio de compo',
    text: "Bloque un accord, l'algo propose la suite qui sonne. Des progressions sans prise de tête théorique.",
  },
  {
    icon: <Users size={22} strokeWidth={1.5} />,
    title: 'Feed de riffs',
    text: 'Joue les riffs des autres, like ceux qui claquent, publie les tiens. Une commu, pas un catalogue.',
  },
  {
    icon: <Grid3x3 size={22} strokeWidth={1.5} />,
    title: 'Accords & gammes',
    text: 'Toute la bibliothèque sur un manche interactif. Voicings, gammes, transpose en un tap.',
  },
  {
    icon: <Drum size={22} strokeWidth={1.5} />,
    title: 'Mode jam',
    text: "Batterie, basse et accords qui te suivent. Jamme comme si t'avais un groupe derrière.",
  },
  {
    icon: <BarChart3 size={22} strokeWidth={1.5} />,
    title: 'Stats & streak',
    text: 'Ton année de guitare en chiffres : temps joué, accords bossés, courbe de progression.',
  },
];

// ─── Glassy feature card ──────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } },
      }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-5 backdrop-blur-md transition-colors hover:border-gold-soft md:p-6"
    >
      {/* Subtle gold halo qui apparaît au hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at top right, rgb(var(--gold-glow) / 0.08) 0%, transparent 50%)',
        }}
      />
      <div className="relative">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
          {icon}
        </div>
        <h3 className="display text-display-sm">{title}</h3>
        <p className="mt-1.5 text-sm text-text-muted">{text}</p>
      </div>
    </motion.div>
  );
}

// ─── Comparison data ──────────────────────────────────────────────────

const COMPARISON = [
  {
    title: 'Pas de pub qui clignote',
    text: 'Tu lis tes accords, tu joues. Rien ne s’agite à l’écran, rien ne te coupe en plein riff.',
  },
  {
    title: 'Pas de paywall sur les bases',
    text: 'Accords, gammes, riffs, tuner, métronome : gratuits, et ça le reste. On ne te fait pas payer pour voir un Do majeur.',
  },
  {
    title: 'Tes données restent chez toi',
    text: 'Tout vit en local sur ton tél par défaut. Pas de compte obligatoire, pas de revente de données.',
  },
];

// ─── Comparison card ──────────────────────────────────────────────────

function ComparisonCard({ title, text }: { title: string; text: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } },
      }}
      className="rounded-2xl border border-border bg-surface/50 p-5 backdrop-blur-md md:p-6"
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
        <Check size={18} strokeWidth={2} />
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-1.5 text-sm text-text-muted">{text}</p>
    </motion.div>
  );
}

// ─── Particules CSS flottantes ────────────────────────────────────────

/**
 * 30 dots dorés qui flottent verticalement avec vitesses + délais
 * aléatoires. Pas de WebGL — pure CSS keyframe animation + style inline
 * pour les positions. Léger (no JS runtime). Coupées en reduced-motion
 * via media query dans le <style> inline.
 */
function FloatingDots() {
  // Génère des positions déterministes (seed sur l'index) pour SSR-safe
  const dots = Array.from({ length: 30 }, (_, i) => {
    const seed = i * 7919; // prime pour pseudo-aléatoire
    return {
      left: (seed % 1000) / 10, // 0-99 %
      delay: (seed * 13) % 6, // 0-6s
      duration: 8 + ((seed * 11) % 8), // 8-16s
      size: 2 + ((seed * 3) % 3), // 2-4 px
      opacity: 0.25 + ((seed * 5) % 30) / 100, // 0.25-0.55
    };
  });
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[100vh] overflow-hidden"
      aria-hidden
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="float-dot absolute rounded-full bg-gold-bright"
          style={{
            left: `${d.left}%`,
            bottom: '-10px',
            width: `${d.size}px`,
            height: `${d.size}px`,
            opacity: d.opacity,
            animation: `landing-float-up ${d.duration}s linear ${d.delay}s infinite`,
            filter: 'blur(0.5px)',
            boxShadow: '0 0 6px rgb(var(--gold-glow) / 0.4)',
          }}
        />
      ))}
      <style>{`
        @keyframes landing-float-up {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: var(--initial-opacity, 0.4); }
          90% { opacity: var(--initial-opacity, 0.4); }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .float-dot { animation: none !important; opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}
