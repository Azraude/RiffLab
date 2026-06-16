/**
 * /battle — riff battle hebdomadaire (sess 29 Phase 4).
 *
 * Battle en cours : 2 riff cards XL côte à côte + barre votes %
 * animée + countdown jusqu'à ends_at + bouton vote.
 *
 * Battles passées : 5 derniers avec winner.
 *
 * Création des battles : pour l'instant SQL manual cf
 * docs/BATTLE-WEEKLY-CREATION.md (à exécuter chaque lundi). Cron edge
 * function Supabase à faire plus tard.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Trophy, Clock, Music2 } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import {
  getCurrentBattle,
  getPastBattles,
  voteBattle,
  type BattleWithRiffs,
  type Battle as BattleType,
} from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';

export function Battle() {
  const me = useAuth((s) => s.user);
  const toast = useToast();
  const [battle, setBattle] = useState<BattleWithRiffs | null | undefined>(undefined);
  const [past, setPast] = useState<BattleType[]>([]);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBattle(null);
      return;
    }
    void (async () => {
      const [bat, pst] = await Promise.all([getCurrentBattle(), getPastBattles(5)]);
      setBattle(bat.data);
      setPast(pst.data ?? []);
    })();
  }, []);

  const handleVote = async (riffId: string) => {
    if (!battle || !me) {
      if (!me) toast.warning('Connecte-toi pour voter');
      return;
    }
    if (battle.my_vote) {
      toast.info('Tu as déjà voté pour cette battle');
      return;
    }
    setVoting(true);
    const { error } = await voteBattle(battle.id, riffId);
    setVoting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Vote enregistré 🎸');
      // Reload battle pour mettre à jour compteurs
      const { data } = await getCurrentBattle();
      setBattle(data);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="⚔️ Battle de la semaine" />
        <Card>
          <p className="text-sm text-text-muted">
            Les battles nécessitent Supabase configuré.
          </p>
        </Card>
      </>
    );
  }

  if (battle === undefined) {
    return (
      <>
        <PageHeader title="⚔️ Battle de la semaine" />
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="⚔️ Riff Battle"
        subtitle="Une battle par semaine — vote pour ton riff préféré, le gagnant entre dans la légende RiffLab."
      />

      {!battle ? (
        <Card className="text-center">
          <Swords size={32} className="mx-auto text-text-soft" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-text-muted">
            Pas de battle en cours cette semaine. La prochaine arrive lundi !
          </p>
        </Card>
      ) : (
        <BattleArena battle={battle} onVote={handleVote} voting={voting} />
      )}

      {/* Past battles */}
      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="display mb-4 text-display-sm">Battles passées</h2>
          <ul className="space-y-2">
            {past.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm"
              >
                <span className="text-text-muted">
                  Semaine {b.week_number}, {b.year}
                </span>
                {b.winner_riff_id ? (
                  <Link
                    to={`/riffs/${b.winner_riff_id}`}
                    className="inline-flex items-center gap-1 font-bold text-gold hover:underline"
                  >
                    <Trophy size={13} /> Voir gagnant
                  </Link>
                ) : (
                  <span className="text-xs text-text-soft">Pas de gagnant déclaré</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// ─── Arena ──────────────────────────────────────────────────────────

function BattleArena({
  battle,
  onVote,
  voting,
}: {
  battle: BattleWithRiffs;
  onVote: (riffId: string) => void;
  voting: boolean;
}) {
  const total = battle.votes_a + battle.votes_b;
  const pctA = total > 0 ? Math.round((battle.votes_a / total) * 100) : 50;
  const pctB = 100 - pctA;

  const countdown = useMemo(() => {
    const ms = new Date(battle.ends_at).getTime() - Date.now();
    if (ms <= 0) return 'Terminé';
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    if (days > 0) return `${days}j ${hours}h restantes`;
    if (hours > 0) return `${hours}h ${mins}min restantes`;
    return `${mins} min restantes`;
  }, [battle.ends_at]);

  return (
    <div>
      {/* Countdown */}
      <div className="mb-5 flex items-center justify-center gap-2 text-sm text-text-muted">
        <Clock size={14} className="text-gold" />
        <span>{countdown}</span>
        <span className="text-text-soft">
          · {total} vote{total > 1 ? 's' : ''} total
        </span>
      </div>

      {/* Cards XL côte à côte */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <BattleSide
          riff={battle.riff_a}
          votes={battle.votes_a}
          pct={pctA}
          side="A"
          selected={battle.my_vote === battle.riff_a_id}
          disabled={!!battle.my_vote || voting}
          onVote={() => onVote(battle.riff_a_id)}
        />
        <div className="flex items-center justify-center">
          <div className="display text-4xl text-gold-soft">VS</div>
        </div>
        <BattleSide
          riff={battle.riff_b}
          votes={battle.votes_b}
          pct={pctB}
          side="B"
          selected={battle.my_vote === battle.riff_b_id}
          disabled={!!battle.my_vote || voting}
          onVote={() => onVote(battle.riff_b_id)}
        />
      </div>

      {/* Barre votes */}
      <div className="mt-6">
        <div className="flex h-6 overflow-hidden rounded-full bg-bg">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pctA}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center justify-end bg-gradient-to-r from-gold to-gold-bright pr-2 font-mono text-[10px] font-bold text-bg"
          >
            {pctA > 8 && `${pctA}%`}
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pctB}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center justify-start bg-gradient-to-r from-danger to-[#e8a04b] pl-2 font-mono text-[10px] font-bold text-bg"
          >
            {pctB > 8 && `${pctB}%`}
          </motion.div>
        </div>
        <div className="mt-2 flex justify-between text-xs font-mono">
          <span className="text-gold">A — {battle.votes_a} votes</span>
          <span className="text-danger">B — {battle.votes_b} votes</span>
        </div>
      </div>

      {battle.my_vote && (
        <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-center text-sm text-gold">
          ✓ Ton vote est enregistré pour le riff{' '}
          <strong>{battle.my_vote === battle.riff_a_id ? 'A' : 'B'}</strong>.
        </div>
      )}
    </div>
  );
}

function BattleSide({
  riff,
  votes,
  pct,
  side,
  selected,
  disabled,
  onVote,
}: {
  riff: BattleWithRiffs['riff_a'];
  votes: number;
  pct: number;
  side: 'A' | 'B';
  selected: boolean;
  disabled: boolean;
  onVote: () => void;
}) {
  if (!riff) {
    return (
      <Card className="flex items-center justify-center text-center text-text-soft">
        Riff manquant
      </Card>
    );
  }
  const accent = side === 'A' ? 'gold' : 'danger';
  return (
    <Card
      className={clsx(
        'flex flex-col',
        selected && accent === 'gold' && 'border-gold/60 bg-gold/8',
        selected && accent === 'danger' && 'border-danger/60 bg-danger/8'
      )}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span
          className={clsx(
            'font-mono text-2xl font-bold',
            accent === 'gold' ? 'text-gold' : 'text-danger'
          )}
        >
          {side}
        </span>
        <span className="font-mono text-xs text-text-soft">
          {votes} votes · {pct}%
        </span>
      </div>

      <Link to={`/riffs/${riff.id}`} className="block flex-1 hover:opacity-90">
        <h3 className="display text-display-sm leading-tight">{riff.title}</h3>
        {riff.artist && (
          <p className="mt-0.5 text-sm text-text-muted">{riff.artist}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Music2 size={12} className="text-gold" />
            <span className="font-mono">{riff.bpm} BPM</span>
          </span>
          <span className="capitalize">{riff.difficulty}</span>
        </div>
      </Link>

      <button
        type="button"
        onClick={onVote}
        disabled={disabled}
        className={clsx(
          'mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all',
          selected
            ? accent === 'gold'
              ? 'bg-gold text-bg'
              : 'bg-danger text-bg'
            : accent === 'gold'
              ? 'border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
              : 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
          disabled && !selected && 'opacity-50'
        )}
      >
        {selected ? '✓ Voté' : `Voter ${side}`}
      </button>
    </Card>
  );
}
