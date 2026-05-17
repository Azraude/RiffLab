import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Music2,
  Grid3x3,
  Waves,
  ListMusic,
  Mic,
  BarChart3,
  Sparkles,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { HeroScene3DLazy } from '@/components/three/HeroScene3DLazy';
import { useTranslation } from 'react-i18next';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';

/**
 * Landing publique de RiffLab.
 *
 * Refonte session 16 : la studio-scene 3D était posée en background au
 * top de la page (effet "OVNI"). Maintenant elle vit dans un conteneur
 * encadré SOUS le hero text, en showcase intégré. Le reste de la
 * landing utilise des glassy cards (backdrop-blur + bg semi-transparent
 * + border-gold-soft) pour matcher la vibe du Dashboard.
 *
 * Animations entrée + scroll via Framer Motion `whileInView` (stagger
 * sur enfants directs). Particules CSS dans le hero (pas de WebGL).
 */
export function Landing() {
  const { t } = useTranslation();
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8 md:py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <RiffLabLogo size={26} />
            <span className="display text-[22px] tracking-wide md:text-[26px]">RiffLab</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-gold bg-surface/60 px-3 text-sm text-text backdrop-blur-md transition-all hover:bg-gold/10 md:h-11 md:px-4"
          >
            <LogIn size={15} />
            {t('landing.signIn')}
          </Link>
        </div>
      </header>

      {/* 3D scene en BACKGROUND absolu de la moitié basse du hero —
          plus de cadre rounded, plus de "carte vignette". Le contenu
          texte est posé COMME UN POSTER sur un mur de studio avec
          l'ampli derrière. */}
      <div className="pointer-events-none absolute inset-x-0 top-[55%] bottom-0 z-0">
        <HeroScene3DLazy />
      </div>
      {/* Halo gold radial sous l'ampli pour le faire "exister"
          visuellement sans cadre */}
      <div
        className="pointer-events-none absolute left-1/2 bottom-0 z-[1] h-[60vh] w-[80%] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgb(var(--gold-glow) / 0.08) 0%, transparent 60%)',
        }}
      />
      {/* Gradient bottom fade pour empêcher la 3D de manger le footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-t from-bg to-transparent" />

      {/* Hero text — z-10 au-dessus de la 3D */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pt-8 text-center md:px-8 md:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="eyebrow mb-5 md:mb-7"
        >
          {t('landing.kicker')}
        </motion.div>
        <HeroTitle text={t('landing.headline')} />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mx-auto mt-5 max-w-xl text-[15px] text-text-muted md:mt-7 md:text-lg"
        >
          Garde tes sons, accords et gammes en un seul endroit. Bibliothèques
          intégrées, recorder, métronome, tuner, ear training — tout ce qu'il
          faut pour progresser sans changer d'app.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:mt-10"
        >
          <Link
            to="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-[15px] font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px hover:shadow-gold-strong"
          >
            Commencer gratuitement
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/riff-of-the-week"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border-gold bg-surface/40 px-7 text-[15px] text-text backdrop-blur-md transition-all hover:bg-gold/10"
          >
            Riff de la semaine
          </Link>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="mt-6 text-xs text-text-soft"
        >
          100 % local. Pas de compte requis pour démarrer.
        </motion.p>
      </section>

      {/* Spacer pour laisser respirer le hero 3D avant les features */}
      <div className="h-[40vh] md:h-[50vh]" />

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-20 pb-20 md:px-8 md:pt-28 md:pb-28">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="display mb-2 text-center text-display-md md:text-display-lg"
        >
          Tout ton matos, dans une seule app.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-10 max-w-2xl text-center text-sm text-text-muted md:mb-14 md:text-base"
        >
          Pensé mobile-first pour les répèts, le téléphone sur le stand.
          Lisible à 50 cm, taps faciles au pouce, zéro friction.
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

      {/* Bottom CTA — glassy */}
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
              Prêt à monter ton carnet&nbsp;?
            </h2>
            <p className="mt-3 text-sm text-text-muted md:text-base">
              Le carnet démarre vide ou avec quelques exemples. Tout reste sur ton
              téléphone — pas de cloud avant que tu décides.
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-xs text-text-soft md:px-8">
          <span>RiffLab — v0.4</span>
          <span>Local-first · Open source</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Hero title (split par lettre, stagger entrée) ───────────────────

function HeroTitle({ text }: { text: string }) {
  const letters = text.split('');
  const goldWordStart = text.indexOf('Compose');
  const goldWordEnd = goldWordStart + 'Compose'.length;
  return (
    <motion.h1
      className="display text-display-lg md:text-display-xl"
      initial={{ letterSpacing: '0.18em' }}
      animate={{ letterSpacing: '0.005em' }}
      transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      aria-label={text}
    >
      {letters.map((char, i) => {
        const isInGold = i >= goldWordStart && i < goldWordEnd;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.5,
              delay: 0.08 + i * 0.04,
              ease: [0.25, 1, 0.5, 1],
            }}
            className={
              isInGold ? 'inline-block text-gold text-gold-glow' : 'inline-block'
            }
            aria-hidden
          >
            {char === ' ' ? ' ' : char}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}

// ─── Features data ────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Music2 size={22} strokeWidth={1.5} />,
    title: 'Carnet de sons',
    text: "Toutes tes compos et reprises, organisées par section, tempo, tonalité, capo. Recorder intégré pour t'enregistrer.",
  },
  {
    icon: <Grid3x3 size={22} strokeWidth={1.5} />,
    title: "Bibliothèque d'accords",
    text: 'Tous les voicings indispensables — ouverts, barrés, jazz. Diagrammes propres, audio au clic, transpose en 1 clic.',
  },
  {
    icon: <Waves size={22} strokeWidth={1.5} />,
    title: 'Gammes sur le manche',
    text: "Visualise n'importe quelle gamme dans n'importe quelle tonalité. Skins de manche au choix, vue 3D décorative en bonus.",
  },
  {
    icon: <ListMusic size={22} strokeWidth={1.5} />,
    title: 'Setlists & mode lecture',
    text: 'Compose tes setlists de répèt ou de scène. Mode lecture enchaînée avec transitions claires, prêt pour le live.',
  },
  {
    icon: <Mic size={22} strokeWidth={1.5} />,
    title: 'Outils intégrés',
    text: "Tuner par micro avec détection YIN, métronome 40-220 BPM, mini-jeu ear training pour muscler l'oreille.",
  },
  {
    icon: <BarChart3 size={22} strokeWidth={1.5} />,
    title: 'Stats & streak',
    text: 'Coche tes séances, vois tes accords les plus pratiqués, garde ta série de jours d\'affilée. Le carnet qui te tient en haleine.',
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

// ─── Particules CSS flottantes ────────────────────────────────────────

/**
 * 30 dots dorés qui flottent verticalement avec vitesses + délais
 * aléatoires. Pas de WebGL — pure CSS keyframe animation + style inline
 * pour les positions. Léger (no JS runtime).
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
      `}</style>
    </div>
  );
}
