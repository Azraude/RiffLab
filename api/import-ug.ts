/**
 * Vercel serverless function : /api/import-ug?url=<UG_URL>
 *
 * Fetch une URL Ultimate Guitar (ou Songsterr), extract le chord chart
 * en parsant le DOM avec cheerio, retourne du JSON parsable côté client
 * par `parseTabText` ou directement injecté dans Song.
 *
 * Limitations connues :
 * - UG protège l'accès par cookies + Cloudflare → un fetch nu marche
 *   parfois, parfois non. On envoie un User-Agent réaliste.
 * - Format UG = `[ch]Am[/ch]` pour les chords inline, ou parfois juste
 *   du texte avec chords sur ligne séparée.
 * - On essaye plusieurs sélecteurs DOM pour résister aux changements de
 *   layout UG.
 *
 * Statut : MVP scaffolding. À iterer en prod en testant sur de vraies
 * pages UG. Pour l'instant, marche sur certaines URLs publiques.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36';

type ImportResult = {
  ok: true;
  source: 'ultimate-guitar' | 'unknown';
  title?: string;
  artist?: string;
  capo?: number;
  key?: string;
  /** Plain text chord chart : utiliser parseTabText côté client pour
   *  obtenir des sections + chord refs. */
  body: string;
};

type ImportError = {
  ok: false;
  error: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // CORS — autorise n'importe quelle origine (PWA mobile / dev local)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' } as ImportError);
    return;
  }

  const url = typeof req.query.url === 'string' ? req.query.url : '';
  if (!url) {
    res.status(400).json({ ok: false, error: "Missing 'url' query param" } as ImportError);
    return;
  }

  // Sécurité : whitelist domaines acceptés
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid URL' } as ImportError);
    return;
  }
  const allowedHosts = ['www.ultimate-guitar.com', 'tabs.ultimate-guitar.com'];
  if (!allowedHosts.some((h) => parsed.host.endsWith(h))) {
    res.status(400).json({
      ok: false,
      error: `Only Ultimate Guitar URLs allowed. Got: ${parsed.host}`,
    } as ImportError);
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!upstream.ok) {
      res.status(502).json({
        ok: false,
        error: `Upstream returned ${upstream.status}`,
      } as ImportError);
      return;
    }
    const html = await upstream.text();
    const result = parseUltimateGuitar(html);
    res.status(200).json({ ok: true, source: 'ultimate-guitar', ...result } as ImportResult);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as ImportError);
  }
}

/**
 * Parse une page UG. UG injecte ses data dans un `js-store` data-content
 * JSON-encoded sur le HTML (au moins jusqu'en 2024). Si ce store existe,
 * on extrait directement. Sinon fallback sur scraping textuel.
 */
function parseUltimateGuitar(html: string): Omit<ImportResult, 'ok' | 'source'> {
  const $ = cheerio.load(html);

  // 1. Tentative js-store
  const storeDiv = $('.js-store').first();
  if (storeDiv.length > 0) {
    const raw = storeDiv.attr('data-content');
    if (raw) {
      try {
        const decoded = decodeHtmlEntities(raw);
        const data = JSON.parse(decoded);
        const tab = data?.store?.page?.data?.tab_view ?? data?.store?.page?.data?.tab;
        if (tab) {
          const chordChart =
            tab.wiki_tab?.content ?? tab.content ?? tab.contributor?.transcription ?? '';
          return {
            title: tab.song_name ?? tab.tab?.song_name,
            artist: tab.artist_name ?? tab.tab?.artist_name,
            capo: typeof tab.capo === 'number' ? tab.capo : undefined,
            key: tab.tonality_name,
            body: cleanUgMarkup(chordChart),
          };
        }
      } catch {
        // fallthrough
      }
    }
  }

  // 2. Fallback : extract pre.js-tab-content
  const preContent = $('pre.js-tab-content, pre[itemprop="chordsAndLyrics"], pre.chord_text').first();
  const body = preContent.length > 0 ? cleanUgMarkup(preContent.text()) : '';
  const title = $('h1').first().text().trim() || undefined;
  return { title, body };
}

/**
 * Nettoie le markup UG : [ch]Am[/ch] → Am, [tab]…[/tab] → contenu nu,
 * normalise les retours à la ligne.
 */
function cleanUgMarkup(raw: string): string {
  return raw
    .replace(/\[ch\]/g, '')
    .replace(/\[\/ch\]/g, '')
    .replace(/\[tab\]/g, '')
    .replace(/\[\/tab\]/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
