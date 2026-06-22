import { useEffect } from 'react';

/**
 * Composant SEO sans dépendance — corrige le bug de la SPA où le <title>,
 * la meta description et le <link rel="canonical"> d'index.html restaient
 * GELÉS sur toutes les routes (canonical pointant vers l'accueil → Google
 * traitait /chords, /scales, etc. comme des duplicatas de la home).
 *
 * Chaque page rend un <Seo> avec son propre titre / description / path.
 * Le composant met à jour impérativement le <head> au montage et à chaque
 * changement de route. Il ne rend rien (null).
 *
 * NB : ça optimise pour les crawlers qui exécutent le JS (Googlebot) et les
 * partages sociaux re-scrapés. Pour un crawl 100 % fiable sans JS, l'étape
 * suivante reste le prérendu au build (cf. audit SEO). Ce composant est
 * compatible avec ce futur passage (il suffira de le mapper sur une lib SSG).
 */

const SITE_URL = 'https://riff-lab-sigma.vercel.app';
const SITE_NAME = 'RiffLab';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

type SeoProps = {
  /** Titre complet de l'onglet / SERP. Inclure « — RiffLab » si pertinent. */
  title: string;
  /** Meta description unique (~150-160 caractères idéalement). */
  description: string;
  /** Chemin canonique de la page, ex: '/chords' ou '/' pour l'accueil. */
  path: string;
  /** Empêche l'indexation (pages app perso, écrans privés). */
  noindex?: boolean;
  /** Image OG spécifique (sinon og-image par défaut). */
  image?: string;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function Seo({ title, description, path, noindex = false, image }: SeoProps) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const ogImage = image ?? DEFAULT_OG_IMAGE;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertLink('canonical', url);

    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:site_name', SITE_NAME);

    // Twitter
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);
  }, [title, description, path, noindex, image]);

  return null;
}
