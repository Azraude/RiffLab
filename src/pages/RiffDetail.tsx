/**
 * /riffs/:id — page détail d'un riff = écran de pratique #1.
 *
 * Refonte design Phase 2 (2026-06-25) :
 *  - Header simple (back + menu ⋯ → Apprendre / Partager)
 *  - Titre serif + artiste + auteur + bouton Suivre
 *  - Note de l'auteur (caption) en citation dorée
 *  - UN SEUL bouton "Lire avec l'audio" + temps / tonalité / BPM
 *  - Tab COMPLÈTE scrollable, tête de lecture dorée + auto-scroll synchro,
 *    techniques colorées (h/p/slide/bend/vibrato)
 *  - Légende techniques + annotations horodatées cliquables (seek)
 *  - Barre actions sociales (like / comment / save / share)
 *
 * Moteur HYBRIDE : `useAudioSync` pilote l'horloge (playhead + annotations),
 * et on déclenche en parallèle la synthèse note-à-note (Tone.js via useAudio)
 * tant qu'aucun vrai fichier audio n'est uploadé → on garde le son.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  AudioLines,
  Bookmark,
  ChevronLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Quote,
  Share2,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import { LearnRiffMode } from '@/components/riffs/LearnRiffMode';
import { ShareDrawer } from '@/components/share/ShareDrawer';
import { CommentsSection } from '@/components/social/CommentsSection';
import { FollowButton } from '@/components/social/FollowButton';
import { TabReader } from '@/components/tabs/TabReader';
import { AnnotationList, fmtTime } from '@/components/riffs/AnnotationList';
import {
  COMMUNITY_RIFFS,
  difficultyToLevel,
  formatRelativeDate,
  getCommunityRiff,
  getRiffAnnotations,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type CommunityRiff,
} from '@/lib/communityRiffs';
import { flattenTab, getTab, tabNoteToMidi } from '@/lib/tabsDatabase';
import {
  isRiffBookmarked,
  isRiffLiked,
  isRiffMastered,
  listMasteredRiffs,
  toggleRiffBookmark,
  toggleRiffLike,
} from '@/lib/db';
import { useAudio } from '@/hooks/useAudio';
import { useAudioSync } from '@/hooks/useAudioSync';

/** Légende des techniques affichées sur la tab. */
const TECHNIQUE_LEGEND: { glyph: string; label: string }[] = [
  { glyph: 'h', label: 'hammer-on' },
  { glyph: 'p', label: 'pull-off' },
  { glyph: '/', label: 'slide up' },
  { glyph: '\\', label: 'slide down' },
  { glyph: 'b', label: 'bend' },
  { glyph: '~', label: 'vibrato' },
];

export function RiffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = id ? getCommunityRiff(id) : null;

  const [shareOpen, setShareOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const commentsRef = useRef<HTMLDivElement | null>(null);

  const liked = useLiveQuery(() => (id ? isRiffLiked(id) : Promise.resolve(false)), [id]) ?? false;
  const bookmarked =
    useLiveQuery(() => (id ? isRiffBookmarked(id) : Promise.resolve(false)), [id]) ?? false;
  const mastered = useLiveQuery(() => (id ? isRiffMastered(id) : Promise.resolve(undefined)), [id]);
  const masteredRows = useLiveQuery(() => listMasteredRiffs(), []) ?? [];
  const masteredMap = useMemo(
    () => new Map(masteredRows.map((m) => [m.id, m.masteredAt] as const)),
    [masteredRows]
  );

  const moreByUser = useMemo(() => {
    if (!data) return [];
    return COMMUNITY_RIFFS.filter(
      (r) => r.contributor === data.riff.contributor && r.id !== data.riff.id
    ).slice(0, 3);
  }, [data?.riff.id]);

  const similar = useMemo(() => {
    if (!data) return [];
    return COMMUNITY_RIFFS.filter((r) => {
      if (r.id === data.riff.id) return false;
      const tagOverlap = r.tags.some((t) => data.riff.tags.includes(t));
      const closeDifficulty = Math.abs(r.difficulty - data.riff.difficulty) <= 1;
      return tagOverlap && closeDifficulty;
    })
      .sort((a, b) => b.baseLikes - a.baseLikes)
      .slice(0, 3);
  }, [data?.riff.id]);

  // ─── Horloge de lecture (hybride sim + synthèse) ───
  const { playMidi } = useAudio();
  const playMidiRef = useRef(playMidi);
  playMidiRef.current = playMidi;

  // Durée musicale réelle : totalBeats (16e) × secondes-par-16e (15 / tempo).
  const secPerBeat = data ? 15 / data.tab.tempo : 0.12;
  const totalBeats = data ? data.tab.measures.length * 16 : 0;
  const duration = Math.max(1, totalBeats * secPerBeat);
  const audio = useAudioSync({ duration, audioUrl: data?.riff.audio_url });

  const noteEvents = useMemo(() => {
    if (!data) return [] as { t: number; midi: number }[];
    return flattenTab(data.tab).map((n) => ({
      t: n.absoluteBeat * secPerBeat,
      midi: tabNoteToMidi(n, data.riff.capo ?? 0),
    }));
  }, [data?.tab, secPerBeat, data?.riff.capo]);

  // Synthèse note-à-note synchronisée sur l'horloge (mode simulé uniquement).
  // Pointeur monotone + détection de saut (seek) pour éviter les rafales.
  const firedRef = useRef(0);
  const lastTimeRef = useRef(0);
  useEffect(() => {
    if (!audio.isSimulated) return;
    const t = audio.currentTime;
    const jumped = Math.abs(t - lastTimeRef.current) > 0.3;
    lastTimeRef.current = t;
    if (jumped || !audio.isPlaying) {
      const idx = noteEvents.findIndex((e) => e.t >= t - 1e-6);
      firedRef.current = idx < 0 ? noteEvents.length : idx;
      if (!audio.isPlaying) return;
    }
    while (firedRef.current < noteEvents.length && noteEvents[firedRef.current].t <= t + 1e-6) {
      void playMidiRef.current(noteEvents[firedRef.current].midi);
      firedRef.current++;
    }
  }, [audio.currentTime, audio.isPlaying, audio.isSimulated, noteEvents]);

  if (!data) {
    return <Navigate to="/riffs" replace />;
  }
  const { riff, tab } = data;
  const level = difficultyToLevel(riff.difficulty);
  const likeCount = riff.baseLikes + (liked ? 1 : 0);
  const annotations = getRiffAnnotations(riff.id);
  const authorId = riff.contributor.replace('@', '');
  const progress = duration > 0 ? (audio.currentTime / duration) * 100 : 0;

  const handleSeekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.seekTo(ratio * duration);
  };

  return (
    <>
      {/* === Header simple : back + menu ⋯ === */}
      <header className="sticky top-0 z-20 -mx-5 -mt-6 flex items-center justify-between border-b border-border bg-bg/90 px-3 py-2 backdrop-blur-md md:-mx-12 md:px-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-gold-soft hover:text-text"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Plus d'options"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-gold-soft hover:text-text"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden />
              <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-gold-strong">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setLearnOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-text hover:bg-surface-2"
                >
                  <Target size={16} className="text-gold" /> Apprendre ce riff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShareOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-border px-4 py-3 text-left text-sm text-text hover:bg-surface-2"
                >
                  <Share2 size={16} className="text-gold" /> Partager
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="pb-28 md:pb-12">
        {/* === Titre + artiste === */}
        <section className="pt-5">
          <h1 className="display text-3xl leading-tight text-text">{tab.name}</h1>
          {tab.artist && <p className="mt-1 text-base text-text-muted">{tab.artist}</p>}

          {/* Row auteur + suivre */}
          <div className="mt-4 flex items-center gap-3">
            <Link to={`/u/${authorId}`} className="shrink-0" aria-label={`Profil ${riff.contributor}`}>
              <Avatar name={riff.contributor} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to={`/u/${authorId}`}
                className="block font-mono text-sm font-bold text-text hover:text-gold"
              >
                {riff.contributor}
              </Link>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-soft">
                <span aria-label={`${riff.difficulty} sur 5`}>{'⭐'.repeat(riff.difficulty)}</span>
                <span
                  className={clsx(
                    'rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider',
                    LEVEL_COLORS[level]
                  )}
                >
                  {LEVEL_LABELS[level]}
                </span>
                {mastered && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[9px] font-bold text-gold">
                    <Trophy size={10} /> Maîtrisé
                  </span>
                )}
              </div>
            </div>
            <FollowButton userId={authorId} username={authorId} variant="compact" />
          </div>
        </section>

        {/* === Note de l'auteur (citation dorée) === */}
        {riff.caption && (
          <section className="pt-5">
            <div className="relative rounded-2xl border border-y-border border-r-border border-l-4 border-l-gold bg-surface-2 p-4">
              <Quote size={14} className="absolute left-3 top-3 text-gold/40" />
              <div className="eyebrow pl-5">Note de l'auteur</div>
              <p className="mt-1 pl-5 text-sm italic leading-relaxed text-text-muted">{riff.caption}</p>
            </div>
          </section>
        )}

        {/* === UN SEUL BOUTON "Lire avec l'audio" === */}
        <section className="mt-5 rounded-2xl border border-gold/30 bg-surface-2 p-4">
          <button
            type="button"
            onClick={audio.togglePlay}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-gold-bright to-gold text-base font-bold text-bg shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-transform active:scale-[0.98]"
            aria-label={audio.isPlaying ? 'Pause' : "Lire avec l'audio"}
          >
            {audio.isPlaying ? <Pause size={22} fill="currentColor" /> : <AudioLines size={22} />}
            <span>{audio.isPlaying ? 'Pause' : "Lire avec l'audio"}</span>
          </button>

          {/* Barre de progression seekable */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Position de lecture"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            onClick={handleSeekBar}
            className="relative mt-3 h-1.5 cursor-pointer overflow-hidden rounded-full bg-bg"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-gold-bright"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-3 text-sm">
            <span className="font-mono text-text-muted">
              {fmtTime(audio.currentTime)} / {fmtTime(duration)}
            </span>
            <span className="text-text-soft">·</span>
            <span className="font-mono text-gold">{tab.key}</span>
            <span className="text-text-soft">·</span>
            <span className="font-mono text-text-muted">♩ {tab.tempo}</span>
          </div>
        </section>

        {/* === Tab COMPLÈTE scrollable + tête de lecture + auto-scroll === */}
        <section className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface px-3 py-4">
            <TabReader
              tab={tab}
              lineHeight={20}
              beatWidth={18}
              autoScroll
              showPlayhead
              showTechniques
              currentTime={audio.currentTime}
              duration={duration}
              onSeek={audio.seekTo}
            />
          </div>
          <p className="mt-1.5 text-center text-[10px] text-text-soft md:hidden">
            ← swipe pour voir la suite du tab · tape la tab ou une annotation pour te déplacer →
          </p>
        </section>

        {/* === Légende techniques === */}
        <section className="mt-3 rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-soft">
            Techniques
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
            {TECHNIQUE_LEGEND.map((t) => (
              <div key={t.label}>
                <span className="font-bold text-gold-bright">{t.glyph}</span>{' '}
                <span className="text-text-muted">= {t.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* === Annotations horodatées === */}
        <AnnotationList
          annotations={annotations}
          currentTime={audio.currentTime}
          onSeek={audio.seekTo}
        />

        {/* === Commentaires === */}
        <section ref={commentsRef} className="space-y-3 pt-8 scroll-mt-20">
          <h3 className="display text-display-sm">
            Commentaires
            {(riff.commentsCount ?? 0) > 0 && (
              <span className="ml-2 font-mono text-base text-text-soft">({riff.commentsCount})</span>
            )}
          </h3>
          <CommentsSection riffId={riff.id} />
        </section>

        {/* === Plus de @user / similaires === */}
        {moreByUser.length > 0 && (
          <section className="mt-8 space-y-3">
            <h3 className="display text-display-sm">Plus de {riff.contributor}</h3>
            <div className="space-y-3">
              {moreByUser.map((r) => {
                const t = getTab(r.tabId);
                if (!t) return null;
                return (
                  <RelatedRiffRow
                    key={r.id}
                    riff={r}
                    tabName={t.name}
                    tabArtist={t.artist}
                    bpm={t.tempo}
                    masteredAt={masteredMap.get(r.id) ?? null}
                  />
                );
              })}
            </div>
          </section>
        )}
        {similar.length > 0 && (
          <section className="mt-8 space-y-3">
            <h3 className="display text-display-sm">Riffs similaires</h3>
            <div className="space-y-3">
              {similar.map((r) => {
                const t = getTab(r.tabId);
                if (!t) return null;
                return (
                  <RelatedRiffRow
                    key={r.id}
                    riff={r}
                    tabName={t.name}
                    tabArtist={t.artist}
                    bpm={t.tempo}
                    masteredAt={masteredMap.get(r.id) ?? null}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* === Barre actions sociales sticky bas (au-dessus du MobileNav) === */}
      <footer className="sticky z-30 -mx-5 flex items-center justify-around border-t border-border bg-bg/90 px-4 py-2 backdrop-blur-md [bottom:calc(72px+env(safe-area-inset-bottom))] md:-mx-12 md:px-12 md:[bottom:0px]">
        <ActionButton
          icon={<Heart size={20} fill={liked ? 'currentColor' : 'none'} />}
          count={likeCount}
          active={liked}
          activeColor="danger"
          label={liked ? 'Aimé' : "J'aime"}
          onClick={() => void toggleRiffLike(riff.id)}
        />
        <ActionButton
          icon={<MessageCircle size={20} />}
          count={riff.commentsCount ?? 0}
          label="Commentaires"
          onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />
        <ActionButton
          icon={<Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />}
          active={bookmarked}
          activeColor="gold"
          label={bookmarked ? 'Sauvegardé' : 'Sauver'}
          onClick={() => void toggleRiffBookmark(riff.id)}
        />
        <ActionButton
          icon={<Share2 size={20} />}
          label="Partager"
          onClick={() => setShareOpen(true)}
        />
      </footer>

      <ShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        item={{
          type: 'riff',
          title: tab.name,
          url: typeof window !== 'undefined' ? window.location.href : '',
        }}
      />

      <LearnRiffMode open={learnOpen} onClose={() => setLearnOpen(false)} riff={riff} tab={tab} />
    </>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initial = (name.replace('@', '')[0] ?? '?').toUpperCase();
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-sm font-bold text-gold"
      aria-hidden="true"
    >
      {initial === '?' ? <User size={16} /> : initial}
    </span>
  );
}

function ActionButton({
  icon,
  count,
  active,
  activeColor = 'gold',
  label,
  onClick,
}: {
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  activeColor?: 'gold' | 'danger';
  label: string;
  onClick: () => void;
}) {
  const activeCls = activeColor === 'danger' ? 'text-danger' : 'text-gold-bright';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count !== undefined && count > 0 ? `${label} (${count})` : label}
      className={clsx(
        'inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface',
        active ? activeCls : 'text-text-muted hover:text-text'
      )}
    >
      {icon}
      {count !== undefined && count > 0 && (
        <span className="font-mono tabular-nums">{formatCount(count)}</span>
      )}
    </button>
  );
}

function RelatedRiffRow({
  riff,
  tabName,
  tabArtist,
  bpm,
  masteredAt,
}: {
  riff: CommunityRiff;
  tabName: string;
  tabArtist?: string;
  bpm: number;
  masteredAt: number | null;
}) {
  return (
    <Link
      to={`/riffs/${riff.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 transition-colors hover:border-gold-soft"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="display truncate text-base text-text">{tabName}</span>
          {masteredAt && <Trophy size={12} className="shrink-0 text-gold" fill="currentColor" />}
        </div>
        {tabArtist && <div className="truncate text-xs text-text-muted">{tabArtist}</div>}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-sm font-bold text-gold">{bpm}</div>
        <div className="text-[9px] uppercase tracking-wider text-text-soft">BPM</div>
      </div>
    </Link>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
}
