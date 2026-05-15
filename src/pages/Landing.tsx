import { Link } from 'react-router-dom';
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

/**
 * Landing publique de RiffLab. Pas de Three.js ici (l'ancienne version
 * custom buguait — on reviendra avec un GLB libre de droits plus tard).
 *
 * Structure :
 * - Header sticky : logo gauche + "Se connecter" droite (→ /dashboard
 *   tant que l'auth Supabase n'est pas en place, Phase 5)
 * - Hero : titre / sous-titre / 2 CTAs
 * - Features : 6 tuiles expliquant l'offre
 * - Bottom CTA + footer
 */
export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient gradient — purement CSS, pas de WebGL */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgb(var(--gold-glow) / 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8 md:py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 rounded-full bg-gold-bright shadow-gold" />
            <span className="display text-[22px] tracking-wide md:text-[26px]">RiffLab</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-gold px-3 text-sm text-text transition-all hover:bg-gold/5 md:h-11 md:px-4"
          >
            <LogIn size={15} />
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pt-10 pb-16 text-center md:px-8 md:pt-16 md:pb-24">
        <div className="eyebrow mb-5 md:mb-7">Le carnet du guitariste moderne</div>
        <h1 className="display text-display-lg md:text-display-xl">
          Pratique. <span className="text-gold text-gold-glow">Compose.</span> Joue.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] text-text-muted md:mt-7 md:text-lg">
          Garde tes sons, accords et gammes en un seul endroit. Bibliothèques
          intégrées, recorder, métronome, tuner, ear training — tout ce qu'il
          faut pour progresser sans changer d'app.
        </p>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center md:mt-10">
          <Link
            to="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 text-[15px] font-semibold text-bg shadow-gold transition-all hover:-translate-y-px hover:bg-gold-bright sm:px-7"
          >
            Commencer gratuitement
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/riff-of-the-week"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border-gold px-6 text-[15px] text-text transition-all hover:bg-gold/5 sm:px-7"
          >
            Riff de la semaine
          </Link>
        </div>
        <p className="mt-6 text-xs text-text-soft">
          100 % local. Pas de compte requis pour démarrer.
        </p>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 md:px-8 md:pb-28">
        <h2 className="display mb-2 text-center text-display-md md:text-display-lg">
          Tout ton matos, dans une seule app.
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-text-muted md:mb-14 md:text-base">
          Pensé mobile-first pour les répèts, le téléphone sur le stand.
          Lisible à 50 cm, taps faciles au pouce, zéro friction.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Music2 size={22} strokeWidth={1.5} />}
            title="Carnet de sons"
            text="Toutes tes compos et reprises, organisées par section, tempo, tonalité, capo. Recorder intégré pour t'enregistrer."
          />
          <FeatureCard
            icon={<Grid3x3 size={22} strokeWidth={1.5} />}
            title="Bibliothèque d'accords"
            text="Tous les voicings indispensables — ouverts, barrés, jazz. Diagrammes propres, audio au clic, transpose en 1 clic."
          />
          <FeatureCard
            icon={<Waves size={22} strokeWidth={1.5} />}
            title="Gammes sur le manche"
            text="Visualise n'importe quelle gamme dans n'importe quelle tonalité. Skins de manche au choix, vue 3D décorative en bonus."
          />
          <FeatureCard
            icon={<ListMusic size={22} strokeWidth={1.5} />}
            title="Setlists & mode lecture"
            text="Compose tes setlists de répèt ou de scène. Mode lecture enchaînée avec transitions claires, prêt pour le live."
          />
          <FeatureCard
            icon={<Mic size={22} strokeWidth={1.5} />}
            title="Outils intégrés"
            text="Tuner par micro avec détection YIN, métronome 40-220 BPM, mini-jeu ear training pour muscler l'oreille."
          />
          <FeatureCard
            icon={<BarChart3 size={22} strokeWidth={1.5} />}
            title="Stats & streak"
            text="Coche tes séances, vois tes accords les plus pratiqués, garde ta série de jours d'affilée. Le carnet qui te tient en haleine."
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 pb-16 text-center md:px-8 md:pb-24">
        <div className="rounded-3xl border border-border-gold bg-surface p-7 md:p-10">
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
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold px-7 text-[15px] font-semibold text-bg shadow-gold transition-all hover:-translate-y-px hover:bg-gold-bright"
          >
            Ouvrir mon carnet
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

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
    <div className="rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-gold-soft md:p-6">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
        {icon}
      </div>
      <h3 className="display text-display-sm">{title}</h3>
      <p className="mt-1.5 text-sm text-text-muted">{text}</p>
    </div>
  );
}
