/**
 * PracticeHeatmap — GitHub-style année calendaire (52 colonnes × 7 lignes).
 *
 * Chaque cellule = 1 jour. Couleur 5 paliers : gris (0 sessions) → gold
 * progressif (1, 2, 3, 4+ sessions). Tooltip natif via `<title>` SVG.
 *
 * Layout : colonnes verticales (lundi en haut, dimanche en bas) pour
 * matcher la convention GitHub et faciliter le scan visuel.
 */

interface PracticeHeatmapProps {
  /** Tableau de 365 jours, du plus ancien au plus récent. */
  days: { date: string; count: number }[];
  /** Hauteur d'une cellule en px. Défaut 12. */
  cellSize?: number;
  /** Espacement entre cellules en px. Défaut 2. */
  cellGap?: number;
}

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function intensityClass(count: number): string {
  if (count === 0) return 'fill-surface-2';
  if (count === 1) return 'fill-gold/30';
  if (count === 2) return 'fill-gold/55';
  if (count === 3) return 'fill-gold/80';
  return 'fill-gold-bright';
}

export function PracticeHeatmap({
  days,
  cellSize = 12,
  cellGap = 2,
}: PracticeHeatmapProps) {
  // Le premier jour est il y a 365 jours. On veut l'aligner pour que
  // chaque colonne représente une semaine (lundi en haut). On padding
  // au début pour décaler le premier jour à sa position dow correcte.
  const firstDate = days.length > 0 ? new Date(days[0].date) : new Date();
  // ISO weekday : 1=lundi … 7=dimanche
  const firstDow = ((firstDate.getDay() + 6) % 7); // 0=lundi … 6=dimanche
  const totalCells = firstDow + days.length;
  const numCols = Math.ceil(totalCells / 7);
  const w = numCols * (cellSize + cellGap);
  const h = 7 * (cellSize + cellGap) + 16; // +16 pour les labels mois

  // Mois labels : on prend le 1er jour de chaque mois et on calcule son x
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  for (let i = 0; i < days.length; i++) {
    const d = new Date(days[i].date);
    if (d.getMonth() !== lastMonth) {
      const cellIdx = firstDow + i;
      const col = Math.floor(cellIdx / 7);
      monthLabels.push({
        x: col * (cellSize + cellGap),
        label: MONTHS[d.getMonth()],
      });
      lastMonth = d.getMonth();
    }
  }

  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <svg
        width={w + 8}
        height={h}
        viewBox={`0 0 ${w + 8} ${h}`}
        className="block"
        aria-label="Heatmap de pratique sur 365 jours"
      >
        {/* Mois labels en haut */}
        {monthLabels.map((m, i) => (
          <text
            key={`${m.label}-${i}`}
            x={m.x}
            y={10}
            className="fill-text-soft font-mono"
            style={{ fontSize: 9 }}
          >
            {m.label}
          </text>
        ))}

        <g transform="translate(0, 16)">
          {days.map((d, i) => {
            const cellIdx = firstDow + i;
            const col = Math.floor(cellIdx / 7);
            const row = cellIdx % 7;
            const x = col * (cellSize + cellGap);
            const y = row * (cellSize + cellGap);
            return (
              <rect
                key={d.date}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                className={`${intensityClass(d.count)} transition-colors`}
              >
                <title>
                  {d.date} — {d.count} session{d.count > 1 ? 's' : ''}
                </title>
              </rect>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-text-soft">
        <span>Moins</span>
        {[0, 1, 2, 3, 4].map((c) => (
          <span
            key={c}
            className={`inline-block h-3 w-3 rounded-sm ${intensityClass(c)}`}
          />
        ))}
        <span>Plus</span>
      </div>
    </div>
  );
}
