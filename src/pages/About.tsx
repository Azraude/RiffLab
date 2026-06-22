/**
 * /about — page vitrine pour les curieux qui débarquent.
 *
 * Hors Layout (pas de sidebar/MobileNav) pour rester côté "page web",
 * pas "app". Pattern miroir de Landing : header sticky avec logo + lien
 * "Lancer l'app", sections empilées, footer.
 *
 * Objectif : capter en 10 secondes "c'est quoi ce truc" pour un
 * guitariste qui arrive depuis Reddit / X / Discord.
 *
 * Tone : prose conversationnelle, pas copy commerciale pompeuse.
 * Melvin pourra polish son texte perso au retour.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Music2,
  Grid3x3,
  Waves,
  ListMusic,
  Calendar,
  Sparkles,
  Shield,
  EyeOff,
  Lock,
  Smile,
  Github,
  Mail,
} from 'lucide-react';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
import { SEO } from '@/components/SEO';

const FEATURES = [
  {
    icon: Calendar,
    title: 'Pratique quotidienne',
    desc: 'Streak Duolingo-like, un défi par jour, mini-quiz par niveau.',
  },
  {
    icon: Grid3x3,
    title: "Bibliothèque d'accords CAGED",
    desc: '50+ accords avec voicings propres, diagrammes lisibles, son réaliste.',
  },
  {
    icon: Waves,
    title: 'Visualiseur de gammes',
    desc: '11 gammes, intervals colorisés, fretboard SVG mobile-first.',
  },
  {
    icon: Sparkles,
    title: "Composer — suite d'accords IA-light",
    desc: "Génère des progressions théorie-validées par clé, style, et mood. Swap intelligent.",
  },
  {
    icon: ListMusic,
    title: 'Setlists imprimables PDF',
    desc: 'Groupe tes morceaux par ordre de set, exporte un chord chart A4.',
  },
  {
    icon: Music2,
    title: 'Local-first',
    desc: 'Tes données restent dans ton navigateur. Cloud opt-in plus tard.',
  },
];

const PROMISES = [
  { icon: EyeOff, label: 'Pas de pub. Jamais.' },
  { icon: Shield, label: 'Pas de tracking. Aucun pixel tiers.' },
  { icon: Lock, label: 'Pas de paywall sur les features de base.' },
  { icon: Smile, label: 'Pas de vente de tes données. Promis.' },
];

const ROADMAP = [
  { status: '✅', label: 'MVP utilisable (Phase 1–4)' },
  { status: '✅', label: 'Auth Supabase (magic-link + Google)' },
  { status: '🟠', label: 'Sync cloud Dexie ↔ Postgres' },
  { status: '⏳', label: 'AI compo assistant (theory hints)' },
  { status: '⏳', label: 'Extension Chrome — capture YouTube tutos' },
];

export function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <SEO
        title="À propos"
        description="Pourquoi RiffLab. Le manifeste anti-pub d'un studio guitare moderne pour les guitaristes qui veulent juste jouer."
        canonical="https://riff-lab-sigma.vercel.app/about"
      />
      {/* Ambient halo gold */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, rgb(var(--gold-glow) / 0.10) 0%, transparent 60%)',
        }}
      />

      {/* Header sticky */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" aria-label="Retour à l'accueil" className="flex items-center gap-2.5">
            <RiffLabLogo size={28} />
            <span className="display text-lg font-semibold">RiffLab</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright"
          >
            Lancer l'app
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-20">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="eyebrow">À propos</p>
          <h1 className="display mt-2 text-display-lg leading-tight md:text-display-xl">
            Salut, je suis Melvin.
          </h1>
          <p className="mt-4 text-lg text-text-muted md:text-xl">
            Guitariste autodidacte depuis ~8 ans. Développeur le jour, plectre le soir.
            J'ai construit RiffLab parce que j'étais frustré par toutes les apps que je testais.
          </p>
        </motion.section>

        {/* Pourquoi */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h2 className="display text-display-sm">Pourquoi j'ai construit RiffLab</h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-text-muted">
            <p>
              Ultimate Guitar c'est un mur de pubs et tu dois payer Pro pour avoir des features
              basiques. Songsterr c'est mieux mais c'est cher et tu dépends d'un compte. Les apps
              freemium type Yousician te poussent agressivement vers l'abonnement après 3 jours.
              Aucune app ne te laisse juste prendre des notes sur tes propres morceaux comme un
              vrai carnet.
            </p>
            <p>
              Je voulais un endroit où je note <em>mes</em> covers, <em>mes</em> idées de riffs,
              <em>mes</em> progressions, sans demander à personne. Qui s'ouvre vite sur le téléphone
              quand le pupitre est calé devant l'ampli en répèt. Qui m'apprend la théorie quand
              j'en ai besoin, sans la stuffer en début de séance.
            </p>
            <p>
              Donc voilà. C'est gratuit, c'est local-first (tes données restent dans ton
              navigateur), c'est mobile-first absolu, et le code est{' '}
              <a
                href="https://github.com/Azraude/RiffLab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline hover:text-gold-bright"
              >
                open source sur GitHub
              </a>
              . Tu peux forker si tu veux faire ta propre version.
            </p>
          </div>
        </motion.section>

        {/* Ce que RiffLab fait */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h2 className="display text-display-sm">Ce que RiffLab fait</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card flex gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                  <f.icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Ce qu'on ne fera JAMAIS */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h2 className="display text-display-sm">Ce qu'on ne fera <em className="text-danger">jamais</em></h2>
          <p className="mt-2 text-sm text-text-muted">
            Promesses gravées dans la pierre. Si un jour je dévie, tu peux me citer.
          </p>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {PROMISES.map((p) => (
              <li
                key={p.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3"
              >
                <p.icon size={16} className="shrink-0 text-gold" />
                <span className="text-sm">{p.label}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Roadmap */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <h2 className="display text-display-sm">Ce qui vient ensuite</h2>
          <ul className="mt-5 space-y-2.5">
            {ROADMAP.map((r) => (
              <li
                key={r.label}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3"
              >
                <span className="font-mono text-sm">{r.status}</span>
                <span className="text-sm">{r.label}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="display text-display-md">Prêt à essayer ?</h2>
          <p className="mt-3 text-text-muted">
            Pas d'inscription. Pas d'email à donner. Tu cliques, ça marche.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-[15px] font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
          >
            Commencer (gratuit)
            <ArrowRight size={16} />
          </Link>
        </motion.section>

        {/* Contact */}
        <section className="mt-16 border-t border-border pt-8 text-sm text-text-muted">
          <p className="font-medium text-text">Tu veux discuter / signaler un bug / suggérer ?</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <a
              href="mailto:melvin.bruhat@gmail.com"
              className="inline-flex items-center gap-1.5 hover:text-gold"
            >
              <Mail size={14} />
              melvin.bruhat@gmail.com
            </a>
            <a
              href="https://github.com/Azraude/RiffLab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-gold"
            >
              <Github size={14} />
              Azraude/RiffLab
            </a>
            <span className="text-xs text-text-soft">Ou utilise le bouton 💬 in-app</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-text-soft md:px-8">
          <span>RiffLab — local-first · open source · made with ☕</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-text">Accueil</Link>
            <Link to="/dashboard" className="hover:text-text">App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
