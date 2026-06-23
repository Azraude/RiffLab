/**
 * /privacy — Politique de confidentialité (RGPD France). Requis AdSense.
 */
import { SEO } from '@/components/SEO';

export function Privacy() {
  return (
    <>
      <SEO
        title="Politique de confidentialité"
        description="Comment RiffLab collecte, utilise et protège tes données personnelles."
        canonical="https://riff-lab-sigma.vercel.app/privacy"
      />
      <article className="mx-auto max-w-2xl py-4 text-sm leading-relaxed text-text">
        <h1 className="display text-display-sm text-gold">Politique de confidentialité</h1>
        <p className="mt-1 text-xs text-text-muted">Dernière mise à jour : 24 juin 2026</p>

        <Section title="1. Responsable du traitement">
          <p>
            RiffLab est édité par Melvin Bruhat (statut juridique à compléter). Contact :{' '}
            <Mail />.
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>RiffLab collecte les données suivantes :</p>
          <List>
            <li>
              <strong>Compte</strong> : email, nom d'utilisateur, photo de profil
              (optionnelle), instruments joués.
            </li>
            <li>
              <strong>Contenu</strong> : riffs publiés, commentaires, likes, bookmarks,
              follows.
            </li>
            <li>
              <strong>Usage</strong> : sessions de jeu, accords pratiqués, daily streaks
              (stockés localement et synchronisés).
            </li>
            <li>
              <strong>Technique</strong> : adresse IP, type de navigateur, pages visitées
              (analytics anonymisé).
            </li>
            <li>
              <strong>Publicité</strong> : si tu n'es pas abonné Premium, Google AdSense
              peut placer des cookies pour personnaliser les pubs (voir section 6).
            </li>
          </List>
        </Section>

        <Section title="3. Finalités">
          <p>
            Tes données servent à : fournir le service, sauvegarder ta progression,
            afficher les contenus que tu publies, contacter le support si besoin, et
            améliorer l'application.
          </p>
        </Section>

        <Section title="4. Base légale">
          <p>
            Le traitement repose sur l'exécution du contrat (compte gratuit/Premium), ton
            consentement (cookies non-essentiels, marketing) et l'intérêt légitime
            (sécurité, prévention de la fraude).
          </p>
        </Section>

        <Section title="5. Conservation">
          <p>
            Tes données sont conservées tant que ton compte est actif. À la suppression du
            compte, tout est effacé sous 30 jours (sauf obligation légale de conservation).
          </p>
        </Section>

        <Section title="6. Cookies et publicité">
          <p>RiffLab utilise :</p>
          <List>
            <li>
              <strong>Cookies essentiels</strong> : session, préférences (non
              désactivables).
            </li>
            <li>
              <strong>Google AdSense</strong> (utilisateurs non-Premium) : cookies de
              personnalisation publicitaire. Tu peux paramétrer tes préférences sur{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline"
              >
                Google Ads Settings
              </a>
              .
            </li>
          </List>
          <p className="mt-2">
            Les abonnés RiffLab+ ne voient AUCUNE publicité et leurs données ne sont pas
            partagées avec des annonceurs.
          </p>
        </Section>

        <Section title="7. Tiers">
          <p>Tes données peuvent être traitées par :</p>
          <List>
            <li>
              <strong>Supabase</strong> (base de données, Allemagne) — RGPD-compliant.
            </li>
            <li>
              <strong>Vercel</strong> (hébergement, USA) — Standard Contractual Clauses.
            </li>
            <li>
              <strong>Stripe</strong> (paiements Premium, Irlande) — PCI-DSS niveau 1.
            </li>
            <li>
              <strong>Google AdSense</strong> (publicité, USA, non-Premium uniquement).
            </li>
          </List>
        </Section>

        <Section title="8. Tes droits (RGPD)">
          <p>
            Tu peux à tout moment : accéder à tes données, les rectifier, les effacer, en
            limiter le traitement, t'opposer au traitement et demander la portabilité.
            Écris à <Mail /> pour exercer ces droits.
          </p>
          <p className="mt-2">
            Tu peux aussi déposer une réclamation auprès de la <strong>CNIL</strong> (
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline"
            >
              www.cnil.fr
            </a>
            ).
          </p>
        </Section>

        <Section title="9. Sécurité">
          <p>
            Les mots de passe sont hashés. Toutes les communications sont chiffrées
            (HTTPS). L'accès aux données est restreint via Row-Level Security Supabase.
          </p>
        </Section>

        <Section title="10. Mineurs">
          <p>
            RiffLab est accessible dès 13 ans avec accord parental, et dès 16 ans sans
            accord (article 8 RGPD).
          </p>
        </Section>

        <Section title="11. Modifications">
          <p>
            Cette politique peut évoluer. Les utilisateurs seront notifiés par email en cas
            de changement substantiel.
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
