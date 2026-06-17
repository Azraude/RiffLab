import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  schemaJsonLd?: object;
}

const BASE_TITLE = 'RiffLab — Le studio guitare des riffeurs modernes';
const BASE_URL = 'https://riff-lab-sigma.vercel.app';

export function SEO({ title, description, ogImage, canonical, schemaJsonLd }: SEOProps) {
  const fullTitle = title ? `${title} — RiffLab` : BASE_TITLE;
  const ogImageUrl = ogImage ?? `${BASE_URL}/og-image.png`;
  const canonicalUrl = canonical ?? BASE_URL;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      el?.setAttribute(attr, value);
    };

    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }

    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[property="og:image"]', 'content', ogImageUrl);
    setMeta('meta[name="twitter:image"]', 'content', ogImageUrl);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
  }, [fullTitle, description, ogImageUrl, canonicalUrl]);

  if (!schemaJsonLd) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
    />
  );
}
