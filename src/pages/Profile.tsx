/**
 * /profile — édition propre du profil utilisateur (sess 29 enrichi).
 *
 * Modifs sess 29 :
 *  - Suppression colonnes `tier` / `language` qui n'existent pas dans le
 *    schéma social (juste id, username, display_name, bio, avatar_url)
 *  - Ajout display_name + avatar upload via socialApi.uploadAvatar
 *  - Lien vers /u/:username pour voir le profil public
 *  - Stats : XP + niveau riffeur via xpSystem
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { LogOut, Save, User as UserIcon, Mail, Calendar, ExternalLink, Upload } from 'lucide-react';
import { getProfile, updateProfile, uploadAvatar, getUserXP, type Profile as ProfileRow } from '@/lib/socialApi';
import { computeLevel } from '@/lib/xpSystem';
import { useToast } from '@/hooks/useToast';

export function Profile() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const level = useMemo(() => computeLevel(xp), [xp]);

  // Redirect Landing si pas loggé (une fois le bootstrap résolu)
  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  // Fetch le profile row à l'arrivée
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await getProfile(user.id);
      if (cancelled) return;
      if (error) {
        setFetchError(error.message);
        return;
      }
      if (data) {
        setProfile(data);
        setUsername(data.username);
        setDisplayName(data.display_name ?? '');
        setBio(data.bio ?? '');
        setAvatarUrl(data.avatar_url);
        const x = await getUserXP(user.id);
        if (!cancelled) setXp(x);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setFetchError(null);
    const { error } = await updateProfile(user.id, {
      username: username.trim(),
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
    });
    setSaving(false);
    if (error) {
      setFetchError(error.message);
      toast.error(error.message);
    } else {
      setSavedAt(Date.now());
      toast.success('Profil mis à jour');
      window.setTimeout(() => setSavedAt(null), 2500);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde (max 2 MB)');
      return;
    }
    setUploading(true);
    const { data: url, error } = await uploadAvatar(user.id, file);
    if (error || !url) {
      toast.error(error?.message ?? 'Upload échoué');
      setUploading(false);
      return;
    }
    // Persist le nouveau avatar_url dans profiles
    await updateProfile(user.id, { avatar_url: url });
    setAvatarUrl(url);
    setUploading(false);
    toast.success('Avatar mis à jour');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !user) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  const createdLabel = profile?.created_at
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(profile.created_at))
    : '—';

  return (
    <>
      <PageHeader
        title="Mon profil"
        subtitle="Édite tes infos publiques et upload ton avatar."
      >
        {profile && (
          <Link
            to={`/u/${profile.username}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 text-xs hover:border-gold-soft"
          >
            <ExternalLink size={13} /> Voir profil public
          </Link>
        )}
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Avatar + identité */}
        <Card className="md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-gold/10 font-mono text-3xl font-bold text-gold">
                {avatarUrl ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (user.email?.[0] ?? '?').toUpperCase()
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:border-gold hover:text-gold">
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => void handleAvatarUpload(e)}
                />
              </label>
            </div>
            {uploading && (
              <div className="mt-2 text-xs text-text-soft">Upload en cours…</div>
            )}
            <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
              <Mail size={13} />
              <span className="font-mono break-all">{user.email}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-text-soft">
              <Calendar size={11} />
              Inscrit le {createdLabel}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
              ⚡ Niveau {level.level} · {level.name}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </Card>

        {/* Form édit */}
        <Card className="md:col-span-2">
          <h3 className="display text-display-sm">Édite ton profil</h3>
          <p className="mt-1 text-sm text-text-muted">
            Ces infos sont publiques sur ta page /u/{profile?.username ?? '…'}.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="profile-username" className="label-small mb-1.5 flex items-center gap-1.5">
                <UserIcon size={11} /> Username (unique)
              </label>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="ex: melvinguitar"
                maxLength={40}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-text-soft">
                Lettres minuscules, chiffres, _ et - uniquement.
              </p>
            </div>
            <div>
              <label htmlFor="profile-display" className="label-small mb-1.5">
                Nom affiché
              </label>
              <input
                id="profile-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ex: Melvin G."
                maxLength={60}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-gold-soft focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="profile-bio" className="label-small mb-1.5">
                Bio
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Genre musical, niveau, ce que tu travailles en ce moment…"
                maxLength={280}
                rows={4}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-gold-soft focus:outline-none"
              />
              <div className="mt-1 text-right text-[10px] text-text-soft">
                {bio.length}/280
              </div>
            </div>

            {fetchError && (
              <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {fetchError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              {savedAt && (
                <span className="text-xs text-success">✓ Sauvegardé</span>
              )}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !username.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
