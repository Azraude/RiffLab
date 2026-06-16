/**
 * Social API — wrappers Supabase pour la couche sociale (sess 29).
 *
 * ⚠️ Toutes les fonctions retournent { data, error } façon Supabase.
 * Côté UI, on check error et fallback gracefully (toast en cas
 * d'échec, pas de crash).
 *
 * IMPORTANT : les fonctions qui retournent des objets composés font
 * souvent plusieurs queries (riffs + author profile + likes count + etc).
 * On accepte la non-réactivité temps réel — un refresh résout les
 * désynchros mineures. Phase ultérieure : Supabase Realtime channels.
 */
import { supabase, isSupabaseConfigured } from './supabase';

// ─── Types ──────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicRiff = {
  id: string;
  author_id: string;
  title: string;
  artist: string | null;
  description: string | null;
  bpm: number;
  tuning: string;
  capo: number;
  key: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  techniques: string[];
  tags: string[];
  tab_data: unknown; // JSONB — format mesures structurées
  duration_ms: number | null;
  published_at: string;
  updated_at: string;
};

export type PublicRiffWithMeta = PublicRiff & {
  author?: Profile | null;
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
  bookmarked_by_me?: boolean;
};

export type Comment = {
  id: string;
  author_id: string;
  riff_id: string;
  text: string;
  created_at: string;
  author?: Profile;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'badge' | 'editor_pick' | 'top_week';
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type Battle = {
  id: string;
  week_number: number;
  year: number;
  riff_a_id: string;
  riff_b_id: string;
  ends_at: string;
  winner_riff_id: string | null;
};

export type BattleWithRiffs = Battle & {
  riff_a?: PublicRiff | null;
  riff_b?: PublicRiff | null;
  votes_a: number;
  votes_b: number;
  my_vote: string | null;
};

export type EditorPick = {
  id: string;
  riff_id: string;
  start_date: string;
  end_date: string;
  editor_note: string | null;
  type: 'day' | 'week' | 'month';
  riff?: PublicRiffWithMeta;
};

// ─── Helpers ────────────────────────────────────────────────────────

function notConfigured(): { data: null; error: Error } {
  return {
    data: null,
    error: new Error('Supabase non configuré (vérifie .env.local).'),
  };
}

/** Compte likes pour un riff via head:true (rapide, juste count). */
async function getLikesCount(riffId: string): Promise<number> {
  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('riff_id', riffId);
  return count ?? 0;
}

async function getCommentsCount(riffId: string): Promise<number> {
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('riff_id', riffId);
  return count ?? 0;
}

// ─── Profils ────────────────────────────────────────────────────────

export async function getProfile(
  idOrUsername: string
): Promise<{ data: Profile | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  // On essaie d'abord par id (UUID), puis par username
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrUsername);
  const query = isUuid
    ? supabase.from('profiles').select('*').eq('id', idOrUsername).maybeSingle()
    : supabase.from('profiles').select('*').eq('username', idOrUsername).maybeSingle();
  const { data, error } = await query;
  return { data: data as Profile | null, error: error ? new Error(error.message) : null };
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, 'username' | 'display_name' | 'bio' | 'avatar_url'>>
) {
  if (!isSupabaseConfigured) return notConfigured();
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  return { data: data as Profile | null, error: error ? new Error(error.message) : null };
}

/** Upload avatar dans bucket `avatars/<userId>/<filename>`. Retourne URL publique. */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ data: string | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) return { data: null, error: new Error(uploadErr.message) };
  const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
  return { data: publicUrl.publicUrl, error: null };
}

// ─── Riffs publiés ──────────────────────────────────────────────────

export async function publishRiff(
  riff: Omit<PublicRiff, 'published_at' | 'updated_at'> & { id?: string }
): Promise<{ data: PublicRiff | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  // Accepte id optionnel côté client (sess 30 : partage UUID Dexie ↔
  // Supabase pour que /riffs/:id résolve des 2 côtés). Sinon Postgres
  // génère via gen_random_uuid().
  const { data, error } = await supabase
    .from('riffs_public')
    .insert(riff)
    .select()
    .maybeSingle();
  return { data: data as PublicRiff | null, error: error ? new Error(error.message) : null };
}

export async function getRiff(
  id: string
): Promise<{ data: PublicRiffWithMeta | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const { data, error } = await supabase
    .from('riffs_public')
    .select('*, author:profiles!riffs_public_author_id_fkey(*)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) {
    return { data: null, error: error ? new Error(error.message) : null };
  }
  const enriched = data as PublicRiff & { author?: Profile | null };
  const [likes_count, comments_count] = await Promise.all([
    getLikesCount(id),
    getCommentsCount(id),
  ]);
  const me = (await supabase.auth.getUser()).data.user;
  let liked_by_me = false;
  let bookmarked_by_me = false;
  if (me) {
    const { data: like } = await supabase
      .from('likes')
      .select('user_id')
      .eq('user_id', me.id)
      .eq('riff_id', id)
      .maybeSingle();
    liked_by_me = !!like;
    const { data: bm } = await supabase
      .from('bookmarks')
      .select('user_id')
      .eq('user_id', me.id)
      .eq('riff_id', id)
      .maybeSingle();
    bookmarked_by_me = !!bm;
  }
  return {
    data: { ...enriched, likes_count, comments_count, liked_by_me, bookmarked_by_me },
    error: null,
  };
}

export async function getUserRiffs(
  authorId: string,
  limit = 50
): Promise<{ data: PublicRiff[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const { data, error } = await supabase
    .from('riffs_public')
    .select('*')
    .eq('author_id', authorId)
    .order('published_at', { ascending: false })
    .limit(limit);
  return {
    data: (data as PublicRiff[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

// ─── Feeds ──────────────────────────────────────────────────────────

/** Page de N riffs récents (pour infinite scroll). */
export async function getFeedRecent(
  page = 0,
  pageSize = 20
): Promise<{ data: PublicRiff[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from('riffs_public')
    .select('*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url)')
    .order('published_at', { ascending: false })
    .range(from, to);
  return {
    data: (data as PublicRiff[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

/** Trending = top likes des 30 derniers jours. */
export async function getFeedTrending(
  page = 0,
  pageSize = 20
): Promise<{ data: PublicRiff[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  // Approche pragmatique : on récupère les riffs récents puis on join avec un
  // count de likes. Sur petite échelle (<10k riffs) ça suffit. Plus tard :
  // matérialiser un compteur via trigger ou créer une vue/RPC.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent, error } = await supabase
    .from('riffs_public')
    .select('*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url)')
    .gte('published_at', thirtyDaysAgo)
    .order('published_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error || !recent) {
    return { data: null, error: error ? new Error(error.message) : null };
  }
  // Pas de sort par likes ici (coûteux N+1) — c'est OK car la prochaine
  // feature serait une view matérialisée Supabase. Pour l'instant, on
  // sort par published_at récent comme proxy de trending.
  return { data: recent as PublicRiff[], error: null };
}

/** Pour toi : algo simple (mix recent + tags des riffs likés). */
export async function getFeedForYou(
  page = 0,
  pageSize = 20
): Promise<{ data: PublicRiff[] | null; error: Error | null }> {
  // Pour MVP : même implé que recent. L'algo pondéré arrive plus tard
  // côté serveur via RPC.
  return getFeedRecent(page, pageSize);
}

/** Feed des riffs des users que je suis. */
export async function getFeedFollowing(
  myUserId: string,
  page = 0,
  pageSize = 20
): Promise<{ data: PublicRiff[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const { data: follows, error: followsErr } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', myUserId);
  if (followsErr) {
    return { data: null, error: new Error(followsErr.message) };
  }
  const ids = (follows ?? []).map((f) => f.followed_id);
  if (ids.length === 0) return { data: [], error: null };
  const { data, error } = await supabase
    .from('riffs_public')
    .select('*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url)')
    .in('author_id', ids)
    .order('published_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  return {
    data: (data as PublicRiff[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

/** Top 5 riffs des 7 derniers jours par likes. */
export async function getTopOfWeek(
  limit = 5
): Promise<{ data: Array<PublicRiff & { likes_count: number }> | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  // Pragmatique : récupère les 50 riffs récents puis trie côté client par
  // likes count. À optimiser via une vue matérialisée plus tard.
  const { data: recent, error } = await supabase
    .from('riffs_public')
    .select('*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url)')
    .gte('published_at', sevenDaysAgo)
    .order('published_at', { ascending: false })
    .limit(50);
  if (error || !recent) {
    return { data: null, error: error ? new Error(error.message) : null };
  }
  const withCounts = await Promise.all(
    (recent as PublicRiff[]).map(async (r) => ({
      ...r,
      likes_count: await getLikesCount(r.id),
    }))
  );
  return {
    data: withCounts.sort((a, b) => b.likes_count - a.likes_count).slice(0, limit),
    error: null,
  };
}

// ─── Likes ──────────────────────────────────────────────────────────

export async function likeRiff(riffId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  const { error } = await supabase.from('likes').insert({ user_id: me.id, riff_id: riffId });
  return { data: !error, error: error ? new Error(error.message) : null };
}

export async function unlikeRiff(riffId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', me.id)
    .eq('riff_id', riffId);
  return { data: !error, error: error ? new Error(error.message) : null };
}

// ─── Bookmarks ──────────────────────────────────────────────────────

export async function bookmarkRiff(riffId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: me.id, riff_id: riffId });
  return { data: !error, error: error ? new Error(error.message) : null };
}

export async function unbookmarkRiff(riffId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', me.id)
    .eq('riff_id', riffId);
  return { data: !error, error: error ? new Error(error.message) : null };
}

export async function getMyBookmarks(): Promise<{
  data: PublicRiff[] | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: [], error: null };
  const { data, error } = await supabase
    .from('bookmarks')
    .select('riff:riffs_public(*)')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false });
  if (error) return { data: null, error: new Error(error.message) };
  // Supabase typings inferrent `riff` comme array sur join — flatten + filter
  // les éventuels nulls (riff supprimé entre temps).
  const rows = (data ?? []) as unknown as Array<{ riff: PublicRiff | PublicRiff[] | null }>;
  const flattened: PublicRiff[] = rows
    .map((r) => (Array.isArray(r.riff) ? r.riff[0] : r.riff))
    .filter((r): r is PublicRiff => !!r);
  return { data: flattened, error: null };
}

// ─── Follows ────────────────────────────────────────────────────────

export async function followUser(userId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  if (me.id === userId) {
    return { data: null, error: new Error('Tu ne peux pas te follow toi-même') };
  }
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: me.id, followed_id: userId });
  return { data: !error, error: error ? new Error(error.message) : null };
}

export async function unfollowUser(userId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', me.id)
    .eq('followed_id', userId);
  return { data: !error, error: error ? new Error(error.message) : null };
}

export async function isFollowing(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return false;
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', me.id)
    .eq('followed_id', userId)
    .maybeSingle();
  return !!data;
}

export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: number;
}> {
  if (!isSupabaseConfigured) return { followers: 0, following: 0 };
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('followed_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

/** Suggestions de profils à suivre (top likes parmi pas suivis). */
export async function getSuggestedRiffeurs(
  myUserId: string | null,
  limit = 5
): Promise<{ data: Profile[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  // MVP : prend les N derniers profils créés qui ne sont pas moi et que je
  // ne suis pas encore. Algo de ranking via likes received à itérer plus tard.
  let alreadyFollowed: string[] = [];
  if (myUserId) {
    const { data: follows } = await supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', myUserId);
    alreadyFollowed = (follows ?? []).map((f) => f.followed_id);
  }
  const exclude = myUserId ? [myUserId, ...alreadyFollowed] : alreadyFollowed;
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (exclude.length > 0) {
    query = query.not('id', 'in', `(${exclude.join(',')})`);
  }
  const { data, error } = await query.limit(limit);
  return {
    data: (data as Profile[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

// ─── Comments ───────────────────────────────────────────────────────

export async function getComments(
  riffId: string
): Promise<{ data: Comment[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .eq('riff_id', riffId)
    .order('created_at', { ascending: false });
  return {
    data: (data as Comment[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

export async function postComment(riffId: string, text: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  const { data, error } = await supabase
    .from('comments')
    .insert({ author_id: me.id, riff_id: riffId, text: text.trim() })
    .select()
    .maybeSingle();
  return { data: data as Comment | null, error: error ? new Error(error.message) : null };
}

export async function deleteComment(commentId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  return { data: !error, error: error ? new Error(error.message) : null };
}

// ─── XP & badges ────────────────────────────────────────────────────

export async function getUserXP(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { data } = await supabase
    .from('xp_events')
    .select('xp_amount')
    .eq('user_id', userId);
  return (data ?? []).reduce((s, r) => s + (r.xp_amount as number), 0);
}

export async function getUserBadges(
  userId: string
): Promise<{ data: { badge_slug: string; unlocked_at: string }[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_slug, unlocked_at')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });
  return {
    data: data ?? null,
    error: error ? new Error(error.message) : null,
  };
}

/** Unlock badge — idempotent (RLS empêche l'auto-unlock, c'est OK pour
 *  l'instant : on l'écrit côté client si auth.uid() === user_id). */
export async function unlockBadgeServer(userId: string, slug: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const { error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_slug: slug });
  // Code 23505 = unique violation → badge déjà unlocked, OK
  if (error && error.code !== '23505') {
    return { data: null, error: new Error(error.message) };
  }
  return { data: !error, error: null };
}

// ─── Battles ────────────────────────────────────────────────────────

export async function getCurrentBattle(): Promise<{
  data: BattleWithRiffs | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) return notConfigured();
  const now = new Date().toISOString();
  const { data: battle, error } = await supabase
    .from('battles')
    .select('*')
    .gt('ends_at', now)
    .order('ends_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !battle) {
    return { data: null, error: error ? new Error(error.message) : null };
  }
  const [{ data: riffA }, { data: riffB }, { count: votesA }, { count: votesB }] =
    await Promise.all([
      supabase
        .from('riffs_public')
        .select('*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url)')
        .eq('id', battle.riff_a_id)
        .maybeSingle(),
      supabase
        .from('riffs_public')
        .select('*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url)')
        .eq('id', battle.riff_b_id)
        .maybeSingle(),
      supabase
        .from('battle_votes')
        .select('*', { count: 'exact', head: true })
        .eq('battle_id', battle.id)
        .eq('voted_for_riff_id', battle.riff_a_id),
      supabase
        .from('battle_votes')
        .select('*', { count: 'exact', head: true })
        .eq('battle_id', battle.id)
        .eq('voted_for_riff_id', battle.riff_b_id),
    ]);
  let myVote: string | null = null;
  const me = (await supabase.auth.getUser()).data.user;
  if (me) {
    const { data: mv } = await supabase
      .from('battle_votes')
      .select('voted_for_riff_id')
      .eq('user_id', me.id)
      .eq('battle_id', battle.id)
      .maybeSingle();
    myVote = (mv as { voted_for_riff_id: string } | null)?.voted_for_riff_id ?? null;
  }
  return {
    data: {
      ...battle,
      riff_a: riffA as PublicRiff | null,
      riff_b: riffB as PublicRiff | null,
      votes_a: votesA ?? 0,
      votes_b: votesB ?? 0,
      my_vote: myVote,
    },
    error: null,
  };
}

export async function voteBattle(battleId: string, riffId: string) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  const { error } = await supabase.from('battle_votes').insert({
    user_id: me.id,
    battle_id: battleId,
    voted_for_riff_id: riffId,
  });
  return { data: !error, error: error ? new Error(error.message) : null };
}

export async function getPastBattles(limit = 5): Promise<{
  data: Battle[] | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) return notConfigured();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .lt('ends_at', now)
    .order('ends_at', { ascending: false })
    .limit(limit);
  return {
    data: (data as Battle[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

// ─── Editor picks ───────────────────────────────────────────────────

export async function getCurrentEditorPicks(): Promise<{
  data: EditorPick[] | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) return notConfigured();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('editor_picks')
    .select('*, riff:riffs_public(*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url))')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: false });
  return {
    data: (data as EditorPick[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

export async function getEditorPicksHistory(limit = 50): Promise<{
  data: EditorPick[] | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) return notConfigured();
  const { data, error } = await supabase
    .from('editor_picks')
    .select('*, riff:riffs_public(*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url))')
    .order('start_date', { ascending: false })
    .limit(limit);
  return {
    data: (data as EditorPick[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

// ─── Notifications ──────────────────────────────────────────────────

export async function getMyNotifications(
  unreadOnly = false
): Promise<{ data: NotificationRow[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: [], error: null };
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(30);
  if (unreadOnly) {
    query = query.is('read_at', null);
  }
  const { data, error } = await query;
  return {
    data: (data as NotificationRow[]) ?? null,
    error: error ? new Error(error.message) : null,
  };
}

export async function markNotificationsRead(ids?: string[]) {
  if (!isSupabaseConfigured) return notConfigured();
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return { data: null, error: new Error('Pas connecté') };
  let query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', me.id);
  if (ids && ids.length > 0) {
    query = query.in('id', ids);
  }
  const { error } = await query;
  return { data: !error, error: error ? new Error(error.message) : null };
}

export async function getUnreadNotifCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const me = (await supabase.auth.getUser()).data.user;
  if (!me) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', me.id)
    .is('read_at', null);
  return count ?? 0;
}

// ─── Leaderboards ───────────────────────────────────────────────────

export type LeaderboardWindow = 'week' | 'month' | 'all';

/** Top N riffs par likes dans la fenêtre. */
export async function getLeaderboardByLikes(
  window: LeaderboardWindow,
  limit = 100
): Promise<{
  data: Array<PublicRiff & { likes_count: number }> | null;
  error: Error | null;
}> {
  if (!isSupabaseConfigured) return notConfigured();
  let since: string | null = null;
  if (window === 'week') {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (window === 'month') {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
  let query = supabase
    .from('riffs_public')
    .select('*, author:profiles!riffs_public_author_id_fkey(username,display_name,avatar_url)')
    .order('published_at', { ascending: false })
    .limit(200); // on prend 200 récents et on trie par likes côté client
  if (since) query = query.gte('published_at', since);
  const { data, error } = await query;
  if (error || !data) {
    return { data: null, error: error ? new Error(error.message) : null };
  }
  const withCounts = await Promise.all(
    (data as PublicRiff[]).map(async (r) => ({
      ...r,
      likes_count: await getLikesCount(r.id),
    }))
  );
  return {
    data: withCounts.sort((a, b) => b.likes_count - a.likes_count).slice(0, limit),
    error: null,
  };
}
