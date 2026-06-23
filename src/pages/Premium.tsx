/**
 * /premium — page pricing RiffLab+ (Session A : UX only, pas de Stripe).
 * Le CTA affiche une alerte « bientôt » ; Session B branchera le checkout.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, X, Sparkles, ChevronDown, Infinity as InfinityIcon, FileDown, Palette, BadgeCheck } from 'lucide-react';
import clsx from 'clsx';
import { SEO } from '@/components/SEO';
import { Card } from '@/components/ui/Card';
import { usePremium } from '@/hooks/usePremium';

type Billing = 'monthly' | 'yearly';

const FREE_FEATURES = [
  { text: 'Accordeur, métronome, ear-training', ok: true },
  { text: 'Bibliothèque accords & gammes', ok: true },
  { text: 'Feed riffs communautaire', ok: true },
  { text: '2 setlists max', ok: false },
  { text: '3 progressions sauvegardées', ok: false },
  { text: 'Skin de manche : Or uniquement', ok: false },
  { text: 'Pubs affichées', ok: false },
];

const PREMIUM_FEATURES = [
  'Tout le plan gratuit, sans limite',
  'Setlists & progressions illimitées',
  'Export PDF tabs & setlists',
  'Tous les skins de manche premium',
  'Zéro pub',
  'Badge RiffLab+ doré sur ton profil',
  'Parcours complet débloqué',
];

const WHY = [
  { Icon: InfinityIcon, title: 'Sans limites', text: 'Sauvegarde autant de setlists, riffs et progressions que tu veux.' },
  { Icon: FileDown, title: 'Emporte tes tabs', text: 'Export PDF propre et imprimable pour la répèt ou la scène.' },
  { Icon: Palette, title: 'Personnalise', text: 'Débloque tous les skins de manche et fais-toi plaisir.' },
];

const FAQ = [
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui. Aucun engagement — tu annules en un clic depuis tes réglages, et tu gardes RiffLab+ jusqu\'à la fin de la période payée.' },
  { q: 'Sur combien d\'appareils ?', a: 'Ton abonnement te suit sur tous tes appareils connectés au même compte RiffLab.' },
  { q: 'Que se passe-t-il après l\'essai gratuit ?', a: 'Après 7 jours, l\'abonnement choisi démarre. Tu peux annuler avant la fin de l\'essai sans être facturé.' },
  { q: 'Quels moyens de paiement ?', a: 'Carte bancaire via Stripe (paiement sécurisé). D\'autres moyens arriveront plus tard.' },
  { q: 'Un tarif étudiant ?', a: 'Pas encore, mais c\'est prévu. Écris-nous via le bouton feedback en attendant.' },
];

export function Premium() {
  const [billing, setBilling] = useState<Billing>('yearly');
  const { isPremium } = usePremium();

  const handleSubscribe = () => {
    alert('Bientôt disponible — Stripe en cours d\'intégration (Session B).');
  };

  const price = billing === 'monthly' ? '4,99 €' : '39 €';
  const period = billing === 'monthly' ? '/ mois' : '/ an';

  return (
    <>
      <SEO title="RiffLab+" description="Passe au niveau supérieur : sauvegardes illimitées, export PDF, skins premium, zéro pub." />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/20 via-gold/5 to-transparent p-8 text-center">
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.5 }}
          className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold shadow-gold"
        >
          <Crown size={32} className="text-bg" />
        </motion.div>
        <h1 className="display text-display-md md:text-display-lg">
          Passe au niveau supérieur
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
          RiffLab<span className="text-gold">+</span> débloque tout : sauvegardes
          illimitées, export PDF, skins premium et zéro pub.
        </p>
        {isPremium && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm text-gold">
            <BadgeCheck size={15} /> Tu es déjà membre RiffLab+
          </div>
        )}
      </div>

      {/* Toggle billing */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <BillingTab active={billing === 'monthly'} onClick={() => setBilling('monthly')}>
          Mensuel
        </BillingTab>
        <BillingTab active={billing === 'yearly'} onClick={() => setBilling('yearly')}>
          Annuel
          <span className="ml-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-bg">
            −35 %
          </span>
        </BillingTab>
      </div>

      {/* Cartes */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* FREE */}
        <Card className="flex flex-col">
          <div className="label-small">Gratuit</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="display text-4xl">0 €</span>
            <span className="text-sm text-text-soft">pour toujours</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                {f.ok ? (
                  <Check size={16} className="shrink-0 text-success" />
                ) : (
                  <X size={16} className="shrink-0 text-text-soft" />
                )}
                <span className={f.ok ? 'text-text' : 'text-text-soft'}>{f.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* PREMIUM */}
        <Card className="relative flex flex-col border-gold/50 bg-gradient-to-b from-gold/8 to-transparent">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-bright to-gold px-3 py-0.5 text-[11px] font-bold text-bg shadow-gold">
            Le plus populaire
          </div>
          <div className="label-small flex items-center gap-1.5 text-gold">
            <Crown size={13} /> RiffLab+
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="display text-4xl text-gold">{price}</span>
            <span className="text-sm text-text-soft">{period}</span>
          </div>
          {billing === 'yearly' && (
            <p className="mt-1 text-xs text-text-soft">soit 3,25 €/mois · facturé annuellement</p>
          )}
          <ul className="mt-5 space-y-2.5 text-sm">
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Check size={16} className="shrink-0 text-gold" />
                <span className="text-text">{f}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isPremium}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-gold-bright to-gold font-bold text-bg shadow-gold transition hover:-translate-y-px disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isPremium ? 'Tu es déjà premium' : 'Essayer 7 jours gratuits'}
          </button>
          <p className="mt-2 text-center text-[11px] text-text-soft">
            Annulable à tout moment
          </p>
        </Card>
      </div>

      {/* Pourquoi */}
      <h2 className="display mt-10 mb-4 text-display-sm">Pourquoi RiffLab+ ?</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {WHY.map(({ Icon, title, text }) => (
          <Card key={title}>
            <Icon size={22} className="mb-2 text-gold" />
            <h3 className="display text-lg">{title}</h3>
            <p className="mt-1 text-sm text-text-muted">{text}</p>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <h2 className="display mt-10 mb-4 text-display-sm">Questions fréquentes</h2>
      <div className="space-y-2 pb-8">
        {FAQ.map((item, i) => (
          <FaqItem key={i} question={item.q} answer={item.a} />
        ))}
      </div>
    </>
  );
}

function BillingTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
        active
          ? 'border-gold bg-gold/15 text-gold'
          : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-medium text-text">{question}</span>
        <ChevronDown
          size={16}
          className={clsx('shrink-0 text-text-soft transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed text-text-muted">{answer}</div>
      )}
    </div>
  );
}
