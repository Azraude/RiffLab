/**
 * Setlist PDF export — chord chart imprimable A4.
 *
 * Format :
 * - 1 song par page (page break entre songs pour la répèt sans avoir à
 *   tourner la page au milieu d'un morceau)
 * - Header titre serif gold + artiste / key / BPM / capo en ligne meta
 * - Sections : nom + chord chart aligné en grille tab-stop monospace
 * - Strum pattern en ASCII D U X . si présent
 * - Footer : "Setlist '<name>' — RiffLab" + numéro page
 *
 * Mode "imprimer en noir" (default ON) : remplace les couleurs gold par
 * du gris foncé pour économiser l'encre des imprimantes couleur.
 *
 * jsPDF est chargé en lazy import pour ne pas alourdir le bundle initial
 * (~80 KB gzip).
 */
import type { Setlist, Song, StrumDir } from './db';

export type PdfOptions = {
  /** Mode noir uniquement (économie encre). Default true. */
  inkSaver?: boolean;
};

const A4_W = 210; // mm
const A4_H = 297;
const MARGIN = 20;
const CONTENT_W = A4_W - MARGIN * 2;
const CONTENT_H = A4_H - MARGIN * 2;

// Couleurs gold (RGB)
const GOLD: [number, number, number] = [212, 183, 106];
const GOLD_BRIGHT: [number, number, number] = [245, 217, 122];
const GREY_DARK: [number, number, number] = [40, 40, 40];
const GREY_MED: [number, number, number] = [110, 110, 110];

function strumDirToChar(d: StrumDir): string {
  switch (d) {
    case 'down':
      return 'D';
    case 'up':
      return 'U';
    case 'mute':
      return 'X';
    case 'rest':
      return '.';
  }
}

/**
 * Génère et télécharge le PDF pour une setlist + ses songs ordonnées.
 * Async parce que jsPDF est lazy-loaded depuis npm pour ne pas peser
 * sur le bundle initial des users qui n'exportent jamais.
 */
export async function exportSetlistToPdf(
  setlist: Setlist,
  songs: Song[],
  options: PdfOptions = {},
): Promise<void> {
  const inkSaver = options.inkSaver ?? true;
  const titleColor = inkSaver ? GREY_DARK : GOLD;
  const sectionColor = inkSaver ? GREY_DARK : GOLD;
  const chordColor = inkSaver ? GREY_DARK : GOLD_BRIGHT;
  const metaColor = GREY_MED;

  // Lazy import jsPDF pour le code splitting
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  const drawFooter = (pageIdx: number, total: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...metaColor);
    const footer = `Setlist "${setlist.name}" — généré par RiffLab`;
    doc.text(footer, MARGIN, A4_H - 10);
    doc.text(`${pageIdx} / ${total}`, A4_W - MARGIN, A4_H - 10, { align: 'right' });
  };

  if (songs.length === 0) {
    // Page vide informative
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...GREY_MED);
    doc.text('Setlist vide — ajoute des sons avant d\'exporter.', A4_W / 2, A4_H / 2, {
      align: 'center',
    });
    drawFooter(1, 1);
    doc.save(filename(setlist.name));
    return;
  }

  songs.forEach((song, songIdx) => {
    if (songIdx > 0) doc.addPage();
    let y = MARGIN;

    // Header song : titre en gros + meta en ligne
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...titleColor);
    const title = song.title || 'Sans titre';
    doc.text(title, MARGIN, y + 8);
    y += 12;

    // Meta : artiste · key · BPM · capo
    const metaParts: string[] = [];
    if (song.artist) metaParts.push(song.artist);
    metaParts.push(`${song.key} ${song.mode === 'minor' ? 'minor' : 'major'}`);
    metaParts.push(`${song.tempo} BPM`);
    if (song.capo > 0) metaParts.push(`Capo ${song.capo}`);
    if (song.tuning && song.tuning !== 'standard') metaParts.push(`Accordage : ${song.tuning}`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...metaColor);
    doc.text(metaParts.join('  ·  '), MARGIN, y);
    y += 6;

    // Ligne de séparation
    doc.setDrawColor(...metaColor);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, A4_W - MARGIN, y);
    y += 8;

    // Sections
    song.sections.forEach((section) => {
      // Page break si on n'a plus la place pour le header de section + 2 lignes
      if (y > A4_H - 40) {
        drawFooter(doc.getNumberOfPages(), 0); // total mis à jour à la fin
        doc.addPage();
        y = MARGIN;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...sectionColor);
      doc.text(section.name, MARGIN, y);
      y += 6;

      // Chord chart : grille tab-stop, accord + "× beats"
      // On affiche 4-6 accords par ligne selon largeur
      const chordCellW = 26; // mm par cellule
      const chordsPerLine = Math.floor(CONTENT_W / chordCellW);
      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...chordColor);
      section.chords.forEach((chord, ci) => {
        const col = ci % chordsPerLine;
        const row = Math.floor(ci / chordsPerLine);
        const x = MARGIN + col * chordCellW;
        const yy = y + row * 7;
        // chord name
        doc.text(chord.name, x, yy);
        // beats subscript
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...metaColor);
        doc.text(`×${chord.beats}`, x + 12, yy);
        doc.setFont('courier', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...chordColor);
      });
      const chordRows = Math.ceil(section.chords.length / chordsPerLine);
      y += chordRows * 7 + 2;

      // Strum pattern si présent
      if (section.strumPattern && section.strumPattern.beats.length > 0) {
        doc.setFont('courier', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...metaColor);
        const ascii = section.strumPattern.beats.map(strumDirToChar).join(' ');
        doc.text(`Rythmique : ${ascii}`, MARGIN, y);
        y += 5;
      }

      // Lyrics si présentes
      if (section.lyrics) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...GREY_DARK);
        const lines = doc.splitTextToSize(section.lyrics, CONTENT_W);
        // Page break si lyrics ne tient pas
        for (const line of lines) {
          if (y > A4_H - 25) {
            drawFooter(doc.getNumberOfPages(), 0);
            doc.addPage();
            y = MARGIN;
          }
          doc.text(line, MARGIN, y);
          y += 4;
        }
        y += 2;
      }

      y += 4; // espacement entre sections
    });

    // Notes du song (en bas de la dernière section)
    if (song.notes && y < A4_H - 30) {
      y += 4;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...metaColor);
      doc.text('Notes :', MARGIN, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(song.notes, CONTENT_W);
      for (const line of noteLines) {
        if (y > A4_H - 20) break;
        doc.text(line, MARGIN, y);
        y += 4;
      }
    }
  });

  // Re-draw footers avec total final correct
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    // Effacer ancien footer (rectangle blanc par-dessus)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, A4_H - 14, A4_W, 14, 'F');
    drawFooter(i, total);
  }

  doc.save(filename(setlist.name));
}

function filename(name: string): string {
  const safe = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `Setlist-${safe || 'rifflab'}-${date}.pdf`;
}

// Silence unused warning in case CONTENT_H needs to be referenced later
void CONTENT_H;
