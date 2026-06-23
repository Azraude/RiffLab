/**
 * /terms — CGU + CGV (vente RiffLab+). Requis AdSense.
 */
import { SEO } from '@/components/SEO';

export function Terms() {
  return (
    <>
      <SEO
        title="Conditions Générales d'Utilisation"
        description="Conditions d'utilisation et de vente de RiffLab et RiffLab+."
        canonical="https://riff-lab-sigma.vercel.app/terms"
      />
      <article className="mx-auto max-w-2xl py-4 text-sm leading-relaxed text-text">
        <h1 className="display text-display-sm text-gold">
          Conditions Générales d'Utilisation et de Vente
        </h1>
        <p className="mt-1 text-xs text-text-muted">Dernière mise à jour : 24 juin 2026</p>

        <Section title="1. Objet">
          <p>
            Les présentes CGU/CGV régissent l'utilisation de RiffLab (application web
            accessible à riff-lab-sigma.vercel.app) et l'abonnement RiffLab+ (offre
            payante).
          </p>
        </Section>

        <Section title="2. Éditeur">
          <p>
            RiffLab est édité par Melvin Bruhat (statut juridique à compléter). Email :{' '}
            <Mail />.
          </p>
        </Section>

        <Section title="3. Accès au service">
          <p>
            RiffLab est accessible 7j/7, 24h/24, sous réserve d'opérations de maintenance.
            L'inscription est gratuite. Aucune garantie de disponibilité à 100 %.
          </p>
        </Section>

        <Section title="4. Compte utilisateur">
          <p>
            L'utilisateur s'engage à fournir des informations exactes lors de
            l'inscription. Il est responsable de la confidentialité de son mot de passe.
          </p>
        </Section>

        <Section title="5. Contenu publié">
          <p>
            L'utilisateur reste propriétaire des riffs qu'il publie mais accorde à RiffLab
            une licence mondiale, non exclusive et gratuite pour les héberger, les afficher
            et les promouvoir au sein de l'application.
          </p>
          <p>L'utilisateur s'engage à ne pas publier de contenu :</p>
          <List>
            <li>Violant des droits d'auteur (tablatures protégées sans autorisation) ;</li>
            <li>Haineux, discriminatoire ou harcelant ;</li>
            <li>Faisant la promotion de violence ou de produits illégaux ;</li>
            <li>Pornographique ou portant atteinte à la dignité humaine ;</li>
            <li>Trompeur, spam ou commercial non autorisé.</li>
          </List>
          <p className="mt-2">
            RiffLab se réserve le droit de supprimer tout contenu contrevenant à ces règles
            et de suspendre le compte concerné.
          </p>
        </Section>

        <Section title="6. Abonnement RiffLab+">
          <p>
            RiffLab+ est un abonnement payant donnant accès à des fonctionnalités
            additionnelles (sauvegardes illimitées, skins exclusifs, export PDF, absence de
            publicité).
          </p>
          <p>
            <strong>Tarifs (TTC)</strong> :
          </p>
          <List>
            <li>Mensuel : 4,99 € / mois ;</li>
            <li>Annuel : 39,00 € / an (≈ 3,25 € / mois).</li>
          </List>
          <p className="mt-2">
            <strong>Essai gratuit</strong> : 7 jours sans engagement, aucun prélèvement
            pendant la période d'essai, annulable à tout moment depuis le Customer Portal
            Stripe.
          </p>
          <p>
            <strong>Renouvellement</strong> : tacite à chaque échéance sauf annulation
            préalable. <strong>Annulation</strong> : possible à tout moment ; l'accès
            Premium reste actif jusqu'à la fin de la période payée.
          </p>
        </Section>

        <Section title="7. Droit de rétractation">
          <p>
            Conformément à l'article L.221-28 du Code de la consommation, l'utilisateur
            dispose d'un droit de rétractation de 14 jours. Toutefois, en acceptant lors du
            paiement, l'utilisateur demande l'exécution immédiate du service et renonce à
            son droit de rétractation dès le premier accès aux fonctionnalités Premium.
          </p>
        </Section>

        <Section title="8. Paiement">
          <p>
            Les paiements sont traités par <strong>Stripe</strong> (PCI-DSS niveau 1).
            RiffLab ne stocke aucune donnée bancaire. Les factures sont disponibles depuis
            le Customer Portal.
          </p>
        </Section>

        <Section title="9. Suspension / Résiliation">
          <p>
            RiffLab se réserve le droit de suspendre ou supprimer tout compte en cas de
            violation des présentes CGU/CGV.
          </p>
        </Section>

        <Section title="10. Responsabilité">
          <p>
            RiffLab est fourni « en l'état ». L'éditeur ne peut être tenu responsable des
            éventuels bugs, pertes de données ou interruptions de service. L'utilisateur
            reste responsable de la sauvegarde de ses créations.
          </p>
        </Section>

        <Section title="11. Propriété intellectuelle">
          <p>
            Le code source, le design, le nom RiffLab et le logo sont la propriété
            exclusive de l'éditeur. Toute reproduction non autorisée est interdite.
          </p>
        </Section>

        <Section title="12. Modifications">
          <p>
            Les présentes CGU/CGV peuvent évoluer. Les utilisateurs seront notifiés en cas
            de modification substantielle. La poursuite de l'utilisation vaut acceptation.
          </p>
        </Section>

        <Section title="13. Loi applicable">
          <p>
            Les présentes sont régies par le droit français. Tout litige relève de la
            compétence des tribunaux français.
          </p>
        </Section>

        <p className="mt-8 text-xs text-text-muted">
          Contact : <Mail />
        </p>
      </article>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 space-y-2">
      <h2 className="text-base font-bold text-text">{title}</h2>
      <div className="space-y-2 text-text-muted">{children}</div>
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
}

function Mail() {
  return (
    <a href="mailto:melvin.bruhat@gmail.com" className="text-gold underline">
      melvin.bruhat@gmail.com
    </a>
  );
}
