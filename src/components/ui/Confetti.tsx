/**
 * Confetti — petite explosion de particules dorées CSS-only, déclenchée
 * en passant `trigger` (clé qui change pour relancer l'animation).
 *
 * Léger (no JS runtime au-delà du tick initial). Le composant se monte
 * fixed inset-0 pointer-events-none, donc tu peux le poser n'importe où
 * et il occupera le viewport entier juste pour ses particules.
 */
import { useEffect, useState } from 'react';

interface ConfettiProps {
  /** Quand cette valeur change, l'animation est rejouée. */
  trigger: number;
  /** Nombre de particules. Défaut 40. */
  count?: number;
  /** Durée totale en secondes. Défaut 1.6. */
  duration?: number;
}

export function Confetti({ trigger, count = 40, duration = 1.6 }: ConfettiProps) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    setActive(trigger);
    const t = setTimeout(() => setActive(null), duration * 1000 + 100);
    return () => clearTimeout(t);
  }, [trigger, duration]);

  if (active === null) return null;

  // Génère des positions de particules pseudo-aléatoires (déterministes
  // sur le seed `active` pour pas de re-shuffle entre renders)
  const particles = Array.from({ length: count }, (_, i) => {
    const seed = active * 7919 + i * 13;
    const angle = (seed % 360) * (Math.PI / 180);
    const distance = 120 + (seed % 180); // 120-300px
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 100; // bias vers le haut
    const size = 4 + (seed % 4); // 4-7px
    const isStar = i % 3 === 0;
    const delay = (i % 5) * 0.02;
    return { dx, dy, size, isStar, delay };
  });

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
      aria-hidden
    >
      {particles.map((p, i) => (
        <span
          key={`${active}-${i}`}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.isStar
              ? 'rgb(var(--gold-bright))'
              : 'rgb(var(--gold))',
            borderRadius: p.isStar ? '999px' : '2px',
            boxShadow: '0 0 8px rgb(var(--gold-glow) / 0.6)',
            animation: `confetti-burst ${duration}s ease-out ${p.delay}s forwards`,
            // Pass animation target via custom props (CSS vars)
            // @ts-expect-error CSS custom properties not in TS type
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-burst {
          0% {
            transform: translate(0, 0) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), calc(var(--dy) + 200px)) scale(1) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
