import { Card } from '@/components/ui/Card';
import { ChordDiagram } from './ChordDiagram';
import type { Chord } from '@/lib/chordDatabase';

interface ChordCardProps {
  chord: Chord;
  onClick?: () => void;
  showDifficulty?: boolean;
}

export function ChordCard({ chord, onClick, showDifficulty = false }: ChordCardProps) {
  const voicing = chord.voicings[0];
  return (
    <Card
      hover
      className="cursor-pointer text-center"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="font-mono text-xl font-bold text-gold">{chord.name}</div>
      <div className="mt-3 flex justify-center">
        <ChordDiagram voicing={voicing} name={chord.name} size="md" />
      </div>
      {showDifficulty && (
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={
                'h-1.5 w-3 rounded-full ' + (i < voicing.difficulty ? 'bg-gold' : 'bg-border')
              }
            />
          ))}
        </div>
      )}
    </Card>
  );
}
